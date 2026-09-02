import { getDatabaseSynchronize } from './environment';

describe('DB_SYNCHRONIZE', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSynchronize = process.env.DB_SYNCHRONIZE;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalSynchronize === undefined) delete process.env.DB_SYNCHRONIZE;
    else process.env.DB_SYNCHRONIZE = originalSynchronize;
  });

  it('permite desactivarlo en desarrollo', () => {
    process.env.NODE_ENV = 'development';
    process.env.DB_SYNCHRONIZE = 'false';
    expect(getDatabaseSynchronize()).toBe(false);
  });

  it('lo mantiene desactivado por defecto en producción', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DB_SYNCHRONIZE;
    expect(getDatabaseSynchronize()).toBe(false);
  });

  it('impide activarlo en producción', () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_SYNCHRONIZE = 'true';
    expect(() => getDatabaseSynchronize()).toThrow(
      'DB_SYNCHRONIZE no puede ser true en producción',
    );
  });

  it('rechaza valores ambiguos', () => {
    process.env.NODE_ENV = 'development';
    process.env.DB_SYNCHRONIZE = 'yes';
    expect(() => getDatabaseSynchronize()).toThrow(
      'DB_SYNCHRONIZE debe ser true o false',
    );
  });
});
