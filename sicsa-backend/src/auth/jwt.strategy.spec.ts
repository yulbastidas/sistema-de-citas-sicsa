import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy tokenVersion', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'jwt-strategy-test-secret'; });
  const payload = { sub: 4, email: 'user@sicsa.test', role: 'patient', emailVerified: true, canViewReports: false };

  it('keeps historical versionless tokens valid while the user remains at version zero', async () => {
    const strategy = new JwtStrategy({ findOne: jest.fn().mockResolvedValue({ id: 4, tokenVersion: 0 }) } as never);
    await expect(strategy.validate(payload)).resolves.toMatchObject({ id: 4, role: 'patient' });
  });

  it('invalidates an old token after a sensitive action increments the version', async () => {
    const strategy = new JwtStrategy({ findOne: jest.fn().mockResolvedValue({ id: 4, tokenVersion: 1 }) } as never);
    await expect(strategy.validate(payload)).rejects.toMatchObject({ status: 401 });
  });
});
