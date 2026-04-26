import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalReport } from './entities/medical-report.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { MedicalReportsService } from './medical-reports.service';
import { MedicalReportsController } from './medical-reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalReport, Appointment])],
  providers: [MedicalReportsService],
  controllers: [MedicalReportsController],
  exports: [MedicalReportsService],
})
export class MedicalReportsModule {}
