import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Turno } from './turno.entity';
import { IniciarTurnoDto } from './dto/iniciar-turno.dto';
import { CerrarTurnoDto } from './dto/cerrar-turno.dto';
import { CajaMovimiento } from '../caja/caja-mov.entity';
import { UsuarioService } from '../users/users.service';
import { EmpleadoService } from '../empleado/empleado.service';
import { TurnoLog } from './turno-log.entity';
import { Venta } from '../venta/venta.entity';
import { VentaLibre } from '../venta-libre/venta-libre.entity';
import { GastoEntity } from '../gasto/gasto.entity';
import { AsignacionCajaTurno } from './asignacion-caja-turno.entity';
import { AuditoriaCaja } from './auditoria-caja.entity';
import { CajaService } from '../caja/caja.service';
import { RegistroTurno } from './registro-turno.entity';

@Injectable()
export class TurnoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Turno) private readonly turnoRepo: Repository<Turno>,
    @InjectRepository(CajaMovimiento) private readonly cajaRepo: Repository<CajaMovimiento>,
    @InjectRepository(TurnoLog) private readonly logRepo: Repository<TurnoLog>,
    @InjectRepository(Venta) private readonly ventaRepo: Repository<Venta>,
    @InjectRepository(VentaLibre) private readonly ventaLibreRepo: Repository<VentaLibre>,
    @InjectRepository(GastoEntity) private readonly gastoRepo: Repository<GastoEntity>,
    @InjectRepository(AsignacionCajaTurno) private readonly asignacionRepo: Repository<AsignacionCajaTurno>,
    @InjectRepository(AuditoriaCaja) private readonly auditoriaRepo: Repository<AuditoriaCaja>,
    private readonly usuarioService: UsuarioService,
    private readonly empleadoService: EmpleadoService,
    private readonly cajaService: CajaService,
  ) {}

  async getTurnoActivo(usuarioId: number) {
    return this.turnoRepo.findOne({ where: { usuarioId, finTurno: IsNull() } });
  }

  async getResumenActivo(usuarioId: number) {
    const activo = await this.getTurnoActivo(usuarioId);
    if (!activo) throw new NotFoundException('No hay turno activo');
    return this.composeResumen(this.dataSource.manager, activo.id);
  }

  async iniciarTurno(usuarioId: number, dto: IniciarTurnoDto) {
    const activo = await this.getTurnoActivo(usuarioId);
    if (activo) throw new BadRequestException('Ya existe un turno activo');

    return this.dataSource.transaction(async (manager) => {
      let registro: RegistroTurno | null = null;
      if (dto.registroTurnoId) {
        registro = await manager.findOne(RegistroTurno, { where: { id: dto.registroTurnoId } });
        if (!registro) {
          throw new BadRequestException('Registro de turno no encontrado');
        }
      }

      const apertura = manager.create(CajaMovimiento, {
        usuarioId,
        tipo: 'APERTURA',
        monto: dto.montoInicial,
      });
      await manager.save(CajaMovimiento, apertura);

      const turno = manager.create(Turno, {
        usuarioId,
        observaciones: dto.observaciones ?? (registro ? registro.notas || undefined : undefined),
        aperturaCajaId: apertura.id,
      });
      await manager.save(Turno, turno);

      let cajaId: number | null = null;
      try {
        const caja = await this.cajaService.findCajaByUsuarioId(usuarioId, false);
        if (caja) {
          cajaId = caja.id;
        } else {
          const cajaEmpleado = await this.cajaService.findCajaByUsuarioId(usuarioId, true);
          cajaId = cajaEmpleado ? cajaEmpleado.id : null;
        }
      } catch {}

      const asignacion = manager.create(AsignacionCajaTurno, {
        usuarioId,
        empleadoId: null,
        cajaId,
        turnoId: turno.id,
        horaLiberacion: null,
      });
      await manager.save(AsignacionCajaTurno, asignacion);

      if (registro) {
        registro.turnoId = turno.id;
        await manager.save(RegistroTurno, registro);
      }

      return this.composeResumen(manager, turno.id);
    });
  }

  async cerrarTurno(usuarioId: number, dto: CerrarTurnoDto) {
    const activo = await this.getTurnoActivo(usuarioId);
    if (!activo) throw new BadRequestException('No hay turno activo');

    return this.dataSource.transaction(async (manager) => {
      const cierre = manager.create(CajaMovimiento, {
        usuarioId,
        tipo: 'CIERRE',
        monto: dto.montoFinal,
      });
      await manager.save(CajaMovimiento, cierre);

      const fechaCierre = new Date();
      await manager.update(Turno, { id: activo.id }, { finTurno: fechaCierre, cierreCajaId: cierre.id });

      const asignacion = await manager.findOne(AsignacionCajaTurno, { where: { turnoId: activo.id, horaLiberacion: IsNull() } });
      if (asignacion) {
        asignacion.horaLiberacion = fechaCierre;
        await manager.save(AsignacionCajaTurno, asignacion);
      }

      const resumen = await this.composeResumen(manager, activo.id);

      // Resolver nombre del empleado/usuario para registrar en observaciones
      const { nombre, apellido } = await this.resolveNombre(usuarioId);
      const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ');

      // Actualizar estado del registro de turno vinculado (cumplido/incumplido)
      const registro = await manager.findOne(RegistroTurno, { where: { turnoId: activo.id } });
      if (registro) {
        // Normalizar horas de registro a minutos
        const [desdeH, desdeM] = (registro.horaDesde || '00:00').split(':').map(v => Number(v));
        const [hastaH, hastaM] = (registro.horaHasta || '23:59').split(':').map(v => Number(v));
        const desdeMin = (Number.isFinite(desdeH) && Number.isFinite(desdeM)) ? desdeH * 60 + desdeM : 0;
        const hastaMin = (Number.isFinite(hastaH) && Number.isFinite(hastaM)) ? hastaH * 60 + hastaM : 23 * 60 + 59;

        const inicio = resumen.turno?.inicioTurno ? new Date(resumen.turno.inicioTurno) : fechaCierre;
        const fin = resumen.turno?.finTurno ? new Date(resumen.turno.finTurno) : fechaCierre;

        const inicioMin = inicio.getHours() * 60 + inicio.getMinutes();
        const finMin = fin.getHours() * 60 + fin.getMinutes();

        // Tolerancia de 5 minutos antes y después del rango configurado
        const tolerancia = 5;
        const desdeConTol = Math.max(0, desdeMin - tolerancia);
        const hastaConTol = Math.min(23 * 60 + 59, hastaMin + tolerancia);

        if (inicioMin >= desdeConTol && finMin <= hastaConTol) {
          (registro as any).estado = 'cumplido';
          const baseMsg = 'El Turno fue Cumplido dentro del horario establecido (con tolerancia de 5 minutos).';
          (registro as any).observacionEstado = nombreCompleto
            ? `${baseMsg} Responsable: ${nombreCompleto}.`
            : baseMsg;
        } else {
          (registro as any).estado = 'incumplido';

          let detalle: string;
          if (inicioMin > hastaConTol) {
            detalle = 'El Turno se inició después del horario establecido.';
          } else if (finMin > hastaConTol) {
            detalle = 'El Turno se cerró después del horario establecido.';
          } else if (inicioMin < desdeConTol) {
            detalle = 'El Turno se inició antes del horario establecido.';
          } else {
            detalle = 'El Turno no se ajustó al horario establecido.';
          }

          (registro as any).observacionEstado = nombreCompleto
            ? `El Turno fue Incumplido. ${detalle} Responsable: ${nombreCompleto}.`
            : `El Turno fue Incumplido. ${detalle}`;
        }
        await manager.save(RegistroTurno, registro);
      }

      const saldoInicial = resumen.aperturaCaja ? Number(resumen.aperturaCaja.montoInicial || 0) : 0;
      const saldoFinal = resumen.cierreCaja ? Number(resumen.cierreCaja.montoFinal || dto.montoFinal || 0) : Number(dto.montoFinal || 0);
      const totalVentas = Number(resumen.actividad.totalVentas || 0) + Number(resumen.actividad.totalVentasLibres || 0);
      const totalGastos = Number(resumen.actividad.totalGastos || 0);
      const saldoEsperado = saldoInicial + totalVentas - totalGastos;
      const diferencia = saldoFinal - saldoEsperado;

      const auditoria = manager.create(AuditoriaCaja, {
        turnoId: activo.id,
        usuarioId,
        cajaId: asignacion ? asignacion.cajaId : null,
        saldoInicial,
        saldoFinal,
        saldoEsperado,
        diferencia,
      });
      await manager.save(AuditoriaCaja, auditoria);

      return resumen;
    });
  }

  async getUltimoTurno(empleadoId: number) {
    const turno = await this.turnoRepo.findOne({
      where: { usuarioId: empleadoId, finTurno: Not(IsNull()) },
      order: { finTurno: 'DESC' as any },
    });
    if (!turno) throw new NotFoundException('No hay turnos cerrados');
    return this.composeResumen(this.dataSource.manager, turno.id);
  }

  async listAuditoriaCaja(params: {
    from?: string;
    to?: string;
    usuarioId?: number;
    cajaId?: number;
  }) {
    const qb = this.auditoriaRepo.createQueryBuilder('a');

    if (params.usuarioId) {
      qb.andWhere('a.usuarioId = :uid', { uid: params.usuarioId });
    }
    if (params.cajaId) {
      qb.andWhere('a.cajaId = :cid', { cid: params.cajaId });
    }
    if (params.from) {
      qb.andWhere('a.fechaHoraCierre >= :from', { from: new Date(params.from) });
    }
    if (params.to) {
      const to = new Date(params.to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('a.fechaHoraCierre <= :to', { to });
    }

    qb.orderBy('a.fechaHoraCierre', 'DESC');
    return qb.getMany();
  }

  async getResumenPorEmpleado(empleadoId: number) {
    const activo = await this.getTurnoActivo(empleadoId);
    if (activo) return this.composeResumen(this.dataSource.manager, activo.id);
    return this.getUltimoTurno(empleadoId);
  }

  async reporteHorasPorEmpleado(params?: { from?: string; to?: string }) {
    const qb = this.turnoRepo.createQueryBuilder('t');

    qb.select('t.usuarioId', 'usuarioId')
      .addSelect(
        "COALESCE(SUM(EXTRACT(EPOCH FROM (t.finTurno - t.inicioTurno)) / 3600), 0)",
        'horasTrabajadas',
      )
      .where('t.finTurno IS NOT NULL');

    if (params?.from) {
      qb.andWhere('t.inicioTurno >= :from', { from: new Date(params.from) });
    }
    if (params?.to) {
      const to = new Date(params.to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('t.finTurno <= :to', { to });
    }

    qb.groupBy('t.usuarioId').orderBy('"horasTrabajadas"', 'DESC');

    const rows = await qb.getRawMany<{ usuarioId: number; horasTrabajadas: string }>();
    return rows.map(r => ({
      usuarioId: Number(r.usuarioId),
      horasTrabajadas: Number(r.horasTrabajadas || 0),
    }));
  }

  async listActivos() {
    const activos = await this.turnoRepo.find({ where: { finTurno: IsNull() } });
    const res: Array<{ usuarioId: number; correo: string; nombre?: string; apellido?: string; resumen: any }> = [];
    for (const t of activos) {
      const resumen = await this.composeResumen(this.dataSource.manager, t.id);
      const correo = await this.resolveCorreo(t.usuarioId);
      const { nombre, apellido } = await this.resolveNombre(t.usuarioId);
      res.push({ usuarioId: t.usuarioId, correo, nombre, apellido, resumen });
    }
    return res;
  }

  async listCerrados() {
    const cerrados = await this.turnoRepo.find({ where: { finTurno: Not(IsNull()) }, order: { finTurno: 'DESC' as any } });
    const res: Array<{ usuarioId: number; correo: string; nombre?: string; apellido?: string; resumen: any }> = [];
    for (const t of cerrados) {
      const resumen = await this.composeResumen(this.dataSource.manager, t.id);
      const correo = await this.resolveCorreo(t.usuarioId);
      const { nombre, apellido } = await this.resolveNombre(t.usuarioId);
      res.push({ usuarioId: t.usuarioId, correo, nombre, apellido, resumen });
    }
    return res;
  }

  async listActivosYCerrados() {
    const [activos, cerrados] = await Promise.all([
      this.listActivos(),
      this.listCerrados(),
    ]);
    return { activos, cerrados };
  }

  private async resolveCorreo(usuarioId: number): Promise<string> {
    try {
      const usuario = await this.usuarioService.findById(usuarioId);
      if (usuario?.correo) return usuario.correo;
    } catch {}
    try {
      const empleado = await this.empleadoService.findById(usuarioId);
      if (empleado?.correo) return empleado.correo;
    } catch {}
    return '';
  }

  private async resolveNombre(usuarioId: number): Promise<{ nombre?: string; apellido?: string }> {
    try {
      const empleado = await this.empleadoService.findById(usuarioId);
      if (empleado) {
        return { nombre: (empleado as any).nombre || undefined, apellido: (empleado as any).apellido || undefined };
      }
    } catch {}
    // Si en el futuro Usuario tiene campos de nombre, se pueden mapear aquí.
    return {};
  }

  private async composeResumen(manager: any, turnoId: number) {
    const turno = await manager.findOne(Turno, { where: { id: turnoId } });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    const apertura = turno.aperturaCajaId
      ? await manager.findOne(CajaMovimiento, { where: { id: turno.aperturaCajaId } })
      : null;
    const cierre = turno.cierreCajaId
      ? await manager.findOne(CajaMovimiento, { where: { id: turno.cierreCajaId } })
      : null;

    // Resolver caja utilizada (si aplica) por usuario
    let cajaNombre: string | null = null;
    let cajaCodigo: string | null = null;
    let cajaId: number | null = null;
    try {
      const caja = await this.cajaService.findCajaByUsuarioId(turno.usuarioId, false) || await this.cajaService.findCajaByUsuarioId(turno.usuarioId, true);
      if (caja) {
        cajaId = (caja as any).id ?? null;
        cajaNombre = (caja as any).nombre ?? null;
        cajaCodigo = (caja as any).codigoCaja ?? null;
      }
    } catch {}

    // Ventas del turno: totales y conteo
    const ventas = await this.ventaRepo.find({
      where: { turnoId },
      relations: ['items', 'items.producto'],
    });
    let totalVentas = 0;
    for (const v of ventas) totalVentas += Number((v as any).total || 0);
    const transacciones = ventas.length;

    // Ventas libres del turno: totales y conteo
    const ventasLibres = await this.ventaLibreRepo.find({ where: { turno_id: turnoId } });
    let totalVentasLibres = 0;
    for (const v of ventasLibres) totalVentasLibres += Number((v as any).total || 0);
    const transaccionesLibres = ventasLibres.length;

    // Gastos del turno: totales y conteo
    const gastos = await this.gastoRepo.find({ where: { turnoId }, select: ['id', 'monto', 'nombre', 'forma_pago'] as any, order: { id: 'DESC' as any } });
    let totalGastos = 0;
    for (const g of gastos) totalGastos += Number((g as any).monto || 0);
    const cantidadGastos = gastos.length;

    // Logs del turno (conteos por tipo y últimos eventos) - opcional
    const logs = await this.logRepo.find({ where: { turnoId }, order: { fecha: 'DESC' as any }, take: 20 });
    const countsByTipo: Record<string, number> = {};
    for (const l of await this.logRepo.find({ where: { turnoId } })) {
      countsByTipo[l.tipo] = (countsByTipo[l.tipo] || 0) + 1;
    }

    return {
      turno: {
        inicioTurno: turno.inicioTurno,
        finTurno: turno.finTurno || null,
        observaciones: turno.observaciones || null,
      },
      caja: cajaId ? { id: cajaId, nombre: cajaNombre, codigoCaja: cajaCodigo } : null,
      aperturaCaja: apertura ? { fecha: apertura.fecha, montoInicial: Number(apertura.monto) } : null,
      cierreCaja: cierre ? { fecha: cierre.fecha, montoFinal: Number(cierre.monto) } : null,
      actividad: {
        totalVentas,
        transacciones,
        totalVentasLibres,
        transaccionesLibres,
        totalGastos,
        cantidadGastos,
        // listas resumidas (incluyen todos los productos cuando aplica)
        ventas: ventas.map((v: any) => {
          const productos = Array.isArray(v.items)
            ? v.items.map((item: any) => ({
                nombre: item?.producto?.nombreProducto ?? null,
                cantidad: item?.cantidad ?? null,
                subtotal: Number(item?.subtotal || 0),
              }))
            : [];
          const item0 = productos.length > 0 ? productos[0] : null;
          const nombre = item0?.nombre ?? null;
          const cantidad = item0?.cantidad ?? null;
          return {
            id: v.id,
            total: Number(v.total || 0),
            nombre,
            cantidad,
            productos,
          };
        }),
        ventasLibres: ventasLibres.map((v: any) => {
          const productos = Array.isArray(v.productos)
            ? v.productos.map((p: any) => ({
                nombre: p?.nombre ?? null,
                cantidad: p?.cantidad ?? null,
                subtotal: Number(p?.subtotal || 0),
              }))
            : [];
          const prod0 = productos.length > 0 ? productos[0] : null;
          const nombre = prod0?.nombre ?? null;
          const cantidad = prod0?.cantidad ?? null;
          return {
            id: v.id,
            total: Number(v.total || 0),
            nombre,
            cantidad,
            productos,
          };
        }),
        gastos: gastos.map(g => ({ id: (g as any).id, monto: Number((g as any).monto || 0), nombre: (g as any).nombre || null, forma_pago: (g as any).forma_pago || null })),
      },
      actividadLogs: { countsByTipo, ultimos: logs },
    };
  }
}
