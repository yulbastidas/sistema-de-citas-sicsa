import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { OtpChallenge } from '../auth/otp/otp-challenge.entity';
import { OtpService } from '../auth/otp/otp.service';
import { OTP_CHALLENGE_STORE } from '../auth/otp/otp-challenge.store';
import { TypeOrmOtpChallengeStore } from '../auth/otp/typeorm-otp-challenge.store';
import { SMS_PROVIDER } from '../communications/sms/sms-provider';
import { SmsService } from '../communications/sms/sms.service';
import { createSmsProvider } from '../communications/sms/sms-provider.factory';
import { PhoneVerificationService } from './phone-verification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, User, OtpChallenge])],
  controllers: [PatientsController],
  providers: [
    PatientsService,
    PhoneVerificationService,
    OtpService,
    SmsService,
    TypeOrmOtpChallengeStore,
    { provide: OTP_CHALLENGE_STORE, useExisting: TypeOrmOtpChallengeStore },
    {
      provide: SMS_PROVIDER,
      useFactory: createSmsProvider,
    },
  ],
  exports: [PatientsService, OtpService],
})
export class PatientsModule {}
