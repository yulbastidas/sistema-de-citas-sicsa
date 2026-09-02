import { authenticator } from 'otplib';
import { MfaService } from './mfa.service';
import { MfaChallenge } from './entities/mfa-challenge.entity';
import { MfaCredential } from './entities/mfa-credential.entity';
import { MfaRecoveryCode } from './entities/mfa-recovery-code.entity';
import { User } from '../users/entities/user.entity';

describe('MfaService', () => {
  let credential: any;
  let challenge: any;
  const recovery: any[] = [];
  const qb = (get: () => any) => ({ addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), setLock: jest.fn().mockReturnThis(), getOne: jest.fn(async () => get()) });
  const credentialRepo: any = {
    createQueryBuilder: jest.fn(() => qb(() => credential)),
    create: jest.fn((v) => ({ ...v })),
    save: jest.fn(async (v) => (credential = { id: 1, lastUsedTotpStep: null, ...v })),
  };
  const challengeRepo: any = {
    update: jest.fn(), create: jest.fn((v) => ({ ...v })),
    save: jest.fn(async (v) => (challenge = { id: 1, ...v })),
    createQueryBuilder: jest.fn(() => qb(() => challenge)),
  };
  const recoveryRepo: any = {
    delete: jest.fn(async () => recovery.splice(0)),
    create: jest.fn((v) => ({ ...v })),
    save: jest.fn(async (v) => { if (Array.isArray(v)) recovery.push(...v); return v; }),
    createQueryBuilder: jest.fn(() => ({ addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getMany: jest.fn(async () => recovery.filter((v) => !v.usedAt)) })),
  };
  const userRepo: any = { findOneByOrFail: jest.fn(async () => ({ id: 9, email: 'medico@sicsa.test', role: 'doctor', tokenVersion: 0 })) };
  const manager: any = { getRepository: jest.fn((entity) => entity === MfaChallenge ? challengeRepo : entity === MfaCredential ? credentialRepo : entity === MfaRecoveryCode ? recoveryRepo : userRepo) };
  const dataSource: any = { transaction: jest.fn((callback) => callback(manager)), getRepository: jest.fn(() => ({ increment: jest.fn() })) };
  let service: MfaService;

  beforeEach(() => {
    process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    credential = undefined; challenge = undefined; recovery.splice(0); jest.clearAllMocks();
    service = new MfaService(credentialRepo, challengeRepo, recoveryRepo, dataSource);
  });

  it('requires enrollment and activates MFA only after a correct TOTP', async () => {
    const start = await service.begin({ id: 9, email: 'medico@sicsa.test' } as User);
    expect(start).toEqual(expect.objectContaining({ requiresTwoFactor: true, enrollmentRequired: true }));
    expect(credential.enabled).toBe(false);
    const token = authenticator.generate(start.manualKey!);
    const completed = await service.complete(start.challengeToken, 'totp', token);
    expect(credential.enabled).toBe(true);
    expect(completed.recoveryCodes).toHaveLength(8);
    expect(completed.user.id).toBe(9);
  });

  it('rejects an incorrect code without consuming the challenge', async () => {
    const start = await service.begin({ id: 9, email: 'medico@sicsa.test' } as User);
    await expect(service.complete(start.challengeToken, 'totp', '000000')).rejects.toMatchObject({ status: 401 });
    expect(challenge.attempts).toBe(1);
    expect(challenge.usedAt).toBeNull();
  });

  it('rejects replay of a consumed challenge', async () => {
    const start = await service.begin({ id: 9, email: 'medico@sicsa.test' } as User);
    const token = authenticator.generate(start.manualKey!);
    await service.complete(start.challengeToken, 'totp', token);
    await expect(service.complete(start.challengeToken, 'totp', token)).rejects.toMatchObject({ status: 401 });
  });
});
