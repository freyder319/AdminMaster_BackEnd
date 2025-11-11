import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productoService.create(createProductoDto);
  }

  @Get('count')
  @SkipThrottle()
  async getCount(): Promise<{ total: number }> {
    const total = await this.productoService.countProductos();
    return { total };
  }

  @Get('totalMoney')
  async getTotalMoney(): Promise<{ total: number }> {
    return this.productoService.getTotalMoney();
  }

  @Get()
  @SkipThrottle()
  findAll() {
    return this.productoService.findAll();
  }

  @Get(':id')
  @SkipThrottle()
  findOne(@Param('id') id: string) {
    return this.productoService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productoService.update(+id, updateProductoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number) {
    return this.productoService.remove(id);
  }
  @Get('buscar/:codigo')
  buscarPorCodigo(@Param('codigo') codigo: string) {
    return this.productoService.buscarPorCodigo(codigo);
  }

  @Put(':id/stock')
  @UseGuards(JwtAuthGuard)
  async updateStock(
    @Param('id') id: string,
    @Body() body: { stock: number }
  ) {
    const numericId = +id;
    const producto = await this.productoService.actualizarStock(numericId, body.stock);
    return producto;
  }
}
