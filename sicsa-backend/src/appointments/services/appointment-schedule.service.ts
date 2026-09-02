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

  getAppointmentDurationBySpecialty(specialtyId?: number | null): number {
    const specialtyIdNumber = Number(specialtyId);

    switch (specialtyIdNumber) {
      case 9: // Higienista oral
      case 13: // Médico general
      case 15: // Odontología
        return 20;

      default:
        return 30;
    }
  }

  /** @deprecated Use getAppointmentDurationBySpecialty para evitar confundirlo con appointmentClassId. */
  getAppointmentDuration(specialtyId?: number | null): number {
    return this.getAppointmentDurationBySpecialty(specialtyId);
  }

  validateBusinessSchedule(
    fecha: string,
    hora: string,
    durationMinutes: number,
  ): void {
    this.validateAppointmentDate(fecha);

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

      if (startMinutes < opening || startMinutes + durationMinutes > closing) {
        throw new BadRequestException(
          'Los martes y miércoles las citas inician desde las 08:00',
        );
      }
    }

    if (day === 4 || day === 5) {
      const opening = this.timeToMinutes('07:00');
      const closing = this.timeToMinutes('17:40');

      if (startMinutes < opening || startMinutes + durationMinutes > closing) {
        throw new BadRequestException(
          'Los jueves y viernes las citas inician desde las 07:00',
        );
      }
    }

    if (day === 6) {
      const opening = this.timeToMinutes('07:00');
      const closing = this.timeToMinutes('12:40');

      if (startMinutes < opening || startMinutes + durationMinutes > closing) {
        throw new BadRequestException(
          'Los sábados solo se pueden agendar citas hasta las 12:40',
        );
      }
    }

    this.validateNotPastTime(fecha, hora);
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
    doctorId: number,
    fecha: string,
    hora: string,
    durationMinutes: number,
    repository: Repository<Appointment> = this.appointmentRepo,
  ): Promise<boolean> {
    const appointments = await repository.find({
      where: {
        doctorId,
        fecha,
        estado: In(this.getBlockingStates()),
      },
    });

    return !this.hasScheduleConflict(hora, durationMinutes, appointments);
  }

  async getAvailableHours(
    fecha: string,
    specialtyId?: number,
    doctorIds?: number[],
  ): Promise<string[]> {
    const duration = this.getAppointmentDurationBySpecialty(specialtyId);

    const hours = this.generateAvailableHoursByDate(fecha, duration);

    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: In(this.getBlockingStates()),
      },
    });

    return hours.filter((hour) => {
      try {
        this.validateBusinessSchedule(fecha, hour, duration);

        if (!doctorIds?.length) {
          return !this.hasScheduleConflict(hour, duration, appointments);
        }

        return doctorIds.some(
          (doctorId) =>
            !this.hasScheduleConflict(
              hour,
              duration,
              appointments.filter(
                (appointment) => appointment.doctorId === doctorId,
              ),
            ),
        );
      } catch {
        return false;
      }
    });
  }

  generateAvailableHoursByDate(
    fecha: string,
    durationMinutes: number,
  ): string[] {
    const day = this.getDayOfWeek(fecha);

    if (day === 0 || day === 1) {
      return [];
    }

    if (day === 2 || day === 3) {
      return this.generateHours('08:00', '17:40', durationMinutes);
    }

    if (day === 4 || day === 5) {
      return this.generateHours('07:00', '17:40', durationMinutes);
    }

    if (day === 6) {
      return this.generateHours('07:00', '12:40', durationMinutes);
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

      const appointmentDuration = this.getAppointmentDurationBySpecialty(
        appointment.specialtyId,
      );

      const appointmentEnd = appointmentStart + appointmentDuration;

      return requestedStart < appointmentEnd && requestedEnd > appointmentStart;
    });
  }

  getDayOfWeek(fecha: string): number {
    const [year, month, day] = fecha.split('-').map(Number);

    return new Date(year, month - 1, day).getDay();
  }

  private validateAppointmentDate(fecha: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');
    }

    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new BadRequestException('La fecha de la cita no es válida');
    }

    const todayInColombia = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    if (fecha < todayInColombia) {
      throw new BadRequestException('No se pueden agendar citas en el pasado');
    }
  }

  private validateNotPastTime(fecha: string, hora: string): void {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date())
        .map((part) => [part.type, part.value]),
    );
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const nowMinutes = Number(parts.hour) * 60 + Number(parts.minute);
    if (fecha === today && this.timeToMinutes(hora) <= nowMinutes) {
      throw new BadRequestException('No se puede agendar una hora que ya pasó');
    }
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
  }

  minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}`;
  }
}
