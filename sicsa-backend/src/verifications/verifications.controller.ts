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

  @Get('me')
  getMyVerification(@Req() req: RequestWithUser) {
    return this.verificationsService.getByPatient(req.user.sub);
  }

  @Post('expire-my')
  expireMyVerification(@Req() req: RequestWithUser) {
    return this.verificationsService.expireMyVerification(req.user.sub);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.verificationsService.findAll();
  }

  @Roles('admin')
  @Post('approve')
  approve(@Body() body: { id: number }, @Req() req: RequestWithUser) {
    return this.verificationsService.approve(body.id, req.user);
  }

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
