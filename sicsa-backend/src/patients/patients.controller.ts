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

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

type RequestWithUser = Request & {
  user: JwtUser;
};

type UpdatePatientByAdminDto = {
  tipoDocumento?: string;
  numeroDocumento?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  telefono?: string;
  email?: string;
  eps?: string;
  epsId?: number;
  genero?: string;
  fechaNacimiento?: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  tipoSangre?: string;
  factorRh?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
};

type UpdateMyPatientDto = {
  telefono?: string;
  email?: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  tipoSangre?: string;
  factorRh?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
};

@Controller('patients')
export class PatientsController {
  constructor(
    private patientsService: PatientsService,
  ) {}

  @Post()
  create(
    @Body() body: Record<string, unknown>,
  ) {
    return this.patientsService.create(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMyProfile(
    @Req() req: RequestWithUser,
  ) {
    return this.patientsService.findByUserId(
      req.user.sub,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateMyProfile(
    @Req() req: RequestWithUser,
    @Body() body: UpdateMyPatientDto,
  ) {
    return this.patientsService.updateMyProfile(
      req.user.sub,
      body,
    );
  }

  @UseGuards(
    AuthGuard('jwt'),
    RolesGuard,
  )
  @Roles('admin')
  @Get()
  findAll(
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll(search);
  }

  @UseGuards(
    AuthGuard('jwt'),
    RolesGuard,
  )
  @Roles('admin')
  @Patch('admin/:id')
  updateByAdmin(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    body: UpdatePatientByAdminDto,
  ) {
    return this.patientsService.updateById(
      id,
      body,
    );
  }
}