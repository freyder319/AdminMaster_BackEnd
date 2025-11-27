import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgenteIaService } from './agente-ia.service';
import { AgenteIaController } from './agente-ia.controller';
import { AgenteIa } from './entities/agente-ia.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([AgenteIa])],
  controllers: [AgenteIaController],
  providers: [AgenteIaService],
})
export class AgenteIaModule {}
