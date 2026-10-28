import { BadRequestException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';

describe('DoctorsService', () => {
  const repo = { find: jest.fn() };
  const service = new DoctorsService(repo as never);

  beforeEach(() => repo.find.mockReset());

  it('returns only the minimal active-doctor catalog for a specialty', async () => {
    repo.find.mockResolvedValue([{ id: 4, nombre: 'Médica SICSA' }]);

    await expect(service.findActiveBySpecialty('13')).resolves.toEqual([
      { id: 4, nombre: 'Médica SICSA' },
    ]);
    expect(repo.find).toHaveBeenCalledWith({
      where: { especialidadId: 13, activo: true },
      select: {
        id: true,
        nombre: true,
        especialidadId: true,
        consultorio: true,
      },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  });

  it('rejects an invalid specialty identifier', async () => {
    await expect(
      service.findActiveBySpecialty('invalid'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
