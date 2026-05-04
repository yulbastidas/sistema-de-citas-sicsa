import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/appointment.dto';
import { CreateAdminAppointmentDto } from '../dto/create-admin-appointment.dto';

type AppointmentInput = CreateAppointmentDto | CreateAdminAppointmentDto;

@Injectable()
export class AppointmentScheduleService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  getAppointmentDuration(appointmentClassId?: number | null): number {
    switch (appointmentClassId) {
      case 1:
        return 20;
      case 2:
        return 30;
      case 3:
        return 30;
      case 4:
        return 20;
      case 5:
        return 20;
      case 6:
        return 40;
      default:
        return 20;
    }
  }

  validateBusinessSchedule(
    fecha: string,
    hora: string,
    durationMinutes: number,
  ): void {
    const day = this.getDayOfWeek(fecha);
    const startMinutes = this.timeToMinutes(hora);

    if (day === 0 || day === 1) {
      throw new BadRequestException(
        'No se pueden agendar citas los domingos ni los lunes',
      );
    }

    if (day === 2 || day === 3) {
      const opening = this.timeToMinutes('08:00');
      const closing = this.timeToMinutes('17:40');

      if (startMinutes < opening || startMinutes > closing) {
        throw new BadRequestException(
          'Los martes y miércoles las citas inician desde las 08:00',
        );
      }
    }

    if (day === 4 || day === 5) {
      const opening = this.timeToMinutes('07:00');
      const closing = this.timeToMinutes('17:40');

      if (startMinutes < opening || startMinutes > closing) {
        throw new BadRequestException(
          'Los jueves y viernes las citas inician desde las 07:00',
        );
      }
    }

    if (day === 6) {
      const opening = this.timeToMinutes('07:00');
      const closing = this.timeToMinutes('12:40');

      if (startMinutes < opening || startMinutes > closing) {
        throw new BadRequestException(
          'Los sábados solo se pueden agendar citas hasta las 12:40',
        );
      }
    }

    void durationMinutes;
  }

  validateRadiologyBase(data: AppointmentInput): void {
    const RADIOLOGY_CLASS_ID = 4;

    if (data.appointmentClassId !== RADIOLOGY_CLASS_ID) {
      return;
    }

    const hasMedicalOrder =
      typeof data.ordenMedicaUrl === 'string' &&
      data.ordenMedicaUrl.trim().length > 0;

    if (!hasMedicalOrder) {
      throw new BadRequestException(
        'Para radiología se requiere una orden médica',
      );
    }
  }

  async isSlotAvailable(
    fecha: string,
    hora: string,
    durationMinutes: number,
  ): Promise<boolean> {
    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: In(this.getBlockingStates()),
      },
    });

    return !this.hasScheduleConflict(hora, durationMinutes, appointments);
  }

  async getAvailableHours(
    fecha: string,
    appointmentClassId?: number,
  ): Promise<string[]> {
    const duration = this.getAppointmentDuration(appointmentClassId);
    const hours = this.generateAvailableHoursByDate(fecha);

    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: In(this.getBlockingStates()),
      },
    });

    return hours.filter((hour) => {
      try {
        this.validateBusinessSchedule(fecha, hour, duration);
        return !this.hasScheduleConflict(hour, duration, appointments);
      } catch {
        return false;
      }
    });
  }

  generateAvailableHoursByDate(fecha: string): string[] {
    const day = this.getDayOfWeek(fecha);

    if (day === 0 || day === 1) {
      return [];
    }

    if (day === 2 || day === 3) {
      return this.generateHours('08:00', '17:40', 20);
    }

    if (day === 4 || day === 5) {
      return this.generateHours('07:00', '17:40', 20);
    }

    if (day === 6) {
      return this.generateHours('07:00', '12:40', 20);
    }

    return [];
  }

  generateHours(start: string, end: string, stepMinutes: number): string[] {
    const hours: string[] = [];
    let current = this.timeToMinutes(start);
    const limit = this.timeToMinutes(end);

    while (current <= limit) {
      hours.push(this.minutesToTime(current));
      current += stepMinutes;
    }

    return hours;
  }

  getBlockingStates(): string[] {
    return ['confirmada', 'aprobada', 'pendiente', 'atendida'];
  }

  hasScheduleConflict(
    requestedHour: string,
    requestedDuration: number,
    appointments: Appointment[],
  ): boolean {
    const requestedStart = this.timeToMinutes(requestedHour);
    const requestedEnd = requestedStart + requestedDuration;

    return appointments.some((appointment) => {
      const appointmentStart = this.timeToMinutes(appointment.hora);
      const appointmentDuration = this.getAppointmentDuration(
        appointment.appointmentClassId,
      );
      const appointmentEnd = appointmentStart + appointmentDuration;

      return requestedStart < appointmentEnd && requestedEnd > appointmentStart;
    });
  }

  getDayOfWeek(fecha: string): number {
    const [year, month, day] = fecha.split('-').map(Number);
    return new Date(year, month - 1, day).getDay();
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
