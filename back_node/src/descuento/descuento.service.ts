import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DescuentoEntity } from './descuento.entity';

@Injectable()
export class DescuentoService {
  constructor(
    @InjectRepository(DescuentoEntity)
    private readonly repo: Repository<DescuentoEntity>,
  ) {}

  async create(data: Partial<DescuentoEntity>): Promise<DescuentoEntity> {
    const nombre = (data.nombre || '').trim();
    if (!nombre) throw new BadRequestException('Nombre requerido');
    const porcentaje = Number(data.porcentaje);
    if (!Number.isFinite(porcentaje) || porcentaje < 1 || porcentaje > 100) {
      throw new BadRequestException('Porcentaje inválido (1-100)');
    }
    const existe = await this.repo.findOne({ where: { nombre } });
    if (existe) throw new BadRequestException('Descuento ya registrado');
    const creadoEn = data.creadoEn ? String(data.creadoEn) : String(Date.now());
    const entity = this.repo.create({ nombre, porcentaje, creadoEn });
    return this.repo.save(entity);
  }

  findAll(): Promise<DescuentoEntity[]> {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<DescuentoEntity> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Descuento ${id} no encontrado`);
    return item;
  }

  async update(id: number, changes: Partial<DescuentoEntity>): Promise<DescuentoEntity> {
    const item = await this.findOne(id);
    if (changes.nombre) {
      const nombre = changes.nombre.trim();
      const existe = await this.repo.findOne({ where: { nombre } });
      if (existe && existe.id !== id) throw new BadRequestException('Nombre ya usado');
      item.nombre = nombre;
    }
    if (typeof changes.porcentaje !== 'undefined') {
      const porcentaje = Number(changes.porcentaje);
      if (!Number.isFinite(porcentaje) || porcentaje < 1 || porcentaje > 100) {
        throw new BadRequestException('Porcentaje inválido (1-100)');
      }
      item.porcentaje = porcentaje;
    }
    return this.repo.save(item);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
