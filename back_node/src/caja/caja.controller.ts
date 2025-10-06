import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CajaService } from './caja.service';
import { CajaEntity } from './caja.entity';

@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Post()
  create(@Body() data: Partial<CajaEntity>) {
    return this.cajaService.create(data);
  }

  @Get()
  findAll(): Promise<CajaEntity[]> {
    return this.cajaService.findAll();
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<CajaEntity>) {
    return this.cajaService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cajaService.remove(+id);
  }
}
