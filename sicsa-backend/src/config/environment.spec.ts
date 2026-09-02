import {
  getAuthRateLimitConfig,
  getCorsOrigins,
  getJwtExpiresIn,
  getJwtSecret,
} from './environment';

describe('environment configuration', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = { ...originalEnvironment };
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('fails clearly when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecret()).toThrow(
      'Falta la variable de entorno obligatoria JWT_SECRET',
    );
  });

  it('uses the configured JWT expiration', () => {
    process.env.JWT_EXPIRES_IN = '2h';

    expect(getJwtExpiresIn()).toBe('2h');
  });

  it('parses configured CORS origins without wildcards', () => {
    process.env.CORS_ORIGINS =
      'http://localhost:3001, https://sicsa.example.test';

    expect(getCorsOrigins()).toEqual([
      'http://localhost:3001',
      'https://sicsa.example.test',
    ]);
  });

  it('uses conservative defaults for authentication rate limiting', () => {
    delete process.env.AUTH_LOGIN_MAX_ATTEMPTS;
    delete process.env.AUTH_LOGIN_WINDOW_SECONDS;
    delete process.env.AUTH_LOGIN_BLOCK_SECONDS;

    expect(getAuthRateLimitConfig()).toMatchObject({
      loginMaxAttempts: 5,
      loginWindowMs: 900_000,
      loginBlockMs: 900_000,
    });
  });

  it('rejects invalid authentication rate limit values', () => {
    process.env.AUTH_LOGIN_MAX_ATTEMPTS = 'not-a-number';

    expect(() => getAuthRateLimitConfig()).toThrow(
      'AUTH_LOGIN_MAX_ATTEMPTS debe ser un entero',
    );
  });
});
