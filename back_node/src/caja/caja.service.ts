import { Injectable } from '@nestjs/common';
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
    await this.cajaRepo.delete(id);
    return { deleted: true };
  }
  findByCodigoWithUsuarios(codigoCaja: string): Promise<CajaEntity | null> {
    return this.cajaRepo.findOne({
      where: { codigoCaja },
      relations: ['usuarios'],
    });
  }
}
