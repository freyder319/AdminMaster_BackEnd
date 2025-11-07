import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { DescuentoService } from './descuento.service';
import { DescuentoEntity } from './descuento.entity';

@Controller('descuento')
export class DescuentoController {
  constructor(private readonly service: DescuentoService) {}

  @Post()
  create(@Body() body: Partial<DescuentoEntity>) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<DescuentoEntity>) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
