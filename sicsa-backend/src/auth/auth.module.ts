import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from '../verifications/entities/verification.entity';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { EmailVerificationCode } from './entities/email-verification-code.entity';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { Eps } from '../eps/entities/eps.entity';
import * as dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';
import { getJwtExpiresIn, getJwtSecret } from '../config/environment';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthRateLimitService } from './security/auth-rate-limit.service';
import { PatientsModule } from '../patients/patients.module';
import { PendingPhoneRegistration } from './entities/pending-phone-registration.entity';
import { PhoneRegistrationService } from './phone-registration.service';
import { PhonePasswordRecoveryService } from './phone-password-recovery.service';
import { MfaCredential } from './entities/mfa-credential.entity';
import { MfaChallenge } from './entities/mfa-challenge.entity';
import { MfaRecoveryCode } from './entities/mfa-recovery-code.entity';
import { MfaService } from './mfa.service';

dotenv.config();

@Module({
  imports: [
    UsersModule,
    PatientsModule,
    PassportModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 100 },
      { name: 'long', ttl: 15 * 60_000, limit: 1_000 },
    ]),

    JwtModule.register({
      secret: getJwtSecret(),

      signOptions: {
        expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'],
      },
    }),

    TypeOrmModule.forFeature([
      Verification,
      User,
      Patient,
      EmailVerificationCode,
      PasswordResetCode,
      Eps,
      PendingPhoneRegistration,
      MfaCredential,
      MfaChallenge,
      MfaRecoveryCode,
    ]),
  ],

  providers: [
    AuthService,
    JwtStrategy,
    AuthRateLimitService,
    PhoneRegistrationService,
    PhonePasswordRecoveryService,
    MfaService,
  ],

  controllers: [AuthController],
})
export class AuthModule {}
