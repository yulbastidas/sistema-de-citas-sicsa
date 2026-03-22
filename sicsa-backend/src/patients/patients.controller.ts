import { Controller, Post, Get, Body } from '@nestjs/common';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {

  constructor(private patientsService: PatientsService) {}

  @Post()
  create(@Body() body) {
    return this.patientsService.create(body);
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

}