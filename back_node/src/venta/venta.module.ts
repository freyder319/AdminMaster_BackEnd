import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from './venta.entity';
import { VentaItem } from './venta-item.entity';
import { VentaController } from './venta.controller';
import { VentaService } from './venta.service';
import { Producto } from 'src/producto/producto.entity';
import { TurnoModule } from '../turno/turno.module';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, VentaItem, Producto]), TurnoModule],
  controllers: [VentaController],
  providers: [VentaService],
  exports: [VentaService],
})
export class VentaModule {}
