import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './empleado.entity';
import { EmpleadoService } from './empleado.service';
import { Module } from '@nestjs/common';
import { EmpleadoController } from './empleado.controller';
import { CajaEntity } from 'src/caja/caja.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Empleado, CajaEntity])],
  providers: [EmpleadoService],
  controllers: [EmpleadoController],
  exports: [EmpleadoService],
})
export class EmpleadoModule {}
