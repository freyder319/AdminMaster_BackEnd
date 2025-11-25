import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VentaLibre } from './venta-libre.entity';
import { CreateVentaLibreDto } from './dto/create-venta-libre.dto';

@Injectable()
export class VentaLibreService {
  constructor(
    @InjectRepository(VentaLibre)
    private readonly repo: Repository<VentaLibre>,
  ) {}

  async create(dto: CreateVentaLibreDto): Promise<{ id: number }> {
    const entity = this.repo.create({
      nombre: dto.nombre,
      estado: dto.estado,
      fecha_hora: dto.fecha_hora ? new Date(dto.fecha_hora) : undefined,
      productos: dto.productos,
      total: dto.total,
      forma_pago: dto.forma_pago ?? null,
      usuario_id: dto.usuario_id ?? null,
      observaciones: dto.observaciones ?? null,
      tipo_venta: dto.tipo_venta,
      turno_id: dto.turno_id ?? null,
    });
    const saved = await this.repo.save(entity);
    return { id: saved.id };
  }

  async findAll(): Promise<VentaLibre[]> {
    return this.repo.find({ order: { id: 'DESC' } as any });
  }
}
