import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { categoria } from './categoria.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  create(@Body() createCategoriaDto: Partial<categoria>) {
    return this.categoriaService.create(createCategoriaDto);
  }

  @Get()
  findAll() {
    return this.categoriaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.categoriaService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<categoria>) {
    return this.categoriaService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.categoriaService.remove(id);
  }
}
