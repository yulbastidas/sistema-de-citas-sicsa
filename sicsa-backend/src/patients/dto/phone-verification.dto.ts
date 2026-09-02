import { IsString, IsUUID, Matches } from 'class-validator';

export class RequestPhoneVerificationDto {
  @IsString()
  phone!: string;
}

export class VerifyPhoneCodeDto {
  @IsUUID()
  challengeId!: string;

  @Matches(/^\d{6}$/, { message: 'El código debe contener 6 dígitos' })
  code!: string;
}
