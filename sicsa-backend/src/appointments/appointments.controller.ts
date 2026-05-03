import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
  constructor(private appointmentsService: AppointmentsService) {}

  @Get('n8n/reminders')
  getRemindersForN8n() {
    return this.appointmentsService.getTomorrowReminders();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  create(@Body() body: CreateAppointmentDto, @Req() req: RequestWithUser) {
    return this.appointmentsService.create(body, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('admin-create')
  createByAdmin(@Body() body: CreateAdminAppointmentDto) {
    return this.appointmentsService.createByAdmin(body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('all')
  findAll() {
    return this.appointmentsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('my')
  getMy(@Req() req: RequestWithUser) {
    return this.appointmentsService.getByUser(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Get('doctor/:id')
  findByDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findByDoctor(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Get('doctor/:id/history')
  findHistoryByDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findHistoryByDoctor(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('cancel')
  cancel(@Body() body: CancelAppointmentDto, @Req() req: RequestWithUser) {
    return this.appointmentsService.cancel(body.id, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('available')
  getAvailable(
    @Query('fecha') fecha: string,
    @Query('appointmentClassId') appointmentClassId?: string,
  ) {
    const parsedAppointmentClassId = parseOptionalNumber(
      appointmentClassId,
      'appointmentClassId',
    );

    return this.appointmentsService.getAvailable(
      fecha,
      parsedAppointmentClassId,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Get('queue')
  getQueue(
    @Query('fecha') fecha: string,
    @Query('doctorId') doctorId?: string,
  ) {
    const parsedDoctorId = parseOptionalNumber(doctorId, 'doctorId');

    return this.appointmentsService.getQueue(fecha, parsedDoctorId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('tomorrow-reminders')
  getTomorrowReminders() {
    return this.appointmentsService.getTomorrowReminders();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdfBuffer =
      await this.appointmentsService.generateMedicalReportPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=reporte-cita-${id}.pdf`,
    });

    res.send(pdfBuffer);
  }
}
