import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;

  const mockAppointmentsService = {
    getTomorrowRemindersForN8n: jest.fn(),
    create: jest.fn(),
    createByAdmin: jest.fn(),
    findAll: jest.fn(),
    getByUser: jest.fn(),
    findByDoctor: jest.fn(),
    findHistoryByDoctor: jest.fn(),
    cancel: jest.fn(),
    getAvailable: jest.fn(),
    getQueue: jest.fn(),
    getTomorrowReminders: jest.fn(),
    generateMedicalReportPdf: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an appointment using the authenticated user', async () => {
    const body = {
      fecha: '2026-05-25',
      hora: '08:00',
      motivo: 'Consulta médica general',
      appointmentClassId: 1,
    } as any;

    const req = {
      user: {
        sub: 1,
        email: 'paciente@sicsa.com',
        role: 'paciente',
      },
    } as any;

    const expectedResponse = {
      id: 10,
      ...body,
      patientId: req.user.sub,
      estado: 'pendiente',
    };

    mockAppointmentsService.create.mockResolvedValue(expectedResponse);

    const result = await controller.create(body, req);

    expect(mockAppointmentsService.create).toHaveBeenCalledWith(
      body,
      req.user,
    );
    expect(result).toEqual(expectedResponse);
  });

  it('should return available appointments with valid appointmentClassId', async () => {
    const expectedResponse = [
      {
        hora: '08:00',
        disponible: true,
      },
      {
        hora: '08:30',
        disponible: true,
      },
    ];

    mockAppointmentsService.getAvailable.mockResolvedValue(expectedResponse);

    const result = await controller.getAvailable('2026-05-25', '1');

    expect(mockAppointmentsService.getAvailable).toHaveBeenCalledWith(
      '2026-05-25',
      1,
    );
    expect(result).toEqual(expectedResponse);
  });

  it('should reject invalid appointmentClassId', () => {
    expect(() => controller.getAvailable('2026-05-25', 'abc')).toThrow(
      BadRequestException,
    );

    expect(mockAppointmentsService.getAvailable).not.toHaveBeenCalled();
  });
});