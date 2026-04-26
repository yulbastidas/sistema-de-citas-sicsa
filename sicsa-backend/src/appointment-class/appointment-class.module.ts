import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentClass } from './entities/appointment-class.entity';
import { AppointmentClassController } from './appointment-class.controller';
import { AppointmentClassService } from './appointment-class.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentClass])],
  controllers: [AppointmentClassController],
  providers: [AppointmentClassService],
  exports: [AppointmentClassService],
})
export class AppointmentClassModule {}
