import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateEmpleadoDto {
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
