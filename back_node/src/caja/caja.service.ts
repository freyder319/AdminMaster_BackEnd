import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CajaEntity } from './caja.entity';

@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(CajaEntity)
    private cajaRepo: Repository<CajaEntity>,
  ) {}
  findAll(): Promise<CajaEntity[]> {
    return this.cajaRepo.find();
  }
  create(data: Partial<CajaEntity>): Promise<CajaEntity> {
    const caja = this.cajaRepo.create(data);
    return this.cajaRepo.save(caja);
  }
  async update(id: number, data: Partial<CajaEntity>): Promise<CajaEntity> {
    await this.cajaRepo.update(id, data);
    const caja = await this.cajaRepo.findOneBy({ id });
    if (!caja) {
      throw new Error(`Caja con id ${id} NO Encontrado`);
    }
    return caja;
  }
  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      const res = await this.cajaRepo.delete(id);
      if (!res.affected) throw new NotFoundException(`Caja ${id} no encontrada`);
      return { deleted: true };
    } catch (err: any) {
      const code = err?.code || err?.driverError?.code;
      const detail = err?.detail || err?.driverError?.detail;
      const isFk = code === '23503' || (typeof detail === 'string' && detail.toLowerCase().includes('llave foránea'));
      if (isFk) {
        throw new BadRequestException({
          code: '23503',
          message: 'No se puede eliminar la caja porque está referenciada por otros registros.'
        });
      }
      throw err;
    }
  }
  findByCodigoWithUsuarios(codigoCaja: string): Promise<CajaEntity | null> {
    return this.cajaRepo.findOne({
      where: { codigoCaja },
      relations: ['usuarios'],
    });
  }

  async findByUsuarioId(usuarioId: number): Promise<CajaEntity | null> {
    return this.cajaRepo.findOne({
      where: {
        usuarios: {
          id: usuarioId,
        },
      },
      relations: ['usuarios'],
    });
  }

  async findOne(options: { where: any; relations?: string[] }): Promise<CajaEntity | null> {
    return this.cajaRepo.findOne(options);
  }

  async findCajaByUsuarioId(id: number, esEmpleado = false) {
    return esEmpleado
      ? this.cajaRepo.findOne({ where: { empleados: { id } }, relations: ['empleados'] })
      : this.cajaRepo.findOne({ where: { usuarios: { id } }, relations: ['usuarios'] });
  }
}
