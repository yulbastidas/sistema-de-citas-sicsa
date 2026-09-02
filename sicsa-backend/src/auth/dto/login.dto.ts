import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El identificador debe ser texto' })
  @IsNotEmpty({ message: 'El identificador es obligatorio' })
  @MaxLength(150, { message: 'El identificador no es válido' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}
