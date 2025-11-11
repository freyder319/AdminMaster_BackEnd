import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoriaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombreCategoria?: string;
}
