import { Module } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasController } from './estadisticas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from 'src/producto/producto.entity';
import { Venta } from 'src/venta/venta.entity';
import { VentaItem } from 'src/venta/venta-item.entity';
import { GastoEntity } from 'src/gasto/gasto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Venta, VentaItem, GastoEntity])],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
