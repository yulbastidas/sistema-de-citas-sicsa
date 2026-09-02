import { ForbiddenException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { MedicalReportsService } from '../medical-reports/medical-reports.service';

describe('Doctor resource ownership', () => {
  const doctorUser = {
    sub: 100,
    email: 'doctor-a@sicsa.test',
    role: 'doctor',
  };
  const adminUser = {
    sub: 1,
    email: 'admin@sicsa.test',
    role: 'admin',
  };

  const doctors = [
    { id: 10, userId: 100, activo: true },
    { id: 11, userId: 200, activo: true },
  ];

  const doctorRepo = {
    findOne: jest.fn(({ where }: { where: { id?: number; userId?: number } }) =>
      Promise.resolve(
        doctors.find(
          (doctor) =>
            (where.userId !== undefined && doctor.userId === where.userId) ||
            (where.id !== undefined && doctor.id === where.id),
        ) ?? null,
      ),
    ),
  };

  const mapperService = {
    attachPatientData: jest.fn((appointment) => Promise.resolve(appointment)),
    attachPatientDataBatch: jest.fn().mockResolvedValue([]),
  };

  const createAppointmentsService = (appointmentDoctorId = 10) => {
    const appointmentRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({
        id: 55,
        doctorId: appointmentDoctorId,
      }),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    return {
      appointmentRepo,
      service: new AppointmentsService(
        appointmentRepo as never,
        {} as never,
        doctorRepo as never,
        {} as never,
        {} as never,
        { findByAppointmentId: jest.fn() } as never,
        {} as never,
        {} as never,
        {} as never,
        mapperService as never,
        {} as never,
        {} as never,
      ),
    };
  };

  it('allows a doctor to request their own agenda and history', async () => {
    const { service } = createAppointmentsService();

    const pagination = { page: 1, limit: 20 };
    const emptyPage = { data: [], ...pagination, total: 0, totalPages: 0 };
    await expect(service.findByDoctor(100, doctorUser, pagination, {})).resolves.toEqual(emptyPage);
    await expect(service.findByDoctor(10, doctorUser, pagination, {})).resolves.toEqual(emptyPage);
    await expect(service.findHistoryByDoctor(100, doctorUser, pagination, {})).resolves.toEqual(emptyPage);
  });

  it('rejects a doctor requesting another doctor agenda or history', async () => {
    const { service } = createAppointmentsService();

    await expect(service.findByDoctor(200, doctorUser, { page: 1, limit: 20 }, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.findHistoryByDoctor(200, doctorUser, { page: 1, limit: 20 }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects another doctor queue and permits admin lookup', async () => {
    const { service } = createAppointmentsService();

    await expect(
      service.getQueue('2026-08-26', 200, doctorUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.getQueue('2026-08-26', 200, adminUser),
    ).resolves.toEqual([]);
  });

  it('rejects a doctor downloading another doctor clinical PDF', async () => {
    const { service } = createAppointmentsService(11);

    await expect(
      service.generateMedicalReportPdf(55, doctorUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('protects clinical report reads and writes by appointment ownership', async () => {
    const appointmentRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 55, doctorId: 11 }),
    };
    const reportRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 8, appointmentId: 55 }),
    };
    const service = new MedicalReportsService(
      reportRepo as never,
      appointmentRepo as never,
      doctorRepo as never,
    );

    await expect(
      service.findByAppointmentId(55, doctorUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.upsert({ appointmentId: 55 } as never, doctorUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.findByAppointmentId(55, adminUser)).resolves.toEqual({
      id: 8,
      appointmentId: 55,
    });
  });
});
