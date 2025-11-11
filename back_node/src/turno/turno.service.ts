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
    private readonly usuarioService: UsuarioService,
    private readonly empleadoService: EmpleadoService,
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
      const apertura = manager.create(CajaMovimiento, {
        usuarioId,
        tipo: 'APERTURA',
        monto: dto.montoInicial,
      });
      await manager.save(CajaMovimiento, apertura);

      const turno = manager.create(Turno, {
        usuarioId,
        observaciones: dto.observaciones,
        aperturaCajaId: apertura.id,
      });
      await manager.save(Turno, turno);

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

      await manager.update(Turno, { id: activo.id }, { finTurno: new Date(), cierreCajaId: cierre.id });

      return this.composeResumen(manager, activo.id);
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

  async getResumenPorEmpleado(empleadoId: number) {
    const activo = await this.getTurnoActivo(empleadoId);
    if (activo) return this.composeResumen(this.dataSource.manager, activo.id);
    return this.getUltimoTurno(empleadoId);
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

    // Ventas del turno: totales y conteo
    const ventas = await this.ventaRepo.find({ where: { turnoId }, select: ['id', 'total'] as any });
    let totalVentas = 0;
    for (const v of ventas) totalVentas += Number((v as any).total || 0);
    const transacciones = ventas.length;

    // Ventas libres del turno: totales y conteo
    const ventasLibres = await this.ventaLibreRepo.find({ where: { turno_id: turnoId }, select: ['id', 'total'] as any });
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
      aperturaCaja: apertura ? { fecha: apertura.fecha, montoInicial: Number(apertura.monto) } : null,
      cierreCaja: cierre ? { fecha: cierre.fecha, montoFinal: Number(cierre.monto) } : null,
      actividad: {
        totalVentas,
        transacciones,
        totalVentasLibres,
        transaccionesLibres,
        totalGastos,
        cantidadGastos,
        // listas resumidas
        ventas: ventas.map(v => ({ id: (v as any).id, total: Number((v as any).total || 0) })),
        ventasLibres: ventasLibres.map(v => ({ id: (v as any).id, total: Number((v as any).total || 0) })),
        gastos: gastos.map(g => ({ id: (g as any).id, monto: Number((g as any).monto || 0), nombre: (g as any).nombre || null, forma_pago: (g as any).forma_pago || null })),
      },
      actividadLogs: { countsByTipo, ultimos: logs },
    };
  }
}
