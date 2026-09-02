/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

describe('Appointment cancellation transaction', () => {
  const user = { sub: 7, email: 'patient@example.test', role: 'patient' };

  it('cancela y notifica la promoción solamente después del commit', async () => {
    const appointment = {
      id: 44,
      patientId: 7,
      doctorId: 10,
      specialtyId: 3,
      fecha: '2099-09-15',
      hora: '08:00',
      estado: 'confirmada',
    };
    const promoted = { ...appointment, id: 45, patientId: 8 };
    const appointmentQuery = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(appointment),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity.name === 'Doctor'
          ? {
              createQueryBuilder: () => ({
                setLock: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue({ id: 10 }),
              }),
            }
          : {
              createQueryBuilder: () => appointmentQuery,
              save: jest.fn(async (value) => value),
            },
      ),
    };
    let committed = false;
    const dataSource = {
      transaction: jest.fn(async (work) => {
        const result = await work(manager);
        committed = true;
        return result;
      }),
    };
    const gateway = {
      emitAppointmentCancelled: jest.fn(() => expect(committed).toBe(true)),
      emitQueueUpdated: jest.fn(() => expect(committed).toBe(true)),
    };
    const waitlist = {
      assignReleasedSlotToWaitlist: jest.fn().mockResolvedValue(promoted),
      notifyAssignmentAfterCommit: jest.fn(() => {
        expect(committed).toBe(true);
      }),
    };
    const service = new AppointmentsService(
      { findOne: jest.fn().mockResolvedValue(appointment) } as never,
      {} as never,
      {} as never,
      gateway as never,
      {} as never,
      {} as never,
      {
        getAppointmentDurationBySpecialty: jest.fn().mockReturnValue(30),
        getBlockingStates: jest.fn().mockReturnValue(['confirmada']),
      } as never,
      {} as never,
      {} as never,
      { attachPatientData: jest.fn(async (value) => value) } as never,
      waitlist as never,
      dataSource as never,
    );

    await expect(service.cancel(44, user)).resolves.toMatchObject({
      id: 44,
      estado: 'cancelada',
    });
    expect(waitlist.assignReleasedSlotToWaitlist).toHaveBeenCalled();
    expect(waitlist.notifyAssignmentAfterCommit).toHaveBeenCalledWith(promoted);
  });

  it('mantiene el bloqueo de cancelación para una cita pasada', async () => {
    const service = new AppointmentsService(
      {
        findOne: jest.fn().mockResolvedValue({
          id: 44,
          patientId: 7,
          fecha: '2020-01-01',
          hora: '08:00',
          estado: 'confirmada',
        }),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.cancel(44, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
