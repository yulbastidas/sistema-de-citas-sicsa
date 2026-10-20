import { BadRequestException } from '@nestjs/common';

import { AppointmentClassService } from './appointment-class.service';

describe('AppointmentClassService', () => {
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const service = new AppointmentClassService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('oculta Lectura de resultados sin borrar el registro histórico', async () => {
    repository.find.mockResolvedValue([
      { id: 1, nombre: 'Primera vez', activo: true },
      { id: 2, nombre: 'Lectura de resultados', activo: true },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      { id: 1, nombre: 'Primera vez', activo: true },
    ]);
  });

  it('rechaza Lectura de resultados para una cita nueva', async () => {
    repository.findOne.mockResolvedValue({
      id: 2,
      nombre: 'Lectura de resultados',
      activo: true,
    });

    await expect(
      service.assertAvailableForNewAppointment(2),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
