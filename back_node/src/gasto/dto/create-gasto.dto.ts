import { IsDateString, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Length, IsIn } from 'class-validator';

export class CreateGastoDto {
  @IsDateString()
  fecha!: string; // YYYY-MM-DD

  @IsNumberString()
  monto!: string; // usar string para precisión decimal

  @IsOptional()
  @IsString()
  @Length(0, 255)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @Length(0, 150)
  nombre?: string;

  @IsOptional()
  @IsInt()
  categoriaId?: number;

  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsNotEmpty()
  @IsIn(['efectivo', 'transferencia', 'tarjeta', 'nequi', 'daviplata', 'otros'])
  forma_pago!: string;

  @IsOptional()
  @IsInt()
  usuarioId?: number;

  @IsNotEmpty()
  @IsIn(['confirmado', 'pendiente', 'anulado'])
  estado!: string;
}
