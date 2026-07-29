import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ReportsPermissionGuard } from '../auth/guards/reports-permission.guard';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
    ]),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsPermissionGuard,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}