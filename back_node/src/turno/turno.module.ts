import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from './turno.entity';
import { CajaMovimiento } from '../caja/caja-mov.entity';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { UsersModule } from '../users/users.module';
import { EmpleadoModule } from '../empleado/empleado.module';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, CajaMovimiento]), UsersModule, EmpleadoModule],
  controllers: [TurnoController],
  providers: [TurnoService],
  exports: [TurnoService],
})
export class TurnoModule {}
