import { AuthRateLimitService } from './auth-rate-limit.service';

describe('AuthRateLimitService', () => {
  beforeEach(() => {
    process.env.AUTH_LOGIN_MAX_ATTEMPTS = '5';
    process.env.AUTH_LOGIN_WINDOW_SECONDS = '900';
    process.env.AUTH_LOGIN_BLOCK_SECONDS = '60';
    process.env.AUTH_CODE_RESEND_COOLDOWN_SECONDS = '60';
    jest.useFakeTimers({ now: new Date('2026-08-27T12:00:00Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.AUTH_LOGIN_MAX_ATTEMPTS;
    delete process.env.AUTH_LOGIN_WINDOW_SECONDS;
    delete process.env.AUTH_LOGIN_BLOCK_SECONDS;
    delete process.env.AUTH_CODE_RESEND_COOLDOWN_SECONDS;
  });

  it('temporarily blocks only the IP and normalized identifier tuple', () => {
    const service = new AuthRateLimitService();

    for (let attempt = 1; attempt < 5; attempt += 1) {
      expect(
        service.recordLoginFailure('10.0.0.1', ' Patient@Example.com '),
      ).toBe(0);
    }

    expect(service.recordLoginFailure('10.0.0.1', 'patient@example.com')).toBe(
      60,
    );
    expect(
      service.getLoginRetryAfterSeconds('10.0.0.2', 'patient@example.com'),
    ).toBe(0);
    expect(
      service.getLoginRetryAfterSeconds('10.0.0.1', 'other@example.com'),
    ).toBe(0);
  });

  it('allows the tuple again after the temporary block expires', () => {
    const service = new AuthRateLimitService();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordLoginFailure('10.0.0.1', 'patient@example.com');
    }

    jest.advanceTimersByTime(60_001);

    expect(
      service.getLoginRetryAfterSeconds('10.0.0.1', 'patient@example.com'),
    ).toBe(0);
  });

  it('clears previous failures after a successful login', () => {
    const service = new AuthRateLimitService();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      service.recordLoginFailure('10.0.0.1', 'patient@example.com');
    }

    service.clearLoginFailures('10.0.0.1', 'patient@example.com');

    expect(service.recordLoginFailure('10.0.0.1', 'patient@example.com')).toBe(
      0,
    );
  });

  it('applies code delivery cooldown by action, IP and identifier', () => {
    const service = new AuthRateLimitService();

    expect(
      service.consumeIdentifierCooldown(
        'forgot-password',
        '10.0.0.1',
        'patient@example.com',
      ),
    ).toBe(0);
    expect(
      service.consumeIdentifierCooldown(
        'forgot-password',
        '10.0.0.1',
        'patient@example.com',
      ),
    ).toBe(60);
    expect(
      service.consumeIdentifierCooldown(
        'forgot-password',
        '10.0.0.1',
        'other@example.com',
      ),
    ).toBe(0);
  });
});
