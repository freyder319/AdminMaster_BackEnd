import { IsEmail, IsNotEmpty, IsNumber, IsString, Length, MaxLength } from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @Length(1, 100)
  nombre!: string;

  @IsString()
  @Length(1, 100)
  apellido!: string;

  @IsString()
  @MaxLength(50)
  documento!: string;

  @IsEmail()
  @IsNotEmpty()
  correo!: string;

  @IsNotEmpty()
  telefono!: string;

  @IsNumber()
  cajaId!: number;
}
