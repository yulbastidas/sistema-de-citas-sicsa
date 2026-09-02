import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { VerificationsService } from './verifications.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
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

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('verifications')
export class VerificationsController {
  constructor(
    private readonly verificationsService: VerificationsService,
    private readonly audit: AuditService,
  ) {}

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
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.verificationsService.findAll(
      parsePageRequest(page, limit),
      { status, search },
    );
  }

  @Roles('admin')
  @Post('approve')
  async approve(
    @Body('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.verificationsService.approve(id, req.user);
    await this.audit.record({
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      action: 'verification.approved',
      resourceType: 'verification',
      resourceId: id,
      result: 'success',
    });
    return result;
  }

  @Roles('admin')
  @Post('reject')
  reject(
    @Body('id', ParseIntPipe) id: number,
    @Body('motivoRechazo') motivoRechazo: string,
    @Req() req: RequestWithUser,
  ) {
    return this.verificationsService
      .reject(id, motivoRechazo, req.user)
      .then(async (result) => {
        await this.audit.record({
          actorUserId: req.user.sub,
          actorRole: req.user.role,
          action: 'verification.rejected',
          resourceType: 'verification',
          resourceId: id,
          result: 'success',
        });
        return result;
      });
  }
}
