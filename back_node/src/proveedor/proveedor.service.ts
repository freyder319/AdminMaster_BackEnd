import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProveedorEntity } from './proveedor.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(ProveedorEntity)
    private readonly repo: Repository<ProveedorEntity>,
  ) {}

  async create(dto: CreateProveedorDto): Promise<ProveedorEntity> {
    const entity = this.repo.create({ activo: true, ...dto });
    return this.repo.save(entity);
  }

  findAll(): Promise<ProveedorEntity[]> {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<ProveedorEntity> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Proveedor no encontrado');
    return found;
  }

  async update(id: number, dto: UpdateProveedorDto): Promise<ProveedorEntity> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Proveedor no encontrado');
    return { deleted: true };
  }
}
