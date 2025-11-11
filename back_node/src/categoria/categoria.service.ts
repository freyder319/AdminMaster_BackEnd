import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { categoria } from './categoria.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(categoria)
    private categoriaRepo: Repository<categoria>,
  ) {}
  async create(data: Partial<categoria>): Promise<categoria> {
    const nombre = String(data?.nombreCategoria || '').trim();
    if (!nombre) throw new BadRequestException('Nombre requerido');
    const normalizado = nombre.toLowerCase();
    const categoriaExistente = await this.categoriaRepo.findOne({
      where: { nombreNormalizado: normalizado },
    });
    if (categoriaExistente) {
      throw new BadRequestException('La categoría ya se encuentra registrada');
    }
    const categoria = await this.categoriaRepo.create({ ...data, nombreCategoria: nombre, nombreNormalizado: normalizado });
    return this.categoriaRepo.save(categoria);
  }

  findAll(): Promise<categoria[]> {
    return this.categoriaRepo.find();
  }

  async findOne(id: number): Promise<categoria> {
    const categoria = await this.categoriaRepo.findOneBy({ idCategoria: id });
    if (!categoria) {
      throw new NotFoundException(`Categoria con id ${id} no encontrado`);
    }
    return categoria;
  }

  async update(idCategoria: number, data: Partial<categoria>): Promise<categoria> {
    const categoria = await this.categoriaRepo.findOneBy({ idCategoria });
    if (!categoria) {
      throw new Error(`cliente con id ${idCategoria} no encontrado`);
    }
    const nombre = String(data?.nombreCategoria ?? categoria.nombreCategoria).trim();
    const normalizado = nombre.toLowerCase();
    if (data.nombreCategoria) {
      const duplicada = await this.categoriaRepo.findOne({ where: { nombreNormalizado: normalizado } });
      if (duplicada && duplicada.idCategoria !== idCategoria) {
        throw new BadRequestException('La categoría ya se encuentra registrada');
      }
    }
    await this.categoriaRepo.update(idCategoria, { ...data, nombreCategoria: nombre, nombreNormalizado: normalizado });
    return categoria;
  }

  async remove(id: number): Promise<{ deleted: Boolean }> {
    try {
      const res = await this.categoriaRepo.delete(id);
      if (!res.affected || res.affected === 0) {
        throw new NotFoundException(`Categoria con id ${id} no encontrado`);
      }
      return { deleted: true };
    } catch (err: any) {
      const code = err?.code || err?.driverError?.code;
      const detail = err?.detail || err?.driverError?.detail;
      const isFk = code === '23503' || (typeof detail === 'string' && (detail.includes('referida') || detail.includes('productos')));
      if (isFk) {
        throw new BadRequestException({
          code: '23503',
          message: 'No se puede eliminar la categoría porque está ligada a uno o más productos.'
        });
      }
      throw err;
    }
  }
}
