import { IsArray, IsIn, IsNumber, IsOptional, IsPositive, ValidateNested } from 'class-validator';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVentaItemDto)
  items!: CreateVentaItemDto[];

  @IsOptional()
  @IsNumber()
  usuario_id?: number;

  @IsOptional()
  turno_id?: number | null;
}
