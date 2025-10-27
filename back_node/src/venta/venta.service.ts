import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Venta } from './venta.entity';
import { VentaItem } from './venta-item.entity';
import { Producto } from 'src/producto/producto.entity';
import { CreateVentaDto } from './dto/create-venta.dto';

@Injectable()
export class VentaService {
  constructor(
    @InjectRepository(Venta) private ventaRepo: Repository<Venta>,
    @InjectRepository(VentaItem) private itemRepo: Repository<VentaItem>,
    @InjectRepository(Producto) private productoRepo: Repository<Producto>,
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

    const venta = new Venta();
    venta.total = dto.total;
    venta.forma_pago = dto.forma_pago;
    if (meta) {
      venta.usuarioId = meta.usuarioId ?? null;
      venta.turnoId = meta.turnoId ?? null;
    }

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
    // Normalizar tipos numéricos y fechas a strings ISO legibles si es necesario
    return rows.map((v) => ({
      ...v,
      total: Number(v.total),
      fecha_hora: v.fecha_hora instanceof Date ? v.fecha_hora.toISOString() : v.fecha_hora,
    }));
  }
}
