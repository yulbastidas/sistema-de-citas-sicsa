import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService dual patient login', () => {
  const patientUser = {
    id: 21,
    email: 'patient@sicsa.test',
    password: 'hash',
    role: 'patient',
    emailVerified: true,
    canViewReports: false,
  };
  const usersService = { findByEmail: jest.fn() };
  const jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
  const userRepo = { findOne: jest.fn() };
  const patientRepo = { findOne: jest.fn() };
  const mfaService = { begin: jest.fn(), complete: jest.fn(), regenerate: jest.fn() };
  const service = new AuthService(
    usersService as never,
    jwtService as never,
    userRepo as never,
    patientRepo as never,
    {} as never,
    {} as never,
    {} as never,
    mfaService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('keeps patient email login working', async () => {
    usersService.findByEmail.mockResolvedValue(patientUser);

    await expect(
      service.login(' Patient@Sicsa.Test ', 'Valid123'),
    ).resolves.toMatchObject({ access_token: 'signed-token' });

    expect(usersService.findByEmail).toHaveBeenCalledWith('patient@sicsa.test');
    expect(patientRepo.findOne).not.toHaveBeenCalled();
  });

  it.each(['3001234567', '573001234567', '+573001234567'])(
    'allows a patient to log in with verified phone %s',
    async (identifier) => {
      patientRepo.findOne.mockResolvedValue({
        userId: patientUser.id,
        verifiedPhoneE164: '+573001234567',
      });
      userRepo.findOne.mockResolvedValue(patientUser);

      await expect(
        service.login(identifier, 'Valid123'),
      ).resolves.toMatchObject({ access_token: 'signed-token' });

      expect(patientRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { verifiedPhoneE164: '+573001234567' },
        }),
      );
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: patientUser.id, role: 'patient' },
      });
    },
  );

  it('rejects an unverified contact phone with a generic response', async () => {
    patientRepo.findOne.mockResolvedValue(null);

    await expect(service.login('3009999999', 'Valid123')).rejects.toMatchObject(
      {
        message: 'Credenciales inválidas',
      },
    );
  });

  it('does not authenticate a doctor or admin through a patient phone', async () => {
    patientRepo.findOne.mockResolvedValue({
      userId: 30,
      verifiedPhoneE164: '+573001234567',
    });
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.login('3001234567', 'Valid123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { id: 30, role: 'patient' },
    });
  });

  it('keeps wrong-password failures generic', async () => {
    usersService.findByEmail.mockResolvedValue(patientUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login('patient@sicsa.test', 'Wrong123'),
    ).rejects.toMatchObject({ message: 'Credenciales inválidas' });
  });

  it.each(['doctor', 'admin'])('does not issue a final JWT before MFA for %s', async (role) => {
    usersService.findByEmail.mockResolvedValue({ ...patientUser, role });
    mfaService.begin.mockResolvedValue({ requiresTwoFactor: true, challengeToken: 'challenge' });
    await expect(service.login(`${role}@sicsa.test`, 'Valid123')).resolves.toEqual(expect.objectContaining({ requiresTwoFactor: true }));
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
