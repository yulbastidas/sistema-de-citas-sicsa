import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { PatientsService } from './patients.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  UpdateMyPatientDto,
  UpdatePatientByAdminDto,
} from './dto/update-patient.dto';
import {
  RequestPhoneVerificationDto,
  VerifyPhoneCodeDto,
} from './dto/phone-verification.dto';
import { PhoneVerificationService } from './phone-verification.service';
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

@Controller('patients')
export class PatientsController {
  constructor(
    private patientsService: PatientsService,
    private phoneVerificationService: PhoneVerificationService,
    private readonly audit: AuditService,
  ) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post()
  async create(
    @Body() body: Record<string, unknown>,
    @Req() req: RequestWithUser,
  ) {
    const patient = await this.patientsService.create(body);
    await this.audit.record({
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      action: 'admin.patient_created',
      resourceType: 'patient',
      resourceId: patient.id,
      result: 'success',
    });
    return patient;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMyProfile(@Req() req: RequestWithUser) {
    return this.patientsService.findByUserId(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateMyProfile(
    @Req() req: RequestWithUser,
    @Body() body: UpdateMyPatientDto,
  ) {
    return this.patientsService.updateMyProfile(req.user.sub, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('patient')
  @Get('me/phone-status')
  getMyPhoneStatus(@Req() req: RequestWithUser) {
    return this.phoneVerificationService.status(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('patient')
  @Post('me/phone/send-code')
  requestPhoneCode(
    @Req() req: RequestWithUser,
    @Body() body: RequestPhoneVerificationDto,
  ) {
    const requestIp = req.ip || req.socket.remoteAddress || 'unknown';
    return this.phoneVerificationService.requestCode(
      req.user.sub,
      body.phone,
      requestIp,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('patient')
  @Post('me/phone/verify-code')
  verifyPhoneCode(
    @Req() req: RequestWithUser,
    @Body() body: VerifyPhoneCodeDto,
  ) {
    return this.phoneVerificationService.verifyCode(
      req.user.sub,
      body.challengeId,
      body.code,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.patientsService.findAll(search, parsePageRequest(page, limit));
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('admin/:id')
  updateByAdmin(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    body: UpdatePatientByAdminDto,
    @Req() req: RequestWithUser,
  ) {
    return this.patientsService.updateById(id, body).then(async (patient) => {
      await this.audit.record({
        actorUserId: req.user.sub,
        actorRole: req.user.role,
        action: 'admin.patient_updated',
        resourceType: 'patient',
        resourceId: id,
        result: 'success',
      });
      return patient;
    });
  }
}
