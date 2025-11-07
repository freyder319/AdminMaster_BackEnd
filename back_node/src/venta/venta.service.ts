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

    // Aplicar descuento si corresponde
    let descuentoPercent = 0;
    if (dto.descuentoId) {
      const desc = await this.descuentoRepo.findOne({ where: { id: dto.descuentoId } });
      if (desc) {
        descuentoPercent = Math.max(0, Math.min(100, Number(desc.porcentaje)));
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
      relations: ['items', 'items.producto'],
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
}
