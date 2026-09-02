import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { RolesGuard } from '../src/auth/roles.guard';
import { PatientsController } from '../src/patients/patients.controller';
import { PatientsService } from '../src/patients/patients.service';
import { PhoneVerificationService } from '../src/patients/phone-verification.service';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { AuditService } from '../src/audit/audit.service';

describe('Security authorization (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const usersService = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ message: 'ok', user: {} }),
  };

  const patientsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const phoneVerificationService = {
    status: jest.fn(),
    requestCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'security-test-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: process.env.JWT_SECRET }),
      ],
      controllers: [UsersController, PatientsController],
      providers: [
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn().mockResolvedValue({ id: 1, tokenVersion: 0 }) } },
        RolesGuard,
        { provide: UsersService, useValue: usersService },
        { provide: PatientsService, useValue: patientsService },
        {
          provide: PhoneVerificationService,
          useValue: phoneVerificationService,
        },
        { provide: AuditService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const tokenFor = (role: 'admin' | 'patient' | 'doctor') =>
    jwtService.sign({
      sub: 1,
      email: `${role}@sicsa.test`,
      role,
      emailVerified: true,
      canViewReports: role === 'admin',
    });

  describe.each([
    ['GET', '/users'],
    ['POST', '/users'],
    ['POST', '/patients'],
  ])('%s %s', (method, path) => {
    const send = (token?: string) => {
      const testRequest =
        method === 'GET'
          ? request(app.getHttpServer()).get(path)
          : request(app.getHttpServer()).post(path).send({});

      return token
        ? testRequest.set('Authorization', `Bearer ${token}`)
        : testRequest;
    };

    it('returns 401 without a token', () => send().expect(401));

    it('returns 403 for a patient', () =>
      send(tokenFor('patient')).expect(403));

    it('returns 403 for a doctor', () => send(tokenFor('doctor')).expect(403));

    it('allows an admin', () =>
      send(tokenFor('admin')).expect(method === 'POST' ? 201 : 200));
  });

  describe('patient phone verification ownership', () => {
    beforeEach(() => {
      phoneVerificationService.status.mockResolvedValue({ verified: false });
    });

    it('requires authentication', () =>
      request(app.getHttpServer())
        .get('/patients/me/phone-status')
        .expect(401));

    it.each(['doctor', 'admin'] as const)('rejects role %s', (role) =>
      request(app.getHttpServer())
        .get('/patients/me/phone-status')
        .set('Authorization', `Bearer ${tokenFor(role)}`)
        .expect(403),
    );

    it('uses the patient identity from JWT', async () => {
      await request(app.getHttpServer())
        .get('/patients/me/phone-status')
        .set('Authorization', `Bearer ${tokenFor('patient')}`)
        .expect(200);
      expect(phoneVerificationService.status).toHaveBeenCalledWith(1);
    });
  });
});
