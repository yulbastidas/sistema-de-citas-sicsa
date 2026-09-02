import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { CreateAdminAppointmentDto } from './dto/create-admin-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { N8nInternalGuard } from '../auth/guards/n8n-internal.guard';
import { AuditService } from '../audit/audit.service';
import { parsePageRequest } from '../common/pagination';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

type RequestWithUser = Request & {
  user: JwtUser;
};

function parseOptionalNumber(value: string | undefined, fieldName: string) {
  if (value === undefined || value === '') return undefined;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${fieldName} debe ser un número válido`);
  }

  return parsed;
}

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private appointmentsService: AppointmentsService,
    private readonly audit: AuditService,
  ) {}

  @UseGuards(N8nInternalGuard)
  @Get('n8n/reminders')
  getRemindersForN8n() {
    return this.appointmentsService.getTomorrowRemindersForN8n();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  async create(
    @Body() body: CreateAppointmentDto,
    @Req() req: RequestWithUser,
  ) {
    const appointment = await this.appointmentsService.create(body, req.user);
    await this.audit.record({
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      action: 'appointment.created',
      resourceType: 'appointment',
      resourceId: appointment.id,
      result: 'success',
      metadata: { status: appointment.estado },
    });
    return appointment;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('admin-create')
  async createByAdmin(
    @Body() body: CreateAdminAppointmentDto,
    @Req() req: RequestWithUser,
  ) {
    const appointment = await this.appointmentsService.createByAdmin(body);
    await this.audit.record({
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      action: 'appointment.created_by_admin',
      resourceType: 'appointment',
      resourceId: appointment.id,
      result: 'success',
      metadata: { status: appointment.estado },
    });
    return appointment;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('all')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('search') search?: string,
  ) {
    return this.appointmentsService.findAll(
      parsePageRequest(page, limit),
      { status, date, search },
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('my')
  getMy(
    @Req() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appointmentsService.getByUser(
      req.user.sub,
      parsePageRequest(page, limit),
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Get('doctor/:id')
  findByDoctor(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findByDoctor(
      id,
      req.user,
      parsePageRequest(page, limit),
      { status, date },
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Get('doctor/:id/history')
  findHistoryByDoctor(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findHistoryByDoctor(
      id,
      req.user,
      parsePageRequest(page, limit),
      { search, date },
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('cancel')
  async cancel(
    @Body() body: CancelAppointmentDto,
    @Req() req: RequestWithUser,
  ) {
    const appointment = await this.appointmentsService.cancel(
      body.id,
      req.user,
    );
    await this.audit.record({
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      action: 'appointment.cancelled',
      resourceType: 'appointment',
      resourceId: appointment.id,
      result: 'success',
    });
    return appointment;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('available')
  getAvailable(
    @Query('fecha') fecha: string,
    @Query('specialtyId') specialtyId?: string,
  ) {
    const parsedSpecialtyId = parseOptionalNumber(specialtyId, 'specialtyId');

    return this.appointmentsService.getAvailable(fecha, parsedSpecialtyId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Get('queue')
  getQueue(
    @Req() req: RequestWithUser,
    @Query('fecha') fecha: string,
    @Query('doctorId') doctorId?: string,
  ) {
    const parsedDoctorId = parseOptionalNumber(doctorId, 'doctorId');

    return this.appointmentsService.getQueue(fecha, parsedDoctorId, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('tomorrow-reminders')
  getTomorrowReminders() {
    return this.appointmentsService.getTomorrowReminders();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Patch(':id/no-show')
  async markNoShow(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const appointment = await this.appointmentsService.markNoShow(id, req.user);
    await this.audit.record({
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      action: 'appointment.no_show_recorded',
      resourceType: 'appointment',
      resourceId: appointment.id,
      result: 'success',
    });
    return appointment;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.appointmentsService.generateMedicalReportPdf(
      id,
      req.user,
    );
    await this.audit.record({
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      action: 'medical_report.pdf_downloaded',
      resourceType: 'appointment',
      resourceId: id,
      result: 'success',
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=reporte-cita-${id}.pdf`,
    });

    res.send(pdfBuffer);
  }
}
