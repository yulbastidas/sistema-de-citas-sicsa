/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { AppointmentWaitlistService } from './appointment-waitlist.service';

describe('AppointmentWaitlistService', () => {
  it('promueve solo un candidato compatible usando el médico y duración liberados', async () => {
    const candidates = [
      {
        id: 4,
        fecha: '2099-09-15',
        hora: '10:00',
        specialtyId: 3,
        appointmentClassId: 99,
        estado: 'lista_espera',
      },
    ];
    const repository = {
      createQueryBuilder: jest.fn(() => ({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(candidates),
      })),
      save: jest.fn(async (candidate) => candidate),
    };
    const manager = { getRepository: jest.fn(() => repository) };
    const schedule = {
      getAppointmentDurationBySpecialty: jest.fn().mockReturnValue(30),
      validateBusinessSchedule: jest.fn(),
      isSlotAvailable: jest.fn().mockResolvedValue(true),
    };
    const service = new AppointmentWaitlistService(
      schedule as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const promoted = await service.assignReleasedSlotToWaitlist(
      manager as never,
      '2099-09-15',
      '08:00',
      30,
      22,
      3,
    );

    expect(schedule.getAppointmentDurationBySpecialty).toHaveBeenCalledWith(3);
    expect(schedule.isSlotAvailable).toHaveBeenCalledWith(
      22,
      '2099-09-15',
      '08:00',
      30,
      repository,
    );
    expect(promoted).toMatchObject({
      doctorId: 22,
      specialtyId: 3,
      hora: '08:00',
      estado: 'confirmada',
    });
  });

  it('no promueve una cita de duración mayor al intervalo liberado', async () => {
    const repository = {
      createQueryBuilder: jest.fn(() => ({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 5, specialtyId: 7, estado: 'lista_espera' },
          ]),
      })),
      save: jest.fn(),
    };
    const service = new AppointmentWaitlistService(
      {
        getAppointmentDurationBySpecialty: jest.fn().mockReturnValue(30),
      } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.assignReleasedSlotToWaitlist(
        { getRepository: () => repository } as never,
        '2099-09-15',
        '08:00',
        20,
        22,
        7,
      ),
    ).resolves.toBeNull();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
