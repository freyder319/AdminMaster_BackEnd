import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DescuentoEntity } from './descuento.entity';
import { DescuentoService } from './descuento.service';
import { DescuentoController } from './descuento.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DescuentoEntity])],
  controllers: [DescuentoController],
  providers: [DescuentoService],
  exports: [TypeOrmModule],
})
export class DescuentoModule {}
