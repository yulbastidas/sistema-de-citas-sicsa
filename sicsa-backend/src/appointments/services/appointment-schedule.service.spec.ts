/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';

import { AppointmentScheduleService } from './appointment-schedule.service';
import { Appointment } from '../entities/appointment.entity';

describe('AppointmentScheduleService date validation', () => {
  const service = new AppointmentScheduleService({} as never);

  it('rechaza una fecha civil imposible', () => {
    expect(() =>
      service.validateBusinessSchedule('2026-02-31', '08:00', 30),
    ).toThrow(BadRequestException);
  });

  it('rechaza una fecha pasada', () => {
    expect(() =>
      service.validateBusinessSchedule('2020-01-01', '08:00', 30),
    ).toThrow('No se pueden agendar citas en el pasado');
  });

  it('conserva una fecha futura dentro del horario permitido', () => {
    expect(() =>
      service.validateBusinessSchedule('2099-09-15', '08:00', 30),
    ).not.toThrow();
  });

  it('rechaza una cita que termina después del cierre institucional', () => {
    expect(() =>
      service.validateBusinessSchedule('2099-09-15', '17:20', 30),
    ).toThrow(BadRequestException);
  });

  it('rechaza una hora que ya pasó hoy en America/Bogota', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T15:00:00.000Z'));

    expect(() =>
      service.validateBusinessSchedule('2026-09-01', '09:00', 30),
    ).toThrow('No se puede agendar una hora que ya pasó');

    jest.useRealTimers();
  });

  it('detecta solapamiento real y permite intervalos contiguos', () => {
    const existing = {
      hora: '08:00',
      specialtyId: 1,
    } as Appointment;

    expect(service.hasScheduleConflict('08:20', 20, [existing])).toBe(true);
    expect(service.hasScheduleConflict('08:30', 30, [existing])).toBe(false);
  });

  it('consulta disponibilidad exclusivamente por doctor y estados bloqueantes', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const schedule = new AppointmentScheduleService(repository as never);

    await expect(
      schedule.isSlotAvailable(22, '2099-09-15', '08:00', 30),
    ).resolves.toBe(true);
    expect(repository.find).toHaveBeenCalledWith({
      where: {
        doctorId: 22,
        fecha: '2099-09-15',
        estado: expect.anything(),
      },
    });
  });
});
