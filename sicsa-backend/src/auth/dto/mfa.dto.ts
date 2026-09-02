import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CompleteMfaDto {
  @IsString() @IsNotEmpty() @MaxLength(200) challengeToken!: string;
  @IsIn(['totp', 'recovery']) method!: 'totp' | 'recovery';
  @IsString() @IsNotEmpty() @MaxLength(32) code!: string;
}

export class RegenerateRecoveryCodesDto {
  @IsString() @Matches(/^\d{6}$/) code!: string;
}
