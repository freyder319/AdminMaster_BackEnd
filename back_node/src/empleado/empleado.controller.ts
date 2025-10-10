import { Controller, Get, Param, Delete, Post, Body, Put } from '@nestjs/common';
import { EmpleadoService } from './empleado.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';

@Controller('empleado')
export class EmpleadoController {
  constructor(private readonly empleadoService: EmpleadoService) {}

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

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.empleadoService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.empleadoService.remove(+id);
  }
}
