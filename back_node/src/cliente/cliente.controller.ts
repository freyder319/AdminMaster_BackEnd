import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req, BadRequestException, Query } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ClienteEntity } from './cliente.entity';
import { TurnoActivoGuard } from '../turno/turno-activo.guard';
import { TurnoLogService } from '../turno/turno-log.service';
import type { Request } from 'express';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('cliente')
export class ClienteController {
  constructor(
    private readonly clienteService: ClienteService,
    private readonly turnoLog: TurnoLogService,
  ) {}

  private parseIdOrThrow(idParam: string): number {
    const idNum = Number(idParam);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw new BadRequestException('El id debe ser un entero positivo.');
    }
    return idNum;
  }

  @Get()
  findAll(): Promise<ClienteEntity[]> {
    return this.clienteService.findAll();
  }
  @Get('verificar')
  verificar(
    @Query('correo') correo?: string,
    @Query('numero') numero?: string,
    @Query('documento') documento?: string,
  ): Promise<{ correo: boolean; numero: boolean; documento: boolean }> {
    return this.clienteService.verificarExistencia(correo, numero, documento);
  }
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClienteEntity> {
    const parsed = this.parseIdOrThrow(id);
    return this.clienteService.findOne(parsed);
  }
  @Post()
  @UseGuards(TurnoActivoGuard)
  async create(@Req() req: Request, @Body() data: CreateClienteDto) {
    const created = await this.clienteService.create(data);
    const uid = (req as any)?.user?.id;
    await this.turnoLog.logActividad(Number(uid), 'cliente_create', created.id, { nombre: created.nombre, correo: created.correo });
    return created;
  }
  @Put(':id')
  @UseGuards(TurnoActivoGuard)
  async update(@Req() req: Request, @Param('id') id: string, @Body() data: UpdateClienteDto) {
    const parsed = this.parseIdOrThrow(id);
    const updated = await this.clienteService.update(parsed, data);
    const uid = (req as any)?.user?.id;
    await this.turnoLog.logActividad(Number(uid), 'cliente_update', parsed, { cambios: Object.keys(data || {}) });
    return updated;
  }
  @Delete(':id')
  @UseGuards(TurnoActivoGuard)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const parsed = this.parseIdOrThrow(id);
    const res = await this.clienteService.remove(parsed);
    const uid = (req as any)?.user?.id;
    await this.turnoLog.logActividad(Number(uid), 'cliente_delete', parsed);
    return res;
  }
}
