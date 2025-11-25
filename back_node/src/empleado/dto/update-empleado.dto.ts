import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateEmpleadoDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  apellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documento?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  contrasena?: string;

  // permitir null o número; con IsOptional para que whitelist lo acepte
  @IsOptional()
  cajaId?: number | null;
}
