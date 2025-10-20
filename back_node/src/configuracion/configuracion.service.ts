import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionNegocio } from './configuracion.entity';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(ConfiguracionNegocio)
    private repo: Repository<ConfiguracionNegocio>,
  ) {}

  async findFirst(): Promise<ConfiguracionNegocio | null> {
    return this.repo.findOne({ where: {} });
  }

  async create(dto: CreateConfiguracionDto): Promise<ConfiguracionNegocio> {
    const exists = await this.findFirst();
    if (exists) throw new BadRequestException('La configuración ya existe');
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: Partial<ConfiguracionNegocio>): Promise<ConfiguracionNegocio> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Configuración no encontrada');
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }
}
