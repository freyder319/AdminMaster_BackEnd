import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req } from '@nestjs/common';
import { GastoService } from './gasto.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { TurnoActivoGuard } from '../turno/turno-activo.guard';
import { TurnoLogService } from '../turno/turno-log.service';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TurnoService } from '../turno/turno.service';

@Controller('gasto')
export class GastoController {
  constructor(
    private readonly gastoService: GastoService,
    private readonly turnoLog: TurnoLogService,
    private readonly turnoService: TurnoService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, TurnoActivoGuard)
  async create(@Req() req: Request, @Body() dto: CreateGastoDto) {
    const uidRaw = (req as any)?.user?.userId ?? (req as any)?.user?.id;
    const uid = Number(uidRaw);
    const tieneUid = Number.isFinite(uid) && uid > 0;
    const turno = tieneUid ? await this.turnoService.getTurnoActivo(uid) : null;
    (dto as any).usuarioId = tieneUid ? uid : null;
    (dto as any).turnoId = turno?.id || null;
    const created = await this.gastoService.create(dto);
    await this.turnoLog.logActividad(Number(uid), 'gasto_create', created.id, { monto: dto.monto, forma_pago: (dto as any).forma_pago, nombre: (dto as any).nombre });
    return created;
  }

  @Get()
  findAll() {
    return this.gastoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gastoService.findOne(Number(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, TurnoActivoGuard)
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: Partial<CreateGastoDto>) {
    const uidRaw = (req as any)?.user?.userId ?? (req as any)?.user?.id;
    const uid = Number(uidRaw);
    const tieneUid = Number.isFinite(uid) && uid > 0;
    if (tieneUid) (dto as any).usuarioId = uid;
    const updated = await this.gastoService.update(Number(id), dto);
    await this.turnoLog.logActividad(Number(uid), 'gasto_update', Number(id), { cambios: Object.keys(dto || {}) });
    return updated;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TurnoActivoGuard)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const res = await this.gastoService.remove(Number(id));
    const uid = (req as any)?.user?.userId ?? (req as any)?.user?.id;
    await this.turnoLog.logActividad(Number(uid), 'gasto_delete', Number(id));
    return res;
  }
}
