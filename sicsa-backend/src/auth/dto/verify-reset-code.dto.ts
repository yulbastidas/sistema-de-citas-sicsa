import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class VerifyResetCodeDto {
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

  @IsNotEmpty({
    message: 'El código es obligatorio',
  })
  @Matches(/^\d{6}$/, {
    message: 'El código debe contener seis números',
  })
  code!: string;
}