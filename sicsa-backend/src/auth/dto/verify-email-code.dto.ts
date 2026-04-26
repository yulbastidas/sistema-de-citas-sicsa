import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailCodeDto {
  @IsEmail({}, { message: 'Correo electrónico no válido' })
  email!: string;

  @IsString({ message: 'El código debe ser texto' })
  @IsNotEmpty({ message: 'El código es obligatorio' })
  @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
  code!: string;
}
