import { BadRequestException } from '@nestjs/common';
import { PhoneRegistrationService } from './phone-registration.service';
import { OtpPurpose } from './otp/otp-purpose';
import { PendingPhoneRegistration } from './entities/pending-phone-registration.entity';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Eps } from '../eps/entities/eps.entity';
import { EntityManager } from 'typeorm';

describe('PhoneRegistrationService', () => {
  const pendingRepository = {
    find: jest.fn(),
    create: jest.fn(() => ({})),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
  };
  const userRepository = { findOne: jest.fn() };
  const patientQuery = {
    addSelect: jest.fn(),
    where: jest.fn(),
    getOne: jest.fn(),
  };
  patientQuery.addSelect.mockReturnValue(patientQuery);
  patientQuery.where.mockReturnValue(patientQuery);
  const patientRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => patientQuery),
  };
  const epsRepository = { findOne: jest.fn() };
  const otpService = { request: jest.fn(), verify: jest.fn() };
  const service = new PhoneRegistrationService(
    pendingRepository as never,
    userRepository as never,
    patientRepository as never,
    epsRepository as never,
    otpService as never,
  );

  const dto = {
    email: 'paciente@example.com',
    password: 'Segura123',
    tipoDocumento: 'CC',
    numeroDocumento: '123456789',
    primerNombre: 'Ana',
    primerApellido: 'Pérez',
    telefono: '3001234567',
    eps: 'EPS Activa',
    epsId: 1,
    genero: 'Femenino',
    fechaNacimiento: '1990-01-01',
    departamento: 'Cauca',
    municipio: 'Popayán',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    patientQuery.addSelect.mockReturnValue(patientQuery);
    patientQuery.where.mockReturnValue(patientQuery);
    userRepository.findOne.mockResolvedValue(null);
    patientRepository.findOne.mockResolvedValue(null);
    patientQuery.getOne.mockResolvedValue(null);
    epsRepository.findOne.mockResolvedValue({
      id: 1,
      nombre: 'EPS Activa',
      activo: true,
    });
    pendingRepository.find.mockResolvedValue([]);
    pendingRepository.save.mockImplementation((value: object) =>
      Promise.resolve({ id: 7, ...value }),
    );
    otpService.request.mockResolvedValue({
      challengeId: 'a97b6ab3-8f55-46db-8092-e319d506b70f',
      maskedPhone: '******4567',
      expiresAt: new Date('2026-08-30T15:05:00Z'),
    });
  });

  it('normaliza el celular y solicita OTP de registro sin crear User', async () => {
    const result = await service.start(dto, '127.0.0.1');

    expect(otpService.request).toHaveBeenCalledWith({
      userId: 7,
      phone: '+573001234567',
      requestIp: '127.0.0.1',
      purpose: OtpPurpose.PHONE_REGISTRATION,
    });
    expect(result.maskedPhone).toBe('******4567');
  });

  it('rechaza un teléfono ya verificado con respuesta genérica', async () => {
    patientQuery.getOne.mockResolvedValue({ id: 99 });

    await expect(service.start(dto, '127.0.0.1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(otpService.request).not.toHaveBeenCalled();
  });

  it('crea exactamente un User y un Patient al consumir el OTP', async () => {
    const stored = { ...dto, telefono: '3001234567' };
    const pending = {
      id: 7,
      email: dto.email,
      phoneE164: '+573001234567',
      documentNumber: dto.numeroDocumento,
      passwordHash: 'hash-seguro',
      registrationData: JSON.stringify(stored),
      expiresAt: new Date(Date.now() + 60_000),
    };
    pendingRepository.findOne.mockResolvedValue(pending);

    const pendingQuery = {
      setLock: jest.fn(),
      addSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(pending),
    };
    pendingQuery.setLock.mockReturnValue(pendingQuery);
    pendingQuery.addSelect.mockReturnValue(pendingQuery);
    pendingQuery.where.mockReturnValue(pendingQuery);

    const managedUserRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: Partial<User>) => value),
      save: jest.fn().mockResolvedValue({ id: 21 }),
    };
    const managedPatientQuery = {
      addSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    managedPatientQuery.addSelect.mockReturnValue(managedPatientQuery);
    managedPatientQuery.where.mockReturnValue(managedPatientQuery);
    const managedPatientRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn(() => managedPatientQuery),
      create: jest.fn((value: Partial<Patient>) => value),
      save: jest.fn().mockResolvedValue({ id: 31 }),
    };
    const managedPendingRepository = {
      createQueryBuilder: jest.fn(() => pendingQuery),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const managedEpsRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 1, nombre: 'EPS Activa' }),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === PendingPhoneRegistration)
          return managedPendingRepository;
        if (entity === User) return managedUserRepository;
        if (entity === Patient) return managedPatientRepository;
        if (entity === Eps) return managedEpsRepository;
        throw new Error('Repositorio inesperado');
      }),
    };
    otpService.verify.mockImplementation(
      async (
        _input: unknown,
        onVerified: (manager: EntityManager, phone: string) => Promise<void>,
      ) => {
        await onVerified(manager as unknown as EntityManager, '+573001234567');
        return true;
      },
    );

    await expect(
      service.verify(7, 'a97b6ab3-8f55-46db-8092-e319d506b70f', '123456'),
    ).resolves.toMatchObject({ phoneVerified: true });
    expect(managedUserRepository.save).toHaveBeenCalledTimes(1);
    expect(managedPatientRepository.save).toHaveBeenCalledTimes(1);
    expect(managedPatientRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 21,
        verifiedPhoneE164: '+573001234567',
        phoneVerifiedAt: expect.any(Date) as Date,
      }),
    );
    expect(managedPendingRepository.delete).toHaveBeenCalledWith(7);
  });
});
