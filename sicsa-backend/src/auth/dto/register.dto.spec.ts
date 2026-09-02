import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

const validPayload = {
  email: 'paciente@sicsa.test',
  password: 'clave123',
  tipoDocumento: 'CC',
  numeroDocumento: '1234567890',
  primerNombre: 'María José',
  segundoNombre: '',
  primerApellido: "O'Connor",
  segundoApellido: 'Muñoz',
  telefono: '3001234567',
  eps: 'EPS de prueba',
  epsId: 1,
  genero: 'Femenino',
  fechaNacimiento: '2000-02-29',
  departamento: 'Nariño',
  municipio: 'Pasto',
};

async function errorsFor(overrides: Record<string, unknown> = {}) {
  const dto = plainToInstance(RegisterDto, { ...validPayload, ...overrides });
  return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
}

describe('RegisterDto critical validations', () => {
  it.each([
    ['CC', '1234567890'],
    ['TI', '1234567890'],
    ['TI', '12345678901'],
    ['CE', '1234'],
    ['CE', '1234567890'],
    ['RC', '1234567890'],
    ['RC', '12345678901'],
    ['PASAPORTE', 'PA123456'],
    ['PASAPORTE', 'XK908172'],
  ])('accepts valid %s document %s', async (tipoDocumento, numeroDocumento) => {
    await expect(
      errorsFor({ tipoDocumento, numeroDocumento }),
    ).resolves.toHaveLength(0);
  });

  it.each([
    ['CC', '123ABC'],
    ['CC', '12'],
    ['CC', '12345678901'],
    ['TI', '12345ABC90'],
    ['CE', '12-A'],
    ['RC', '123456789A'],
    ['PASAPORTE', 'PA-123'],
    ['PASAPORTE', 'PA 123'],
    ['PASAPORTE', '@@123'],
  ])(
    'rejects invalid %s document %s',
    async (tipoDocumento, numeroDocumento) => {
      expect(
        await errorsFor({ tipoDocumento, numeroDocumento }),
      ).not.toHaveLength(0);
    },
  );

  it.each([
    'María',
    'María José',
    'Muñoz',
    'Ana-María',
    "O'Connor",
    'De la Cruz',
  ])('accepts real name %s', async (primerNombre) => {
    await expect(errorsFor({ primerNombre })).resolves.toHaveLength(0);
  });

  it.each(['Juan123', '@Maria', 'María😀'])(
    'rejects invalid name %s',
    async (primerNombre) => {
      expect(await errorsFor({ primerNombre })).not.toHaveLength(0);
    },
  );

  it.each(['3001234567', '3109876543'])(
    'accepts Colombian mobile %s',
    async (telefono) => {
      await expect(errorsFor({ telefono })).resolves.toHaveLength(0);
    },
  );

  it.each(['2001234567', '300123456', '30012345678', '300ABC4567'])(
    'rejects invalid mobile %s',
    async (telefono) => {
      expect(await errorsFor({ telefono })).not.toHaveLength(0);
    },
  );

  it('normalizes email and passport consistently with the web', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...validPayload,
      email: '  PACIENTE@SICSA.TEST  ',
      tipoDocumento: 'PASAPORTE',
      numeroDocumento: 'pa123456',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.email).toBe('paciente@sicsa.test');
    expect(dto.numeroDocumento).toBe('PA123456');
  });

  it.each(['correo-invalido', `${'a'.repeat(141)}@mail.test`])(
    'rejects invalid email %s',
    async (email) => {
      expect(await errorsFor({ email })).not.toHaveLength(0);
    },
  );

  it.each(['2000-02-29', '2020-12-31'])(
    'accepts valid civil birth date %s',
    async (fechaNacimiento) => {
      await expect(errorsFor({ fechaNacimiento })).resolves.toHaveLength(0);
    },
  );

  it.each(['2999-01-01', '1800-01-01', '2026-02-31', '31/12/2000'])(
    'rejects invalid civil birth date %s',
    async (fechaNacimiento) => {
      expect(await errorsFor({ fechaNacimiento })).not.toHaveLength(0);
    },
  );

  it('rejects the obsolete role property', async () => {
    expect(await errorsFor({ role: 'patient' })).not.toHaveLength(0);
  });
});
