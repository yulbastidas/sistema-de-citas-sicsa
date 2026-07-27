import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({
    message: 'El correo es obligatorio',
  })
  @IsEmail(
    {},
    {
      message: 'El correo no tiene un formato válido',
    },
  )
  email!: string;
}