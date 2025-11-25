import { PartialType } from '@nestjs/mapped-types';
import { CreateAgenteIaDto } from './create-agente-ia.dto';

export class UpdateAgenteIaDto extends PartialType(CreateAgenteIaDto) {}
