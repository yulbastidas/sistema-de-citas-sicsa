import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DoctorsService } from './doctors.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Roles('doctor', 'admin')
  @Get('user/:userId')
  findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Req()
    req: Request & {
      user: { sub: number; role: string };
    },
  ) {
    if (req.user.role === 'doctor' && req.user.sub !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para consultar otro perfil médico',
      );
    }

    return this.doctorsService.findByUserId(userId);
  }
}
