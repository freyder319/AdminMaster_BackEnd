import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastoEntity } from './gasto.entity';
import { GastoService } from './gasto.service';
import { GastoController } from './gasto.controller';
import { TurnoModule } from '../turno/turno.module';

@Module({
  imports: [TypeOrmModule.forFeature([GastoEntity]), TurnoModule],
  providers: [GastoService],
  controllers: [GastoController],
  exports: [GastoService],
})
export class GastoModule {}
