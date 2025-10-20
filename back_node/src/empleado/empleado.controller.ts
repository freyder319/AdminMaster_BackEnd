import { Controller, Get, Param, Delete, Post, Body, Put, Query } from '@nestjs/common';
import { EmpleadoService } from './empleado.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Empleado } from './empleado.entity';

@Controller('empleado')
export class EmpleadoController {
  constructor(
    private readonly empleadoService: EmpleadoService,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  @Post()
  async crearEmpleado(@Body() dto: CreateEmpleadoDto) {
    return this.empleadoService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: Partial<CreateEmpleadoDto>) {
    return this.empleadoService.update(id, dto);
  }

  @Get()
  async obtenerEmpleados() {
    return this.empleadoService.findAllWithCaja();
  }

  @Get()
  findAll() {
    return this.empleadoService.findAll();
  }

  @Get('verificar')
  async verificarEmpleado(
    @Query('correo') correo: string,
    @Query('telefono') telefono: string,
  ): Promise<{ correo: boolean; telefono: boolean }> {
    const correoExiste = await this.empleadoRepo.findOne({ where: { correo } });
    const telefonoExiste = await this.empleadoRepo.findOne({ where: { telefono } });

    return {
      correo: !!correoExiste,
      telefono: !!telefonoExiste,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.empleadoService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empleadoService.remove(+id);
  }
}
