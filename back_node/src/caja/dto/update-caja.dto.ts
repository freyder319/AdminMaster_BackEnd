import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateCajaDto {
  @IsOptional()
  @IsString()
  @Length(1, 20)
  codigoCaja?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @IsIn(['Activa', 'Inactiva'], { message: 'estado debe ser Activa o Inactiva' })
  estado?: string;
}
