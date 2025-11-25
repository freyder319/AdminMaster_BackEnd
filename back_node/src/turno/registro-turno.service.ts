import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroTurno, BloqueTurno } from './registro-turno.entity';

interface CreateRegistroTurnoDto {
  fecha?: string; // YYYY-MM-DD, opcional (por defecto hoy)
  bloque: BloqueTurno;
  notas?: string;
  horaDesde?: string;
  horaHasta?: string;
}

@Injectable()
export class RegistroTurnoService {
  constructor(
    @InjectRepository(RegistroTurno)
    private readonly registroRepo: Repository<RegistroTurno>,
  ) {}

  private todayIsoDate(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async create(dto: CreateRegistroTurnoDto): Promise<RegistroTurno> {
    const bloque = dto.bloque;
    if (bloque !== 'manana' && bloque !== 'tarde' && bloque !== 'noche') {
      throw new BadRequestException('Bloque inválido, debe ser "manana", "tarde" o "noche"');
    }

    const fecha = (dto.fecha || this.todayIsoDate()).trim();
    if (!fecha) {
      throw new BadRequestException('La fecha es obligatoria');
    }

    const horaDesde = (dto.horaDesde || '').trim();
    const horaHasta = (dto.horaHasta || '').trim();

    const entity = this.registroRepo.create({
      fecha,
      bloque,
      notas: dto.notas?.trim() || null,
      horaDesde: horaDesde || null,
      horaHasta: horaHasta || null,
    });
    return this.registroRepo.save(entity);
  }

  async listByFecha(fecha: string): Promise<RegistroTurno[]> {
    const f = (fecha || '').trim();
    if (!f) {
      throw new BadRequestException('La fecha es obligatoria');
    }
    return this.registroRepo.find({
      where: { fecha: f },
      order: { id: 'ASC' },
    });
  }

  async delete(id: number): Promise<{ affected: number }> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Id inválido');
    }
    const result = await this.registroRepo.delete(id);
    return { affected: result.affected ?? 0 };
  }
}
