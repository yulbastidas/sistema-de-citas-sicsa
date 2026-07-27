import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsPermissionGuard } from '../auth/guards/reports-permission.guard';

@UseGuards(AuthGuard('jwt'), ReportsPermissionGuard)
@Controller('reports')
export class ReportsController {
  @Get('test')
  testPermission() {
    return {
      success: true,
      message: 'Tienes permiso para acceder a los reportes',
    };
  }
}