import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { ApproveAppointmentDto } from './dto/approve-appointment.dto';
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

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() body: CreateAppointmentDto, @Req() req: RequestWithUser) {
    return this.appointmentsService.create(body, req.user);
  }

  @Roles('admin')
  @Get('all')
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('my')
  getMy(@Req() req: RequestWithUser) {
    return this.appointmentsService.getByUser(req.user.sub);
  }

  @Roles('admin')
  @Post('approve')
  approve(@Body() body: ApproveAppointmentDto) {
    return this.appointmentsService.approve(body.id);
  }

  @Post('cancel')
  cancel(@Body() body: CancelAppointmentDto, @Req() req: RequestWithUser) {
    return this.appointmentsService.cancel(body.id, req.user);
  }

  @Get('available')
  getAvailable(@Query('fecha') fecha: string) {
    return this.appointmentsService.getAvailable(fecha);
  }

  @Get('queue')
  getQueue(@Query('fecha') fecha: string) {
    return this.appointmentsService.getQueue(fecha);
  }
}
