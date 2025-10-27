import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoLog } from './turno-log.entity';
import { TurnoService } from './turno.service';

@Injectable()
export class TurnoLogService {
  constructor(
    @InjectRepository(TurnoLog) private readonly logRepo: Repository<TurnoLog>,
    private readonly turnoService: TurnoService,
  ) {}

  async logActividad(usuarioId: number, tipo: string, refId?: string | number, payload?: any) {
    if (!usuarioId) return;
    const turno = await this.turnoService.getTurnoActivo(usuarioId);
    if (!turno) return; // si no hay turno activo, no registra
    const log = this.logRepo.create({
      turnoId: turno.id,
      tipo,
      refId: refId != null ? String(refId) : null,
      payload: payload ?? null,
    });
    await this.logRepo.save(log);
  }
}
