import { ConflictException } from '@nestjs/common';
import { OtpPurpose } from '../auth/otp/otp-purpose';
import { PhoneVerificationService } from './phone-verification.service';

/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- dobles mínimos y focalizados de TypeORM/OtpService */

describe('PhoneVerificationService', () => {
  const patient = { id: 7, userId: 42, verifiedPhoneE164: null };
  let repository: any;
  let otpService: any;
  let service: PhoneVerificationService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn().mockResolvedValue(patient),
      createQueryBuilder: jest.fn(),
    };
    otpService = { request: jest.fn(), verify: jest.fn() };
    service = new PhoneVerificationService(repository, otpService);
  });

  it('normaliza y solicita OTP para el usuario autenticado', async () => {
    repository.findOne
      .mockResolvedValueOnce(patient)
      .mockResolvedValueOnce(null);
    otpService.request.mockResolvedValue({ challengeId: 'challenge' });

    await service.requestCode(42, '3001234567', '127.0.0.1');

    expect(otpService.request).toHaveBeenCalledWith({
      userId: 42,
      phone: '+573001234567',
      requestIp: '127.0.0.1',
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });
  });

  it('rechaza un celular ya verificado por otra cuenta', async () => {
    repository.findOne
      .mockResolvedValueOnce(patient)
      .mockResolvedValueOnce({ id: 9 });

    await expect(
      service.requestCode(42, '3001234567', '127.0.0.1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(otpService.request).not.toHaveBeenCalled();
  });

  it('actualiza el paciente solo dentro del consumo transaccional', async () => {
    const savedPatient = { ...patient, verifiedPhoneE164: null };
    const transactionalRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(savedPatient),
      }),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(savedPatient),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(transactionalRepository),
    };
    otpService.verify.mockImplementation(
      async (_input: unknown, callback: any) => {
        await callback(manager, '+573001234567');
        return { phoneE164: '+573001234567' };
      },
    );

    const result = await service.verifyCode(42, 'challenge', '123456');

    expect(savedPatient.verifiedPhoneE164).toBe('+573001234567');
    expect(transactionalRepository.save).toHaveBeenCalled();
    expect(result.maskedPhone).toBe('******4567');
  });
});
