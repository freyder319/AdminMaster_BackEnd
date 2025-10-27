import { IsEmail, IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @Length(1, 100)
  nombre!: string;

  @IsString()
  @Length(1, 100)
  apellido!: string;

  @IsEmail()
  @IsNotEmpty()
  correo!: string;

  @IsNotEmpty()
  contrasena!: string;

  @IsNotEmpty()
  telefono!: string;

  @IsNumber()
  cajaId!: number;
}
