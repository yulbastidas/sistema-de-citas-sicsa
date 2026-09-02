import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppointmentsController } from '../src/appointments/appointments.controller';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { N8nInternalGuard } from '../src/auth/guards/n8n-internal.guard';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { RolesGuard } from '../src/auth/roles.guard';
import { SpecialtiesController } from '../src/specialties/specialties.controller';
import { SpecialtiesService } from '../src/specialties/specialties.service';
import { AuditService } from '../src/audit/audit.service';

describe('Security perimeter (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const specialtiesService = {
    create: jest.fn().mockResolvedValue({ id: 1, nombre: 'Medicina' }),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  };

  const appointmentsService = {
    getTomorrowRemindersForN8n: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'security-perimeter-test-secret';
    process.env.N8N_INTERNAL_TOKEN = 'internal-test-token';

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: process.env.JWT_SECRET }),
      ],
      controllers: [SpecialtiesController, AppointmentsController],
      providers: [
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn().mockResolvedValue({ id: 1, tokenVersion: 0 }) } },
        RolesGuard,
        N8nInternalGuard,
        { provide: SpecialtiesService, useValue: specialtiesService },
        { provide: AppointmentsService, useValue: appointmentsService },
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

  describe('POST /specialties', () => {
    const send = (token?: string) => {
      const testRequest = request(app.getHttpServer())
        .post('/specialties')
        .send({ nombre: 'Medicina' });

      return token
        ? testRequest.set('Authorization', `Bearer ${token}`)
        : testRequest;
    };

    it('returns 401 without a token', () => send().expect(401));
    it('returns 403 for a patient', () =>
      send(tokenFor('patient')).expect(403));
    it('returns 403 for a doctor', () => send(tokenFor('doctor')).expect(403));
    it('allows an admin', () => send(tokenFor('admin')).expect(201));
  });

  describe('GET /appointments/n8n/reminders', () => {
    it('rejects a request without the internal token', () =>
      request(app.getHttpServer())
        .get('/appointments/n8n/reminders')
        .expect(403));

    it('rejects an incorrect internal token', () =>
      request(app.getHttpServer())
        .get('/appointments/n8n/reminders')
        .set('x-sicsa-internal-token', 'incorrect-token')
        .expect(403));

    it('allows the configured internal token', () =>
      request(app.getHttpServer())
        .get('/appointments/n8n/reminders')
        .set('x-sicsa-internal-token', 'internal-test-token')
        .expect(200));
  });
});
