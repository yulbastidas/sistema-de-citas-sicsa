import { NotFoundException } from '@nestjs/common';
import { AppointmentClassService } from './appointment-class/appointment-class.service';
import { DoctorsService } from './doctors/doctors.service';
import { EpsService } from './eps/eps.service';
import { SpecialtiesService } from './specialties/specialties.service';

describe('small catalog and doctor lookups', () => {
  it('requests only active appointment classes in stable order', async () => {
    const repo = { find: jest.fn().mockResolvedValue([{ id: 1 }]) };
    await expect(new AppointmentClassService(repo as never).findAll()).resolves.toEqual([{ id: 1 }]);
    expect(repo.find).toHaveBeenCalledWith({ where: { activo: true }, order: { nombre: 'ASC' } });
  });

  it('requests only active EPS records in stable order', async () => {
    const repo = { find: jest.fn().mockResolvedValue([{ id: 2 }]) };
    await expect(new EpsService(repo as never).findAll()).resolves.toEqual([{ id: 2 }]);
    expect(repo.find).toHaveBeenCalledWith({ where: { activo: true }, order: { nombre: 'ASC' } });
  });

  it('keeps specialty catalog filtering and lookup behavior', async () => {
    const repo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue({ id: 3 }) };
    const service = new SpecialtiesService(repo as never);
    await service.findAll();
    await expect(service.findOne(3)).resolves.toEqual({ id: 3 });
    expect(repo.find).toHaveBeenCalledWith({ where: { activa: true }, order: { nombre: 'ASC' } });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it('returns only an active doctor and rejects a missing profile', async () => {
    const repo = { findOne: jest.fn().mockResolvedValueOnce({ id: 4 }).mockResolvedValueOnce(null) };
    const service = new DoctorsService(repo as never);
    await expect(service.findByUserId(9)).resolves.toEqual({ id: 4 });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { userId: 9, activo: true } });
    await expect(service.findByUserId(10)).rejects.toBeInstanceOf(NotFoundException);
  });
});
