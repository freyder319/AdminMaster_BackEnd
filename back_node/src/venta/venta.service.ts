import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Venta } from './venta.entity';
import { VentaItem } from './venta-item.entity';
import { Producto } from 'src/producto/producto.entity';
import { CreateVentaDto } from './dto/create-venta.dto';
import { DescuentoEntity } from '../descuento/descuento.entity';

@Injectable()
export class VentaService {
  constructor(
    @InjectRepository(Venta) private ventaRepo: Repository<Venta>,
    @InjectRepository(VentaItem) private itemRepo: Repository<VentaItem>,
    @InjectRepository(Producto) private productoRepo: Repository<Producto>,
    @InjectRepository(DescuentoEntity) private descuentoRepo: Repository<DescuentoEntity>,
  ) {}

  async create(dto: CreateVentaDto, meta?: { usuarioId?: number | null; turnoId?: number | null }): Promise<{ id: number }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La venta debe tener items');
    }

    // Validar y reservar stock
    const productos = new Map<number, Producto>();
    for (const it of dto.items) {
      const p = await this.productoRepo.findOne({ where: { id: it.productoId } });
      if (!p) throw new BadRequestException(`Producto ${it.productoId} no existe`);
      if (p.stockProducto < it.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${p.nombreProducto}`);
      }
      productos.set(it.productoId, p);
    }

    // Descontar stock en memoria
    for (const it of dto.items) {
      const p = productos.get(it.productoId)!;
      p.stockProducto = p.stockProducto - it.cantidad;
    }

    // Persistir: primero productos (stock), luego venta e items
    await this.productoRepo.save(Array.from(productos.values()));

    // Calcular total de items
    const itemsTotal = dto.items.reduce((sum, it) => sum + Number(it.subtotal), 0);

    // Aplicar descuento si corresponde y si la promoción está activa/vigente
    let descuentoPercent = 0;
    if (dto.descuentoId) {
      const desc = await this.descuentoRepo.findOne({ where: { id: dto.descuentoId } });
      if (desc) {
        const ahora = new Date();
        const dentroInicio = !desc.fechaInicio || desc.fechaInicio <= ahora;
        const dentroFin = !desc.fechaFin || desc.fechaFin >= ahora;
        const vigente = dentroInicio && dentroFin;
        const activa = (desc as any).activo !== false;

        if (vigente && activa) {
          // Por ahora solo usamos porcentaje; tipos futuros como VALOR_FIJO se podrán manejar aquí
          descuentoPercent = Math.max(0, Math.min(100, Number(desc.porcentaje)));
        }
      }
    }
    const discountAmount = Math.round(itemsTotal * (descuentoPercent / 100));
    const computedTotal = Math.max(0, Math.round(itemsTotal - discountAmount));

    // Validar vs total recibido
    const received = Math.round(Number(dto.total));
    if (Number.isFinite(received) && Math.abs(received - computedTotal) > 1) {
      // Ajustamos al valor correcto del server
      // También podríamos lanzar error si prefieres estricta validación
      // throw new BadRequestException('Total inválido según descuento aplicado');
    }

    const venta = new Venta();
    venta.total = computedTotal;
    venta.forma_pago = dto.forma_pago;
    // estado: confirmada o pendiente (por defecto confirmada)
    (venta as any).estado = (dto as any).estado ?? 'confirmada';
    venta.clienteId = dto.clienteId ?? null;
    if (meta) {
      venta.usuarioId = meta.usuarioId ?? null;
      venta.turnoId = meta.turnoId ?? null;
    }
    venta.descuentoId = dto.descuentoId ?? null;

    const items: VentaItem[] = [];
    for (const it of dto.items) {
      const item = new VentaItem();
      item.producto = productos.get(it.productoId)!;
      item.cantidad = it.cantidad;
      item.precio = it.precio;
      item.subtotal = it.subtotal;
      items.push(item);
    }

    venta.items = items;

    const saved = await this.ventaRepo.save(venta);
    return { id: saved.id };
  }

  async findAll(params?: { forma_pago?: string; from?: string; to?: string; limit?: number }): Promise<any[]> {
    const take = params?.limit && Number(params.limit) > 0 ? Number(params.limit) : undefined;
    const where: any = {};
    if (params?.forma_pago) where.forma_pago = params.forma_pago;
    // Rango de fechas si está disponible
    if (params?.from || params?.to) {
      const from = params.from ? new Date(params.from) : undefined;
      const to = params.to ? new Date(params.to) : undefined;
      if (from && to) {
        where.fecha_hora = Between(from, to);
      } else if (from) {
        where.fecha_hora = MoreThanOrEqual(from);
      } else if (to) {
        where.fecha_hora = LessThanOrEqual(to);
      }
    }
    const rows = await this.ventaRepo.find({
      where,
      order: { id: 'DESC' },
      relations: ['items', 'items.producto', 'cliente'],
      take,
    });
    // Traer info de descuentos en lote
    const descuentoIds = Array.from(new Set(rows.map(r => r.descuentoId).filter(Boolean))) as number[];
    const descuentos = descuentoIds.length > 0
      ? await this.descuentoRepo.find({ where: { id: In(descuentoIds) } })
      : [];
    const descMap = new Map<number, DescuentoEntity>();
    for (const d of descuentos) descMap.set(d.id, d);

    // Normalizar tipos y adjuntar datos de descuento
    return rows.map((v) => {
      const dto: any = {
        ...v,
        total: Number(v.total),
        fecha_hora: v.fecha_hora instanceof Date ? v.fecha_hora.toISOString() : v.fecha_hora,
      };
      if (v.descuentoId) {
        const d = descMap.get(v.descuentoId);
        if (d) {
          dto.descuentoId = d.id;
          dto.descuentoNombre = d.nombre;
          dto.descuentoPorcentaje = d.porcentaje;
        }
      }
      return dto;
    });
  }

  async reporteVentasPorEmpleado(params?: { from?: string; to?: string }) {
    const qb = this.ventaRepo.createQueryBuilder('v');

    qb.select('v.usuarioId', 'usuarioId')
      .addSelect('COUNT(v.id)', 'cantidadVentas')
      .addSelect('COALESCE(SUM(v.total), 0)', 'totalVentas')
      .where('v.usuarioId IS NOT NULL');

    if (params?.from) {
      qb.andWhere('v.fecha_hora >= :from', { from: new Date(params.from) });
    }
    if (params?.to) {
      const to = new Date(params.to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('v.fecha_hora <= :to', { to });
    }

    qb.groupBy('v.usuarioId').orderBy('"totalVentas"', 'DESC');

    const rows = await qb.getRawMany<{ usuarioId: number; cantidadVentas: string; totalVentas: string }>();
    return rows.map((r) => ({
      usuarioId: Number(r.usuarioId),
      cantidadVentas: Number(r.cantidadVentas || 0),
      totalVentas: Number(r.totalVentas || 0),
    }));
  }

  async reporteVentasPorProducto(params?: { from?: string; to?: string }) {
    const qb = this.itemRepo.createQueryBuilder('vi')
      .innerJoin('vi.venta', 'v')
      .innerJoin('vi.producto', 'p');

    qb.select('p.id', 'productoId')
      .addSelect('p.nombreProducto', 'nombreProducto')
      .addSelect('COALESCE(SUM(vi.cantidad), 0)', 'cantidadVendida')
      .addSelect('COALESCE(SUM(vi.subtotal), 0)', 'totalVendido')
      .where('v.estado = :estado', { estado: 'confirmada' });

    if (params?.from) {
      qb.andWhere('v.fecha_hora >= :from', { from: new Date(params.from) });
    }
    if (params?.to) {
      const to = new Date(params.to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('v.fecha_hora <= :to', { to });
    }

    qb.groupBy('p.id').addGroupBy('p.nombreProducto').orderBy('"totalVendido"', 'DESC');

    const rows = await qb.getRawMany<{ productoId: number; nombreProducto: string; cantidadVendida: string; totalVendido: string }>();
    return rows.map((r) => ({
      productoId: Number(r.productoId),
      nombreProducto: r.nombreProducto,
      cantidadVendida: Number(r.cantidadVendida || 0),
      totalVendido: Number(r.totalVendido || 0),
    }));
  }

  async reporteVentasPorCategoria(params?: { from?: string; to?: string }) {
    const qb = this.itemRepo.createQueryBuilder('vi')
      .innerJoin('vi.venta', 'v')
      .innerJoin('vi.producto', 'p')
      .leftJoin('p.categoria', 'c');

    qb.select('c.idCategoria', 'categoriaId')
      .addSelect('c.nombreCategoria', 'nombreCategoria')
      .addSelect('COALESCE(SUM(vi.cantidad), 0)', 'cantidadVendida')
      .addSelect('COALESCE(SUM(vi.subtotal), 0)', 'totalVendido')
      .where('v.estado = :estado', { estado: 'confirmada' });

    if (params?.from) {
      qb.andWhere('v.fecha_hora >= :from', { from: new Date(params.from) });
    }
    if (params?.to) {
      const to = new Date(params.to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('v.fecha_hora <= :to', { to });
    }

    const rows = await qb.getRawMany<{ categoriaId: number | null; nombreCategoria: string | null; cantidadVendida: string; totalVendido: string }>();
    return rows.map((r) => ({
      categoriaId: r.categoriaId != null ? Number(r.categoriaId) : null,
      nombreCategoria: r.nombreCategoria || 'Sin categoría',
      cantidadVendida: Number(r.cantidadVendida || 0),
      totalVendido: Number(r.totalVendido || 0),
    }));
  }

  async actualizarEstado(id: number, estado: 'confirmada' | 'pendiente') {
    const venta = await this.ventaRepo.findOne({ where: { id } });
    if (!venta) {
      throw new BadRequestException('Venta no encontrada');
    }
    (venta as any).estado = estado;
    const saved = await this.ventaRepo.save(venta);
    return { id: saved.id, estado: (saved as any).estado };
  }
}
