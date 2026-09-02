import { IsInt, IsString, IsUUID, Matches, Min } from 'class-validator';

export class VerifyPhoneRegistrationDto {
  @IsInt()
  @Min(1)
  registrationId!: number;

  @IsUUID()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code!: string;
}

export class ResendPhoneRegistrationDto {
  @IsInt()
  @Min(1)
  registrationId!: number;
}
