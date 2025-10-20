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
    const categoriaExistente = await this.categoriaRepo.findOne({
      where: { nombreCategoria: data.nombreCategoria },
    });
    if (categoriaExistente) {
      throw new BadRequestException('Categoria Ya Registrado');
    }
    const categoria = await this.categoriaRepo.create(data);
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

    const nombreNormalizado = data.nombreCategoria?.trim().toLowerCase();
    const categoriaExistente = await this.categoriaRepo.findOne({
      where: { nombreCategoria: data.nombreCategoria },
    });

    if (categoriaExistente) {
      throw new BadRequestException('La categoría ya se encuentra registrada');
    }

    await this.categoriaRepo.update(idCategoria, data);
    return categoria;
  }

  async remove(id: number): Promise<{ deleted: Boolean }> {
    await this.categoriaRepo.delete(id);
    return { deleted: true };
  }
}
