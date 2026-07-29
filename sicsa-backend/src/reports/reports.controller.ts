import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsPermissionGuard } from '../auth/guards/reports-permission.guard';
import { ReportsService } from './reports.service';
import { ReportFiltersDto } from './dto/report-filters.dto';

@UseGuards(
  AuthGuard('jwt'),
  ReportsPermissionGuard,
)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('test')
  testPermission() {
    return {
      success: true,
      message:
        'Tienes permiso para acceder a los reportes',
    };
  }

  @Get('dashboard')
  getDashboard(
    @Query() filters: ReportFiltersDto,
  ) {
    return this.reportsService.getDashboard(filters);
  }

  @Get('no-shows')
  getNoShows(
    @Query() filters: ReportFiltersDto,
  ) {
    return this.reportsService.getNoShows(filters);
  }

    @Get('appointments')
  getAppointments(
    @Query() filters: ReportFiltersDto,
  ) {
    return this.reportsService.getAppointments(filters);
  }
}