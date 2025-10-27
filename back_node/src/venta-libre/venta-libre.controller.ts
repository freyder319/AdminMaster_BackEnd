import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { VentaLibreService } from './venta-libre.service';
import { CreateVentaLibreDto } from './dto/create-venta-libre.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TurnoActivoGuard } from '../turno/turno-activo.guard';
import { TurnoService } from '../turno/turno.service';

@Controller('venta-libre')
export class VentaLibreController {
  constructor(private readonly service: VentaLibreService, private readonly turnoService: TurnoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TurnoActivoGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Req() req: Request, @Body() dto: CreateVentaLibreDto) {
    const user = (req as any)?.user || {};
    const uidRaw = (user as any).userId ?? (user as any).id;
    const uid = Number(uidRaw);
    const tieneUid = Number.isFinite(uid) && uid > 0;
    const turno = tieneUid ? await this.turnoService.getTurnoActivo(uid) : null;
    (dto as any).usuario_id = tieneUid ? uid : (dto as any).usuario_id ?? null;
    (dto as any).turno_id = turno?.id ?? (dto as any).turno_id ?? null;
    return this.service.create(dto);
  }
}
