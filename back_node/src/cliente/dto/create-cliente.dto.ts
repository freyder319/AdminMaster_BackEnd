import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength, Matches } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @Length(1, 100)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido?: string;

  @IsString()
  @MaxLength(20)
  numero!: string;

  @IsOptional()
  @IsString()
  @Length(10, 10)
  @Matches(/^\d+$/)
  documento?: string;

  @IsEmail()
  @MaxLength(150)
  correo!: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;
}
