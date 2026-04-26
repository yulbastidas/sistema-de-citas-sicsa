import { IsEmail } from 'class-validator';

export class SendVerificationCodeDto {
  @IsEmail({}, { message: 'Correo electrónico no válido' })
  email!: string;
}
