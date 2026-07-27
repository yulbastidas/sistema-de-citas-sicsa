import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsPermissionGuard } from '../auth/guards/reports-permission.guard';

@Module({
  controllers: [ReportsController],
  providers: [ReportsPermissionGuard],
})
export class ReportsModule {}