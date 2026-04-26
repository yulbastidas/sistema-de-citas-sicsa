import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Verification } from 'src/verifications/entities/verification.entity';
import { AppointmentsGateway } from './appointments.gateway';
import { Patient } from '../patients/entities/patient.entity';
import { AppointmentPdfService } from './pdf/appointment-pdf.service';
import { MedicalReportsModule } from '../medical-reports/medical-reports.module';
import { Doctor } from '../doctors/entities/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Verification, Patient, Doctor]),
    MedicalReportsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsGateway, AppointmentPdfService],
})
export class AppointmentsModule {}
