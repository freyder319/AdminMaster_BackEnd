import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgenteIaService } from './agente-ia.service';
import { AgenteIaController } from './agente-ia.controller';

@Module({
  imports: [HttpModule],
  controllers: [AgenteIaController],
  providers: [AgenteIaService],
})
export class AgenteIaModule {}
