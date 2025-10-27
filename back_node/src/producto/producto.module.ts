import { Module } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './producto.entity';
import { categoria } from 'src/categoria/categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, categoria])],
  controllers: [ProductoController],
  providers: [ProductoService],
  exports: [ProductoService],
})
export class ProductoModule {}
