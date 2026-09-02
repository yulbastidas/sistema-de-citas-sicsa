import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';
import { Verification } from './entities/verification.entity';
import { Patient } from '../patients/entities/patient.entity';
import { VerificationsGateway } from './verifications.gateway';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TypeOrmModule.forFeature([Verification, Patient]), RealtimeModule],
  controllers: [VerificationsController],
  providers: [VerificationsService, VerificationsGateway],
  exports: [VerificationsService],
})
export class VerificationsModule {}
