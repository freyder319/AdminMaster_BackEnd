import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DescuentoEntity } from './descuento.entity';
import { Venta } from '../venta/venta.entity';

@Injectable()
export class DescuentoService {
  constructor(
    @InjectRepository(DescuentoEntity)
    private readonly repo: Repository<DescuentoEntity>,
    @InjectRepository(Venta)
    private readonly ventaRepo: Repository<Venta>,
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

    // Normalizar tipo y vigencia básica
    const rawTipo = (data as any)?.tipo || 'PORCENTAJE';
    const tipo = String(rawTipo).toUpperCase() === 'VALOR_FIJO' ? 'VALOR_FIJO' : 'PORCENTAJE';

    const fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : undefined;
    const fechaFin = data.fechaFin ? new Date(data.fechaFin) : undefined;

    const activo = typeof data.activo === 'boolean' ? data.activo : true;

    const entity = this.repo.create({
      nombre,
      porcentaje,
      creadoEn,
      tipo,
      fechaInicio: fechaInicio && !isNaN(fechaInicio.getTime()) ? fechaInicio : undefined,
      fechaFin: fechaFin && !isNaN(fechaFin.getTime()) ? fechaFin : undefined,
      activo,
    });
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

    if (typeof (changes as any).tipo !== 'undefined') {
      const rawTipo = (changes as any).tipo;
      const tipo = String(rawTipo).toUpperCase();
      if (tipo !== 'PORCENTAJE' && tipo !== 'VALOR_FIJO') {
        throw new BadRequestException('Tipo de promoción inválido');
      }
      item.tipo = tipo as any;
    }

    if (typeof changes.fechaInicio !== 'undefined') {
      const d = changes.fechaInicio ? new Date(changes.fechaInicio) : undefined;
      item.fechaInicio = d && !isNaN(d.getTime()) ? d : null;
    }

    if (typeof changes.fechaFin !== 'undefined') {
      const d = changes.fechaFin ? new Date(changes.fechaFin) : undefined;
      item.fechaFin = d && !isNaN(d.getTime()) ? d : null;
    }

    if (typeof changes.activo !== 'undefined') {
      item.activo = !!changes.activo;
    }
    return this.repo.save(item);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      // Verificar explícitamente si hay ventas usando este descuento
      const relacionado = await this.ventaRepo.count({ where: { descuentoId: id } });
      if (relacionado > 0) {
        throw new BadRequestException({
          code: 'VENTA_DESCUENTO_RELACIONADO',
          message: 'No se puede eliminar el descuento porque está vinculado a una o más ventas.',
        });
      }

      const res = await this.repo.delete(id);
      if (!res.affected) throw new NotFoundException(`Descuento ${id} no encontrado`);
      return { deleted: true };
    } catch (err: any) {
      const code = err?.code || err?.driverError?.code;
      const detail = err?.detail || err?.driverError?.detail;
      const isFk = code === '23503' || (typeof detail === 'string' && detail.toLowerCase().includes('llave foránea'));
      if (isFk) {
        throw new BadRequestException({
          code: '23503',
          message: 'No se puede eliminar el descuento porque tiene registros relacionados.'
        });
      }
      throw err;
    }
  }
}
