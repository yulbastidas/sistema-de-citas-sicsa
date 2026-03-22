import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { VerificationsService } from './verifications.service';
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
@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  // Paciente o admin: solicitar verificación
  @Post('request')
  requestVerification(
    @Body()
    body: {
      documento: string;
      eps: string;
    },
    @Req() req: RequestWithUser,
  ) {
    return this.verificationsService.requestVerification(body, req.user);
  }

  // Solo admin: listar solicitudes
  @Roles('admin')
  @Get()
  findAll() {
    return this.verificationsService.findAll();
  }

  // Solo admin: aprobar
  @Roles('admin')
  @Post('approve')
  approve(@Body() body: { id: number }, @Req() req: RequestWithUser) {
    return this.verificationsService.approve(body.id, req.user);
  }

  // Solo admin: rechazar
  @Roles('admin')
  @Post('reject')
  reject(
    @Body()
    body: {
      id: number;
      motivoRechazo: string;
    },
    @Req() req: RequestWithUser,
  ) {
    return this.verificationsService.reject(
      body.id,
      body.motivoRechazo,
      req.user,
    );
  }
}
