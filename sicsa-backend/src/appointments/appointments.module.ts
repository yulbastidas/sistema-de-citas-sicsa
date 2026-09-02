import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Verification } from '../verifications/entities/verification.entity';
import { AppointmentsGateway } from './appointments.gateway';
import { Patient } from '../patients/entities/patient.entity';
import { AppointmentPdfService } from './pdf/appointment-pdf.service';
import { MedicalReportsModule } from '../medical-reports/medical-reports.module';
import { Doctor } from '../doctors/entities/doctor.entity';
import { AppointmentScheduleService } from './services/appointment-schedule.service';
import { AppointmentWaitlistService } from './services/appointment-waitlist.service';
import { AppointmentNotificationService } from './services/appointment-notification.service';
import { AppointmentPriorityService } from './services/appointment-priority.service';
import { AppointmentMapperService } from './services/appointment-mapper.service';
import { N8nInternalGuard } from '../auth/guards/n8n-internal.guard';
import { RealtimeModule } from '../realtime/realtime.module';
import { MedicalReport } from '../medical-reports/entities/medical-report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Verification, Patient, Doctor, MedicalReport]),
    MedicalReportsModule,
    RealtimeModule,
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentsGateway,
    AppointmentPdfService,
    AppointmentScheduleService,
    AppointmentWaitlistService,
    AppointmentNotificationService,
    AppointmentPriorityService,
    AppointmentMapperService,
    N8nInternalGuard,
  ],
})
export class AppointmentsModule {}
