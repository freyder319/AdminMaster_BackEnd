import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from './turno.entity';
import { CajaMovimiento } from '../caja/caja-mov.entity';
import { AsignacionCajaTurno } from './asignacion-caja-turno.entity';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { UsersModule } from '../users/users.module';
import { EmpleadoModule } from '../empleado/empleado.module';
import { TurnoLog } from './turno-log.entity';
import { TurnoLogService } from './turno-log.service';
import { RegistroTurno } from './registro-turno.entity';
import { RegistroTurnoService } from './registro-turno.service';
import { TurnoActivoGuard } from './turno-activo.guard';
import { Venta } from '../venta/venta.entity';
import { VentaLibre } from '../venta-libre/venta-libre.entity';
import { GastoEntity } from '../gasto/gasto.entity';
import { AuditoriaCaja } from './auditoria-caja.entity';
import { CajaModule } from '../caja/caja.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno, CajaMovimiento, TurnoLog, RegistroTurno, Venta, VentaLibre, GastoEntity, AsignacionCajaTurno, AuditoriaCaja]),
    UsersModule,
    EmpleadoModule,
    CajaModule,
  ],
  controllers: [TurnoController],
  providers: [TurnoService, TurnoLogService, RegistroTurnoService, TurnoActivoGuard],
  exports: [TurnoService, TurnoLogService, RegistroTurnoService, TurnoActivoGuard],
})
export class TurnoModule {}
