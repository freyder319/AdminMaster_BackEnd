import { IsArray, IsDateString, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsPositive, IsString, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  cantidad!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  precio!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal!: number;
}

export class CreateVentaLibreDto {
  @IsString()
  @Length(1, 150)
  nombre!: string;

  @IsIn(['confirmada', 'pendiente', 'anulada'])
  estado!: 'confirmada' | 'pendiente' | 'anulada';

  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoDto)
  productos!: ProductoDto[];

  // permitir string|number, normalizamos en service
  @IsNotEmpty()
  @IsNumberString()
  total!: string;

  @IsOptional()
  @IsIn(['efectivo', 'tarjeta', 'transferencia', 'nequi', 'daviplata', 'otros'])
  forma_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario_id?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsString()
  tipo_venta!: 'libre';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  turno_id?: number;
}
