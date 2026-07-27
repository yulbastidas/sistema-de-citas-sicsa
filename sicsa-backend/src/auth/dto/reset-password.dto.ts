import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
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

  @IsNotEmpty({
    message: 'La nueva contraseña es obligatoria',
  })
  @MinLength(8, {
    message: 'La contraseña debe tener al menos ocho caracteres',
  })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe contener una letra mayúscula',
  })
  @Matches(/[a-z]/, {
    message: 'La contraseña debe contener una letra minúscula',
  })
  @Matches(/[0-9]/, {
    message: 'La contraseña debe contener un número',
  })
  newPassword!: string;

  @IsNotEmpty({
    message: 'Debes confirmar la contraseña',
  })
  confirmPassword!: string;
}