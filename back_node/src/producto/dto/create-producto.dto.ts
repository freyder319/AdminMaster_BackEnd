import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  codigoProducto!: string;

  @IsOptional()
  @IsString()
  imgProducto?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  nombreProducto!: string;

  @IsInt()
  @Min(0)
  stockProducto!: number;

  @IsInt()
  @Min(0)
  precioUnitario!: number;

  @IsInt()
  @Min(0)
  precioComercial!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idCategoria?: number;
}
