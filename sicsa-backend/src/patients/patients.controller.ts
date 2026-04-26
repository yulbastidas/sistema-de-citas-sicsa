import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PatientsService } from './patients.service';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

type RequestWithUser = Request & {
  user: JwtUser;
};

@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.patientsService.create(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMyProfile(@Req() req: RequestWithUser) {
    return this.patientsService.findByUserId(req.user.sub);
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }
}
