import { IsBoolean, IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @MaxLength(20)
  telefono!: string;

  @IsEmail()
  @MaxLength(150)
  correo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreEmpresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactoNombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
