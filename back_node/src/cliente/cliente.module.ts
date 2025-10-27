import { Module } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ClienteController } from './cliente.controller';
import { ClienteEntity } from './cliente.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoModule } from '../turno/turno.module';
@Module({
  imports: [TypeOrmModule.forFeature([ClienteEntity]), TurnoModule],
  providers: [ClienteService],
  controllers: [ClienteController],
  exports: [ClienteService],
})
export class ClienteModule {}
