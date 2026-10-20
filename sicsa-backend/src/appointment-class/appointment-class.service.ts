import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const classes = await this.appointmentClassRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });

    return classes.filter((item) => !this.isResultsReading(item.nombre));
  }

  async assertAvailableForNewAppointment(id: number): Promise<void> {
    const appointmentClass = await this.appointmentClassRepo.findOne({
      where: { id },
    });

    if (!appointmentClass) {
      throw new NotFoundException('La clase de cita seleccionada no existe');
    }

    if (
      !appointmentClass.activo ||
      this.isResultsReading(appointmentClass.nombre)
    ) {
      throw new BadRequestException(
        'La clase de cita seleccionada no está disponible para nuevas citas',
      );
    }
  }

  private isResultsReading(name: string): boolean {
    return this.normalize(name) === 'lectura de resultados';
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}
