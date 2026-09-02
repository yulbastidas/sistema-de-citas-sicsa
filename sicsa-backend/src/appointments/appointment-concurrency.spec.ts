/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await, @typescript-eslint/unbound-method */
import { AppointmentsService } from './appointments.service';
import { AppointmentScheduleService } from './services/appointment-schedule.service';

describe('AppointmentsService atomic doctor assignment', () => {
  const doctors = [
    { id: 10, especialidadId: 3, activo: true },
    { id: 20, especialidadId: 3, activo: true },
  ];

  const createService = (availability: boolean[]) => {
    const savedAppointments: Record<string, unknown>[] = [];
    const appointmentRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        const saved = { id: savedAppointments.length + 1, ...value };
        savedAppointments.push(saved);
        return saved;
      }),
    };
    const queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(doctors),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity.name === 'Doctor'
          ? { createQueryBuilder: () => queryBuilder }
          : appointmentRepository,
      ),
    };
    const dataSource = {
      transaction: jest.fn(async (work) => work(manager)),
    };
    const schedule = {
      getAppointmentDuration: jest.fn().mockReturnValue(30),
      validateBusinessSchedule: jest.fn(),
      validateRadiologyBase: jest.fn(),
      isSlotAvailable: jest.fn(async () => availability.shift() ?? false),
    } as unknown as AppointmentScheduleService;
    const mapper = {
      attachPatientData: jest.fn(async (value) => value),
    };
    const service = new AppointmentsService(
      {} as never,
      {
        findOne: jest.fn().mockResolvedValue({ userId: 7, eps: 'EPS' }),
      } as never,
      {} as never,
      {
        emitAppointmentCreated: jest.fn(),
        emitQueueUpdated: jest.fn(),
      } as never,
      {} as never,
      {} as never,
      schedule,
      {
        getPrioridad: jest.fn().mockResolvedValue({
          prioridad: 'baja',
          scorePrioridad: 0,
          explicacionPrioridad: 'Prueba',
        }),
      } as never,
      { sendAppointmentCreatedToN8n: jest.fn() } as never,
      mapper as never,
      {} as never,
      dataSource as never,
    );

    return { service, schedule, savedAppointments };
  };

  const dto = {
    specialtyId: 3,
    appointmentClassId: 1,
    fecha: '2099-09-15',
    hora: '08:00',
    edad: 30,
    motivoConsulta: 'Control',
  };

  it('asigna el primer médico activo disponible en orden', async () => {
    const { service } = createService([true]);

    const result = await service.create(dto as never, {
      sub: 7,
      email: 'patient@example.test',
      role: 'patient',
    });

    expect(result.doctorId).toBe(10);
    expect(result.estado).toBe('confirmada');
  });

  it('salta el médico ocupado y asigna el siguiente disponible', async () => {
    const { service, schedule } = createService([false, true]);

    const result = await service.create(dto as never, {
      sub: 7,
      email: 'patient@example.test',
      role: 'patient',
    });

    expect(schedule.isSlotAvailable).toHaveBeenNthCalledWith(
      1,
      10,
      dto.fecha,
      dto.hora,
      30,
      expect.anything(),
    );
    expect(result.doctorId).toBe(20);
    expect(result.estado).toBe('confirmada');
  });

  it('mantiene la lista de espera si todos los médicos están ocupados', async () => {
    const { service } = createService([false, false]);

    const result = await service.create(dto as never, {
      sub: 7,
      email: 'patient@example.test',
      role: 'patient',
    });

    expect(result.doctorId).toBe(10);
    expect(result.estado).toBe('lista_espera');
  });
});
