import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AuthRateLimitService } from '../src/auth/security/auth-rate-limit.service';
import { PhoneRegistrationService } from '../src/auth/phone-registration.service';
import { PhonePasswordRecoveryService } from '../src/auth/phone-password-recovery.service';
import { AuditService } from '../src/audit/audit.service';

describe('Authentication rate limiting (e2e)', () => {
  let app: INestApplication;

  const authService = {
    login: jest.fn((email: string, password: string) => {
      if (email === 'valid@sicsa.test' && password === 'Valid123') {
        return Promise.resolve({
          message: 'Login exitoso',
          access_token: 'test-token',
          user: { id: 1, email, role: 'patient' },
        });
      }

      return Promise.reject(
        new UnauthorizedException('Credenciales inválidas'),
      );
    }),
    register: jest.fn().mockResolvedValue({ message: 'Registro exitoso' }),
    sendVerificationCode: jest
      .fn()
      .mockResolvedValue({ message: 'Código enviado' }),
    verifyEmailCode: jest
      .fn()
      .mockResolvedValue({ message: 'Correo verificado' }),
    forgotPassword: jest
      .fn()
      .mockResolvedValue({ message: 'Solicitud procesada' }),
    verifyResetCode: jest.fn().mockResolvedValue({ message: 'Código válido' }),
    resetPassword: jest
      .fn()
      .mockResolvedValue({ message: 'Contraseña actualizada' }),
  };

  beforeAll(async () => {
    process.env.AUTH_LOGIN_MAX_ATTEMPTS = '5';
    process.env.AUTH_LOGIN_WINDOW_SECONDS = '900';
    process.env.AUTH_LOGIN_BLOCK_SECONDS = '60';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'short', ttl: 60_000, limit: 100 },
          { name: 'long', ttl: 900_000, limit: 1_000 },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        AuthRateLimitService,
        { provide: AuthService, useValue: authService },
        {
          provide: PhoneRegistrationService,
          useValue: { start: jest.fn(), verify: jest.fn(), resend: jest.fn() },
        },
        {
          provide: PhonePasswordRecoveryService,
          useValue: { request: jest.fn(), verify: jest.fn(), reset: jest.fn() },
        },
        { provide: AuditService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.AUTH_LOGIN_MAX_ATTEMPTS;
    delete process.env.AUTH_LOGIN_WINDOW_SECONDS;
    delete process.env.AUTH_LOGIN_BLOCK_SECONDS;
  });

  it('keeps a valid login working', () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'valid@sicsa.test', password: 'Valid123' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.access_token).toBe('test-token');
      }));

  it('keeps invalid credential responses generic', () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'single@sicsa.test', password: 'invalid' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.message).toBe('Credenciales inválidas');
      }));

  it('returns 429 and Retry-After after five failed tuple attempts', async () => {
    for (let attempt = 1; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'limited@sicsa.test', password: 'invalid' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'limited@sicsa.test', password: 'invalid' })
      .expect(429)
      .expect('Retry-After', /\d+/);
  });

  it('does not globally lock a different account', () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'valid@sicsa.test', password: 'Valid123' })
      .expect(201));

  it('keeps registration, recovery and verification routes working', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({})
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'recovery@sicsa.test' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/verify-reset-code')
      .send({ email: 'recovery@sicsa.test', code: '123456' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/verify-email-code')
      .send({ email: 'verify@sicsa.test', code: '123456' })
      .expect(201);
  });
});
