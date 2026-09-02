import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { VerificationsModule } from './verifications/verifications.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { MedicalReportsModule } from './medical-reports/medical-reports.module';
import { EpsModule } from './eps/eps.module';
import { AppointmentClassModule } from './appointment-class/appointment-class.module';
import * as dotenv from 'dotenv';
import { ReportsModule } from './reports/reports.module';
import { getDatabaseSynchronize } from './config/environment';
import { AuditModule } from './audit/audit.module';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'sicsa',
      autoLoadEntities: true,
      synchronize: getDatabaseSynchronize(),
    }),
    UsersModule,
    PatientsModule,
    VerificationsModule,
    AppointmentsModule,
    AuthModule,
    DoctorsModule,
    SpecialtiesModule,
    MedicalReportsModule,
    EpsModule,
    AppointmentClassModule,
    ReportsModule,
    AuditModule,
  ],
})
export class AppModule {}
