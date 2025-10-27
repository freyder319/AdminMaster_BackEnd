import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GastoEntity } from './gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';

@Injectable()
export class GastoService {
  constructor(
    @InjectRepository(GastoEntity)
    private readonly gastoRepo: Repository<GastoEntity>,
  ) {}

  async create(dto: CreateGastoDto): Promise<GastoEntity> {
    // Server-side guard to avoid numeric(12,2) overflow and invalid formats
    const montoNum = Number(dto.monto);
    if (!isFinite(montoNum)) {
      throw new BadRequestException('El monto es inválido.');
    }
    // Max for numeric(12,2) is < 10^10 (9,999,999,999.99)
    if (Math.abs(montoNum) >= 1e10) {
      throw new BadRequestException('El monto supera el máximo permitido (9,999,999,999.99).');
    }
    // Enforce up to 2 decimals
    const decimalsOk = /^-?\d{1,10}(\.\d{1,2})?$/.test(String(dto.monto));
    if (!decimalsOk) {
      throw new BadRequestException('El monto debe tener como máximo 2 decimales.');
    }
    const entity: Partial<GastoEntity> = {
      fecha: dto.fecha,
      monto: dto.monto,
      nombre: (dto as any).nombre,
      descripcion: dto.descripcion,
      categoriaId: dto.categoriaId,
      proveedorId: dto.proveedorId,
      forma_pago: dto.forma_pago as any,
      usuarioId: dto.usuarioId,
      turnoId: (dto as any).turnoId ?? null,
      estado: dto.estado as any,
    };
    const gasto = this.gastoRepo.create(); // create a single entity instance
    Object.assign(gasto, entity);
    return this.gastoRepo.save(gasto);
  }

  findAll(): Promise<GastoEntity[]> {
    return this.gastoRepo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<GastoEntity> {
    const gasto = await this.gastoRepo.findOne({ where: { id } });
    if (!gasto) throw new NotFoundException(`Gasto ${id} no encontrado`);
    return gasto;
  }

  async update(id: number, dto: Partial<CreateGastoDto>): Promise<GastoEntity> {
    const gasto = await this.findOne(id);
    Object.assign(gasto, dto);
    return this.gastoRepo.save(gasto);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const res = await this.gastoRepo.delete(id);
    if (!res.affected) throw new NotFoundException(`Gasto ${id} no encontrado`);
    return { deleted: true };
  }
}
