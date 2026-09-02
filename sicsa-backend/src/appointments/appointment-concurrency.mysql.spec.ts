/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import dataSource from '../database/data-source';
import { Appointment } from './entities/appointment.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentScheduleService } from './services/appointment-schedule.service';
import { AppointmentWaitlistService } from './services/appointment-waitlist.service';

const describeWithMysql =
  process.env.RUN_MYSQL_INTEGRATION === 'true' ? describe : describe.skip;

describeWithMysql('Appointment concurrency with MySQL', () => {
  beforeAll(async () => {
    await dataSource.initialize();
    await dataSource.query('DELETE FROM `appointment`');
    await dataSource.query('DELETE FROM `doctor`');
    await dataSource.query('DELETE FROM `patient`');
    await dataSource.query('DELETE FROM `specialty`');
    await dataSource.query('DELETE FROM `eps`');
    await dataSource.query('DELETE FROM `appointment_class`');
    await dataSource.query('DELETE FROM `user`');
    await dataSource.query(
      'INSERT INTO `user` (`id`, `email`, `password`, `role`, `emailVerified`, `canViewReports`, `tokenVersion`) VALUES (700, ?, ?, ?, 1, 0, 0), (701, ?, ?, ?, 1, 0, 0), (702, ?, ?, ?, 1, 0, 0), (901, ?, ?, ?, 1, 0, 0)',
      [
        'patient700@example.test',
        'hash',
        'patient',
        'patient701@example.test',
        'hash',
        'patient',
        'patient702@example.test',
        'hash',
        'patient',
        'doctor901@example.test',
        'hash',
        'doctor',
      ],
    );
    await dataSource.query(
      'INSERT INTO `specialty` (`id`, `nombre`, `descripcion`, `activa`) VALUES (901, ?, NULL, 1)',
      ['Concurrency test'],
    );
    await dataSource.query(
      'INSERT INTO `eps` (`id`, `nombre`, `activo`) VALUES (1, ?, 1)',
      ['EPS test'],
    );
    await dataSource.query(
      'INSERT INTO `appointment_class` (`id`, `nombre`, `activo`) VALUES (1, ?, 1)',
      ['Class test'],
    );
    for (const userId of [700, 701, 702]) {
      await dataSource.query(
        'INSERT INTO `patient` (`userId`, `tipoDocumento`, `numeroDocumento`, `primerNombre`, `primerApellido`, `telefono`, `email`, `eps`, `epsId`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          'CC',
          `TEST-${userId}`,
          'Patient',
          'Test',
          `3000000${userId}`,
          `patient${userId}@example.test`,
          'EPS test',
          1,
        ],
      );
    }
    await dataSource.query(
      'INSERT INTO `doctor` (`id`, `userId`, `nombre`, `especialidadId`, `activo`) VALUES (901, 901, ?, 901, 1)',
      ['Doctor test'],
    );
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM `appointment`');
  });

  const createService = () => {
    const appointmentRepository = dataSource.getRepository(Appointment);
    const schedule = new AppointmentScheduleService(appointmentRepository);
    const mapper = { attachPatientData: jest.fn(async (value) => value) };

    return new AppointmentsService(
      appointmentRepository,
      {
        findOne: jest.fn().mockResolvedValue({
          userId: 700,
          eps: 'EPS test',
          epsId: 1,
        }),
      } as never,
      dataSource.getRepository(Doctor),
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
          explicacionPrioridad: 'Prueba local',
        }),
      } as never,
      { sendAppointmentCreatedToN8n: jest.fn() } as never,
      mapper as never,
      {} as never,
      dataSource,
    );
  };

  const dto = {
    documento: 'TEST-700',
    specialtyId: 901,
    appointmentClassId: 1,
    fecha: '2099-09-15',
    hora: '08:00',
    edad: 30,
    motivoConsulta: 'Prueba concurrente',
  };

  it('createByAdmin confirma solo una de dos solicitudes simultáneas', async () => {
    const service = createService();

    const results = await Promise.all([
      service.createByAdmin(dto as never),
      service.createByAdmin(dto as never),
    ]);

    expect(results.filter((item) => item.estado === 'confirmada')).toHaveLength(
      1,
    );
    expect(
      results.filter((item) => item.estado === 'lista_espera'),
    ).toHaveLength(1);
    expect(results.every((item) => item.doctorId === 901)).toBe(true);
  });

  it('revierte la transacción cuando falla la persistencia', async () => {
    const service = createService();
    const reserve = (
      service as unknown as {
        reserveAppointmentAtomically: (
          data: Partial<Appointment>,
          specialtyId: number,
          duration: number,
        ) => Promise<Appointment>;
      }
    ).reserveAppointmentAtomically.bind(service);
    const before = await dataSource.getRepository(Appointment).count();

    await expect(
      reserve(
        {
          specialtyId: 901,
          fecha: '2099-09-15',
          hora: '08:00',
        },
        901,
        30,
      ),
    ).rejects.toBeDefined();

    await expect(dataSource.getRepository(Appointment).count()).resolves.toBe(
      before,
    );
  });

  it('dos promociones simultáneas no confirman dos citas en el mismo intervalo', async () => {
    const appointmentRepository = dataSource.getRepository(Appointment);
    const schedule = new AppointmentScheduleService(appointmentRepository);
    const waitlist = new AppointmentWaitlistService(
      schedule,
      {} as never,
      {} as never,
      {} as never,
    );
    await appointmentRepository.save([
      appointmentRepository.create({
        patientId: 701,
        doctorId: 901,
        specialtyId: 901,
        fecha: '2099-09-15',
        hora: '10:00',
        estado: 'lista_espera',
        scorePrioridad: 20,
      }),
      appointmentRepository.create({
        patientId: 702,
        doctorId: 901,
        specialtyId: 901,
        fecha: '2099-09-15',
        hora: '10:30',
        estado: 'lista_espera',
        scorePrioridad: 10,
      }),
    ]);

    const promote = () =>
      dataSource.transaction(async (manager) => {
        await manager
          .getRepository(Doctor)
          .createQueryBuilder('doctor')
          .setLock('pessimistic_write')
          .where('doctor.id = :id', { id: 901 })
          .getOne();
        return waitlist.assignReleasedSlotToWaitlist(
          manager,
          '2099-09-15',
          '08:00',
          30,
          901,
          901,
        );
      });

    const results = await Promise.all([promote(), promote()]);
    const confirmed = await appointmentRepository.countBy({
      doctorId: 901,
      fecha: '2099-09-15',
      hora: '08:00',
      estado: 'confirmada',
    });

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(confirmed).toBe(1);
  });
});
