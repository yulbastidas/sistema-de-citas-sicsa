import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OtpPurpose } from './otp/otp-purpose';
import { PhonePasswordRecoveryService } from './phone-password-recovery.service';

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

describe('PhonePasswordRecoveryService', () => {
  const patientRepository = { findOne: jest.fn() };
  const userRepository = { findOne: jest.fn() };
  const otpService = { request: jest.fn(), verify: jest.fn() };
  const dataSource = { transaction: jest.fn() };
  const service = new PhonePasswordRecoveryService(
    patientRepository as never,
    userRepository as never,
    otpService as never,
    dataSource as never,
  );
  const patientUser = {
    id: 9,
    email: 'patient@sicsa.test',
    role: 'patient',
    password: 'current-hash',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('secure-hash');
  });

  it('returns the same generic response without sending for an unknown phone', async () => {
    patientRepository.findOne.mockResolvedValue(null);

    const result = await service.request('3001234567', '127.0.0.1');

    expect(result.message).toContain('cuenta válida');
    expect(result.maskedPhone).toBe('******4567');
    expect(result.challengeId).toEqual(expect.any(String));
    expect(otpService.request).not.toHaveBeenCalled();
  });

  it('uses only a verified patient phone and the password-reset purpose', async () => {
    patientRepository.findOne.mockResolvedValue({
      userId: 9,
      verifiedPhoneE164: '+573001234567',
      phoneVerifiedAt: new Date(),
    });
    userRepository.findOne.mockResolvedValue(patientUser);
    otpService.request.mockResolvedValue({
      challengeId: 'challenge-id',
      maskedPhone: '******4567',
    });

    await expect(
      service.request('+573001234567', '127.0.0.1'),
    ).resolves.toMatchObject({
      challengeId: 'challenge-id',
      maskedPhone: '******4567',
    });
    expect(otpService.request).toHaveBeenCalledWith({
      userId: 9,
      phone: '+573001234567',
      requestIp: '127.0.0.1',
      purpose: OtpPurpose.PHONE_PASSWORD_RESET,
    });
  });

  it('does not treat an unverified contact phone as a recovery factor', async () => {
    patientRepository.findOne.mockResolvedValue(null);
    await service.request('3009999999', '127.0.0.1');
    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(otpService.request).not.toHaveBeenCalled();
  });

  it('keeps the initial response generic when SMS delivery fails', async () => {
    patientRepository.findOne.mockResolvedValue({
      userId: 9,
      verifiedPhoneE164: '+573001234567',
      phoneVerifiedAt: new Date(),
    });
    userRepository.findOne.mockResolvedValue(patientUser);
    otpService.request.mockRejectedValue(new Error('provider unavailable'));

    const result = await service.request('3001234567', '127.0.0.1');
    expect(result.message).toContain('cuenta válida');
    expect(result.maskedPhone).toBe('******4567');
  });

  it('consumes the OTP and creates a hashed one-use reset grant', async () => {
    patientRepository.findOne.mockResolvedValue({
      userId: 9,
      verifiedPhoneE164: '+573001234567',
      phoneVerifiedAt: new Date(),
    });
    userRepository.findOne.mockResolvedValue(patientUser);
    const resetRepository = {
      update: jest.fn(),
      create: jest.fn(
        (value: Record<string, unknown>): Record<string, unknown> => value,
      ),
      save: jest.fn(),
    };
    otpService.verify.mockImplementation(
      async (
        _input: unknown,
        onVerified: (
          manager: { getRepository: () => typeof resetRepository },
          phone: string,
        ) => Promise<void>,
      ) => {
        await onVerified(
          { getRepository: () => resetRepository },
          '+573001234567',
        );
        return true;
      },
    );

    const result = await service.verify('3001234567', 'challenge', '123456');

    expect(result.resetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(otpService.verify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 9,
        purpose: OtpPurpose.PHONE_PASSWORD_RESET,
      }),
      expect.any(Function),
    );
    expect(resetRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ codeHash: 'secure-hash', used: false }),
    );
  });

  it('rejects phone recovery for a non-patient account', async () => {
    patientRepository.findOne.mockResolvedValue({
      userId: 20,
      verifiedPhoneE164: '+573001234567',
      phoneVerifiedAt: new Date(),
    });
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      service.verify('3001234567', 'challenge', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('changes only the password and invalidates the reset grant', async () => {
    const patientQuery = {
      setLock: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ userId: 9 }),
    };
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({ ...patientUser }),
      save: jest.fn(),
    };
    const resetQuery = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest
        .fn()
        .mockResolvedValue([{ codeHash: 'grant-hash', used: false }]),
    };
    const resetRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(resetQuery),
      update: jest.fn(),
    };
    dataSource.transaction.mockImplementation(
      (
        callback: (manager: {
          getRepository: (entity: { name: string }) => unknown;
        }) => Promise<unknown>,
      ) =>
        callback({
          getRepository: (entity: { name: string }) => {
            if (entity.name === 'Patient') {
              return { createQueryBuilder: () => patientQuery };
            }
            if (entity.name === 'User') return userRepo;
            return resetRepo;
          },
        }),
    );
    (bcrypt.compare as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await expect(
      service.reset(
        '3001234567',
        'a'.repeat(64),
        'NewPassword1',
        'NewPassword1',
      ),
    ).resolves.toMatchObject({ passwordUpdated: true });
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'secure-hash' }),
    );
    expect(resetRepo.update).toHaveBeenCalledWith(
      { email: patientUser.email, used: false },
      { used: true },
    );
  });

  it('rejects mismatched password confirmation before persistence', async () => {
    await expect(
      service.reset('3001234567', 'a'.repeat(64), 'Password1', 'Password2'),
    ).rejects.toMatchObject({ message: 'Las contraseñas no coinciden' });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
