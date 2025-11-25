import { IsArray, IsIn, IsNumber, IsOptional, IsPositive, ValidateNested, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVentaItemDto {
  @IsNumber()
  @IsPositive()
  productoId!: number;

  @IsNumber()
  @IsPositive()
  cantidad!: number;

  @IsNumber()
  @IsPositive()
  precio!: number;

  @IsNumber()
  @IsPositive()
  subtotal!: number;
}

export class CreateVentaDto {
  @IsNumber()
  @IsPositive()
  total!: number;

  @IsIn(['efectivo','tarjeta','transferencia','nequi','daviplata','otros'])
  forma_pago!: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros';

  @IsOptional()
  @IsIn(['confirmada','pendiente'])
  estado?: 'confirmada' | 'pendiente';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVentaItemDto)
  items!: CreateVentaItemDto[];

  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @IsOptional()
  @IsNumber()
  usuario_id?: number;

  @IsOptional()
  turno_id?: number | null;

  @IsOptional()
  @IsNumber()
  descuentoId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  transaccionId?: string;
}
