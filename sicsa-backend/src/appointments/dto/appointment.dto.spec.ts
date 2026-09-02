import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateAppointmentDto } from './appointment.dto';
import { CreateAdminAppointmentDto } from './create-admin-appointment.dto';

const validPayload = {
  fecha: '2026-09-15',
  hora: '08:30',
  motivoConsulta: 'Control médico general',
  specialtyId: 1,
  edad: 35,
  appointmentClassId: 1,
};

describe('CreateAppointmentDto', () => {
  it('acepta y normaliza una solicitud válida', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      ...validPayload,
      motivoConsulta: '  Control médico general  ',
      observaciones: '  Sin observaciones  ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.motivoConsulta).toBe('Control médico general');
    expect(dto.observaciones).toBe('Sin observaciones');
  });

  it.each([
    ['fecha con formato inválido', { fecha: '15/09/2026' }],
    ['hora inválida', { hora: '25:00' }],
    ['edad negativa', { edad: -1 }],
    ['edad superior a 120', { edad: 121 }],
    ['especialidad no positiva', { specialtyId: 0 }],
    ['clase de cita no positiva', { appointmentClassId: 0 }],
    ['motivo vacío', { motivoConsulta: '   ' }],
    ['motivo demasiado corto', { motivoConsulta: 'ab' }],
    ['observaciones demasiado largas', { observaciones: 'x'.repeat(3001) }],
  ])('rechaza %s', async (_case, changes) => {
    const dto = plainToInstance(CreateAppointmentDto, {
      ...validPayload,
      ...changes,
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});

describe('CreateAdminAppointmentDto', () => {
  it('acepta el payload real de creación administrativa', async () => {
    const dto = plainToInstance(CreateAdminAppointmentDto, {
      documento: '1234567890',
      ...validPayload,
      eps: 'EPS registrada',
      epsId: 1,
      departamento: 'Nariño',
      municipio: 'Pasto',
      observaciones: '',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rechaza fecha, hora e identificadores inválidos', async () => {
    const dto = plainToInstance(CreateAdminAppointmentDto, {
      documento: '1234567890',
      ...validPayload,
      fecha: '15/09/2026',
      hora: '8:30',
      specialtyId: 0,
      appointmentClassId: -1,
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
