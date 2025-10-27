import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from './turno.entity';
import { CajaMovimiento } from '../caja/caja-mov.entity';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { UsersModule } from '../users/users.module';
import { EmpleadoModule } from '../empleado/empleado.module';
import { TurnoLog } from './turno-log.entity';
import { TurnoLogService } from './turno-log.service';
import { TurnoActivoGuard } from './turno-activo.guard';
import { Venta } from '../venta/venta.entity';
import { VentaLibre } from '../venta-libre/venta-libre.entity';
import { GastoEntity } from '../gasto/gasto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, CajaMovimiento, TurnoLog, Venta, VentaLibre, GastoEntity]), UsersModule, EmpleadoModule],
  controllers: [TurnoController],
  providers: [TurnoService, TurnoLogService, TurnoActivoGuard],
  exports: [TurnoService, TurnoLogService, TurnoActivoGuard],
})
export class TurnoModule {}
