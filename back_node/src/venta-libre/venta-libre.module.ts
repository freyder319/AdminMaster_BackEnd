import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentaLibre } from './venta-libre.entity';
import { VentaLibreService } from './venta-libre.service';
import { VentaLibreController } from './venta-libre.controller';
import { TurnoModule } from '../turno/turno.module';

@Module({
  imports: [TypeOrmModule.forFeature([VentaLibre]), TurnoModule],
  controllers: [VentaLibreController],
  providers: [VentaLibreService],
})
export class VentaLibreModule {}