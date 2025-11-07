import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PqrsEntity } from './pqrs.entity';

export interface CreatePqrsDto {
  nombre: string;
  apellido: string;
  correo: string;
  numero: string;
  comentarios: string;
  autorizo: boolean;
}

@Injectable()
export class PqrsService {
  constructor(
    @InjectRepository(PqrsEntity)
    private readonly pqrsRepo: Repository<PqrsEntity>,
  ) {}

  create(data: CreatePqrsDto): Promise<PqrsEntity> {
    const pqrs = this.pqrsRepo.create(data);
    return this.pqrsRepo.save(pqrs);
  }

  findAll(): Promise<PqrsEntity[]> {
    return this.pqrsRepo.find({ order: { creadoEn: 'DESC' as any } as any });
  }
}
