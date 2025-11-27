import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
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

  @Post('imagen')
  @UseGuards(JwtAuthGuard)
  uploadImagen(@Body('imageBase64') imageBase64: string) {
    return this.productoService.processImagenBase64(imageBase64);
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
  findAll(@Query('all') all?: string) {
  const includeAll = String(all || '').toLowerCase() === 'true';
  return this.productoService.findAll(includeAll);
  }
@Get('public')
async findPublic() {
  const data = await this.productoService.findPublic();
  console.log("Public products loaded:", data.length);
  return data;
}


  @Get('paged')
  @SkipThrottle()
  findPaged(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('sort') sort?: 'id' | 'nombreProducto' | 'precioUnitario' | 'estado',
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('all') all?: string,
  ) {
    return this.productoService.findPaged({
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
      sort,
      order,
      q,
      categoryId: categoryId === '' || categoryId == null ? '' : Number(categoryId),
      includeAll: String(all || '').toLowerCase() === 'true',
    });
  }

  @Get(':id')
  @SkipThrottle()
  findOne(@Param('id') id: string) {
    return this.productoService.findOne(+id);
  }

  @Get(':id/can-delete')
  @SkipThrottle()
  canDelete(@Param('id') id: string) {
    return this.productoService.canDelete(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productoService.update(+id, updateProductoDto);
  }

  @Put(':id/estado')
  @UseGuards(JwtAuthGuard)
  setEstado(@Param('id') id: string, @Body() body: { estado: boolean }) {
    return this.productoService.setEstado(+id, !!body?.estado);
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
