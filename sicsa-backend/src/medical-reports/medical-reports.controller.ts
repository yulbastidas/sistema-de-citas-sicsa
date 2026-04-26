import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MedicalReportsService } from './medical-reports.service';
import { UpsertMedicalReportDto } from './dto/upsert-medical-report.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('medical-reports')
export class MedicalReportsController {
  constructor(private readonly medicalReportsService: MedicalReportsService) {}

  @Roles('doctor', 'admin')
  @Post()
  upsert(@Body() body: UpsertMedicalReportDto) {
    return this.medicalReportsService.upsert(body);
  }

  @Roles('doctor', 'admin')
  @Get(':appointmentId')
  findByAppointmentId(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ) {
    return this.medicalReportsService.findByAppointmentId(appointmentId);
  }
}
