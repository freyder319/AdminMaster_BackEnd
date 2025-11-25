import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class IniciarTurnoDto {
  @IsNumber()
  @Min(0)
  montoInicial!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsNumber()
  registroTurnoId?: number;
}
