import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Appointment } from '../entities/appointment.entity';
import { Specialty } from '../../specialties/entities/specialty.entity';
import { CreateAppointmentDto } from '../dto/appointment.dto';
import { CreateAdminAppointmentDto } from '../dto/create-admin-appointment.dto';
import { isColombianNationalHoliday } from './colombian-holidays';

type AppointmentInput = CreateAppointmentDto | CreateAdminAppointmentDto;

@Injectable()
export class AppointmentScheduleService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Specialty)
    private specialtyRepo: Repository<Specialty>,
  ) {}

  async resolveAppointmentDuration(specialtyId: number): Promise<number> {
    const specialty = await this.specialtyRepo.findOne({
      where: { id: specialtyId, activa: true },
    });

    if (!specialty) {
      throw new BadRequestException(
        'La especialidad seleccionada no está disponible',
      );
    }

    if (this.normalizeName(specialty.nombre).includes('psicolog')) {
      return 20;
    }

    return this.getAppointmentDurationBySpecialty(specialtyId);
  }

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

    if (isColombianNationalHoliday(fecha)) {
      throw new BadRequestException(
        'No se pueden agendar citas en festivos nacionales de Colombia',
      );
    }

    if (day === 0 || day === 1) {
      throw new BadRequestException(
        'No se pueden agendar citas los domingos ni los lunes',
      );
    }

    if (day >= 2 && day <= 5) {
      const morningStart = this.timeToMinutes('08:00');
      const morningEnd = this.timeToMinutes('12:00');
      const afternoonStart = this.timeToMinutes('14:00');
      const afternoonEnd = this.timeToMinutes('18:00');
      const endMinutes = startMinutes + durationMinutes;
      const fitsMorning =
        startMinutes >= morningStart && endMinutes <= morningEnd;
      const fitsAfternoon =
        startMinutes >= afternoonStart && endMinutes <= afternoonEnd;

      if (!fitsMorning && !fitsAfternoon) {
        throw new BadRequestException(
          'De martes a viernes se atiende de 08:00 a 12:00 y de 14:00 a 18:00',
        );
      }
    }

    if (day === 6) {
      const opening = this.timeToMinutes('07:00');
      const closing = this.timeToMinutes('13:00');

      if (startMinutes < opening || startMinutes + durationMinutes > closing) {
        throw new BadRequestException(
          'Los sábados se atiende de 07:00 a 13:00',
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

    const durationMap = await this.getDurationMap(appointments);
    return !this.hasScheduleConflict(
      hora,
      durationMinutes,
      appointments,
      durationMap,
    );
  }

  async getAvailableHours(
    fecha: string,
    specialtyId?: number,
    doctorIds?: number[],
  ): Promise<string[]> {
    if (!specialtyId) return [];

    const duration = await this.resolveAppointmentDuration(specialtyId);

    const hours = this.generateAvailableHoursByDate(fecha, duration);

    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: In(this.getBlockingStates()),
      },
    });
    const durationMap = await this.getDurationMap(appointments);

    return hours.filter((hour) => {
      try {
        this.validateBusinessSchedule(fecha, hour, duration);

        if (!doctorIds?.length) {
          return !this.hasScheduleConflict(
            hour,
            duration,
            appointments,
            durationMap,
          );
        }

        return doctorIds.some(
          (doctorId) =>
            !this.hasScheduleConflict(
              hour,
              duration,
              appointments.filter(
                (appointment) => appointment.doctorId === doctorId,
              ),
              durationMap,
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

    if (day === 0 || day === 1 || isColombianNationalHoliday(fecha)) {
      return [];
    }

    if (day === 2 || day === 3) {
      return [
        ...this.generateHours('08:00', '12:00', durationMinutes),
        ...this.generateHours('14:00', '18:00', durationMinutes),
      ];
    }

    if (day === 4 || day === 5) {
      return [
        ...this.generateHours('08:00', '12:00', durationMinutes),
        ...this.generateHours('14:00', '18:00', durationMinutes),
      ];
    }

    if (day === 6) {
      return this.generateHours('07:00', '13:00', durationMinutes);
    }

    return [];
  }

  generateHours(start: string, end: string, stepMinutes: number): string[] {
    const hours: string[] = [];
    let current = this.timeToMinutes(start);
    const limit = this.timeToMinutes(end);

    while (current + stepMinutes <= limit) {
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
    durationMap: Map<number, number> = new Map(),
  ): boolean {
    const requestedStart = this.timeToMinutes(requestedHour);
    const requestedEnd = requestedStart + requestedDuration;

    return appointments.some((appointment) => {
      const appointmentStart = this.timeToMinutes(appointment.hora);

      const appointmentDuration =
        durationMap.get(appointment.specialtyId) ??
        this.getAppointmentDurationBySpecialty(appointment.specialtyId);

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

  private normalizeName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private async getDurationMap(
    appointments: Appointment[],
  ): Promise<Map<number, number>> {
    const ids = [
      ...new Set(
        appointments
          .map((appointment) => Number(appointment.specialtyId))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];

    if (ids.length === 0) return new Map();

    const specialties = await this.specialtyRepo.find({
      where: { id: In(ids) },
    });

    return new Map(
      specialties.map((specialty) => [
        specialty.id,
        this.normalizeName(specialty.nombre).includes('psicolog')
          ? 20
          : this.getAppointmentDurationBySpecialty(specialty.id),
      ]),
    );
  }
}
