import { BadRequestException } from '@nestjs/common';
import { VerificationsService } from './verifications.service';

describe('VerificationsService', () => {
  let service: VerificationsService;

  const mockVerificationRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockPatientRepo = {
    findOne: jest.fn(),
  };

  const mockVerificationsGateway = {
    emitVerificationRequested: jest.fn(),
    emitVerificationUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new VerificationsService(
      mockVerificationRepo as any,
      mockPatientRepo as any,
      mockVerificationsGateway as any,
    );
  });

  it('should create a pending verification request', async () => {
    const user = {
      sub: 1,
      email: 'paciente@sicsa.com',
      role: 'paciente',
    };

    const data = {
      documento: '123456789',
      eps: 'Emssanar',
    };

    const createdVerification = {
      id: 1,
      patientId: user.sub,
      documento: data.documento,
      eps: data.eps,
      estado: 'pendiente',
      motivoRechazo: null,
      adminId: null,
      fechaExpiracion: null,
    };

    mockVerificationRepo.findOne.mockResolvedValue(null);
    mockVerificationRepo.create.mockReturnValue(createdVerification);
    mockVerificationRepo.save.mockResolvedValue(createdVerification);

    const result = await service.requestVerification(data, user);

    expect(mockVerificationRepo.findOne).toHaveBeenCalledWith({
      where: { patientId: user.sub },
      order: { id: 'DESC' },
    });

    expect(mockVerificationRepo.create).toHaveBeenCalledWith({
      patientId: user.sub,
      documento: data.documento,
      eps: data.eps,
      estado: 'pendiente',
      motivoRechazo: null,
      adminId: null,
      fechaExpiracion: null,
    });

    expect(mockVerificationRepo.save).toHaveBeenCalledWith(createdVerification);
    expect(mockVerificationsGateway.emitVerificationRequested).toHaveBeenCalledWith(
      createdVerification,
    );
    expect(result).toEqual(createdVerification);
  });

  it('should reject a duplicate pending verification request', async () => {
    const user = {
      sub: 1,
      email: 'paciente@sicsa.com',
      role: 'paciente',
    };

    const data = {
      documento: '123456789',
      eps: 'Emssanar',
    };

    mockVerificationRepo.findOne.mockResolvedValue({
      id: 1,
      patientId: user.sub,
      estado: 'pendiente',
    });

    await expect(service.requestVerification(data, user)).rejects.toThrow(
      BadRequestException,
    );

    expect(mockVerificationRepo.create).not.toHaveBeenCalled();
    expect(mockVerificationRepo.save).not.toHaveBeenCalled();
  });
});