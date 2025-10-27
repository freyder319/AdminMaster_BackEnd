import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ClienteEntity } from './cliente.entity';
import { TurnoActivoGuard } from '../turno/turno-activo.guard';
import { TurnoLogService } from '../turno/turno-log.service';
import type { Request } from 'express';

@Controller('cliente')
export class ClienteController {
  constructor(
    private readonly clienteService: ClienteService,
    private readonly turnoLog: TurnoLogService,
  ) {}
  @Get()
  findAll(): Promise<ClienteEntity[]> {
    return this.clienteService.findAll();
  }
  @Get(':id')
  findOne(@Param('id') id: number): Promise<ClienteEntity> {
    return this.clienteService.findOne(id);
  }
  @Post()
  @UseGuards(TurnoActivoGuard)
  async create(@Req() req: Request, @Body() data: Partial<ClienteEntity>) {
    const created = await this.clienteService.create(data);
    const uid = (req as any)?.user?.id;
    await this.turnoLog.logActividad(Number(uid), 'cliente_create', created.id, { nombre: created.nombre, correo: created.correo });
    return created;
  }
  @Put(':id')
  @UseGuards(TurnoActivoGuard)
  async update(@Req() req: Request, @Param('id') id: number, @Body() data: Partial<ClienteEntity>) {
    const updated = await this.clienteService.update(id, data);
    const uid = (req as any)?.user?.id;
    await this.turnoLog.logActividad(Number(uid), 'cliente_update', id, { cambios: Object.keys(data || {}) });
    return updated;
  }
  @Delete(':id')
  @UseGuards(TurnoActivoGuard)
  async remove(@Req() req: Request, @Param('id') id: number) {
    const res = await this.clienteService.remove(id);
    const uid = (req as any)?.user?.id;
    await this.turnoLog.logActividad(Number(uid), 'cliente_delete', id);
    return res;
  }
}
