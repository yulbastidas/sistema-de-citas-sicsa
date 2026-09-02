import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MedicalReportsService } from './medical-reports.service';
import { UpsertMedicalReportDto } from './dto/upsert-medical-report.dto';
import { AuditService } from '../audit/audit.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('medical-reports')
export class MedicalReportsController {
  constructor(
    private readonly medicalReportsService: MedicalReportsService,
    private readonly audit: AuditService,
  ) {}

  @Roles('doctor', 'admin')
  @Post()
  upsert(
    @Body() body: UpsertMedicalReportDto,
    @Req()
    req: Request & {
      user: { sub: number; role: string; email: string };
    },
  ) {
    return this.medicalReportsService
      .upsert(body, req.user)
      .then(async (report) => {
        await this.audit.record({
          actorUserId: req.user.sub,
          actorRole: req.user.role,
          action: 'medical_report.upserted',
          resourceType: 'medical_report',
          resourceId: report.id,
          result: 'success',
          metadata: { appointmentId: body.appointmentId },
        });
        return report;
      });
  }

  @Roles('doctor', 'admin')
  @Get(':appointmentId')
  findByAppointmentId(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
    @Req()
    req: Request & {
      user: { sub: number; role: string; email: string };
    },
  ) {
    return this.medicalReportsService
      .findByAppointmentId(appointmentId, req.user)
      .then(async (report) => {
        await this.audit.record({
          actorUserId: req.user.sub,
          actorRole: req.user.role,
          action: 'medical_report.accessed',
          resourceType: 'appointment',
          resourceId: appointmentId,
          result: 'success',
        });
        return report;
      });
  }
}
