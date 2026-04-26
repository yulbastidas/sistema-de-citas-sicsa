import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentClass } from './entities/appointment-class.entity';

@Injectable()
export class AppointmentClassService {
  constructor(
    @InjectRepository(AppointmentClass)
    private readonly appointmentClassRepo: Repository<AppointmentClass>,
  ) {}

  async findAll(): Promise<AppointmentClass[]> {
    return this.appointmentClassRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }
}
