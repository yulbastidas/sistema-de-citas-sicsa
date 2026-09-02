import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService patient registration validation', () => {
  const userRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((value: Record<string, unknown>) => value),
    save: jest.fn((value: Record<string, unknown>) =>
      Promise.resolve({ ...value, id: 7 }),
    ),
  };
  const patientRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((value: Record<string, unknown>) => value),
    save: jest.fn((value: Record<string, unknown>) => Promise.resolve(value)),
  };
  const emailCodeRepo = {
    update: jest.fn().mockResolvedValue({}),
    create: jest.fn((value: Record<string, unknown>) => value),
    save: jest.fn((value: Record<string, unknown>) => Promise.resolve(value)),
  };
  const epsRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 3,
      nombre: 'EPS Canónica',
      activo: true,
    }),
  };

  const service = new AuthService(
    {} as never,
    {} as never,
    userRepo as never,
    patientRepo as never,
    emailCodeRepo as never,
    {} as never,
    epsRepo as never,
    {} as never,
  );

  const payload: RegisterDto = {
    email: 'paciente@sicsa.test',
    password: 'clave123',
    tipoDocumento: 'CC',
    numeroDocumento: '1234567890',
    primerNombre: 'María',
    segundoNombre: '',
    primerApellido: 'Muñoz',
    segundoApellido: '',
    telefono: '3001234567',
    eps: 'EPS Canónica',
    epsId: 3,
    genero: 'Femenino',
    fechaNacimiento: '2000-01-01',
    departamento: 'Nariño',
    municipio: 'Pasto',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
    process.env.N8N_VERIFICATION_CODE_WEBHOOK_URL = 'https://n8n.test/verify';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers a valid patient with the canonical EPS and patient role', async () => {
    await expect(service.register(payload)).resolves.toMatchObject({
      message: 'Registro exitoso. Verifica tu correo.',
      userId: 7,
      email: payload.email,
      emailVerified: false,
    });

    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'patient' }),
    );
    expect(patientRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ epsId: 3, eps: 'EPS Canónica' }),
    );
    expect(patientRepo.create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        verifiedPhoneE164: expect.anything(),
        phoneVerifiedAt: expect.anything(),
      }),
    );
  });

  it('rejects an inactive or unknown EPS identifier', async () => {
    epsRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.register(payload)).rejects.toThrow(
      'La EPS seleccionada no existe o no está activa',
    );
  });

  it('rejects a false EPS name paired with a valid identifier', async () => {
    await expect(
      service.register({ ...payload, eps: 'EPS inventada' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
