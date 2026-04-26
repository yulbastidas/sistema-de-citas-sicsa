import { Controller, Get } from '@nestjs/common';
import { AppointmentClassService } from './appointment-class.service';

@Controller('appointment-class')
export class AppointmentClassController {
  constructor(
    private readonly appointmentClassService: AppointmentClassService,
  ) {}

  @Get()
  findAll() {
    return this.appointmentClassService.findAll();
  }
}
