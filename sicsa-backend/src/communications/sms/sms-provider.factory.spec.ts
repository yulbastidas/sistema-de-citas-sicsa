import { FakeSmsProvider } from './fake-sms.provider';
import { InalambriaProvider } from './inalambria.provider';
import { N8nSmsProvider } from './n8n-sms.provider';
import { createSmsProvider } from './sms-provider.factory';
import { UnavailableSmsProvider } from './unavailable-sms.provider';

describe('createSmsProvider', () => {
  it('mantiene FakeSmsProvider en test', () => {
    expect(
      createSmsProvider({ NODE_ENV: 'test', SMS_PROVIDER_MODE: 'fake' }),
    ).toBeInstanceOf(FakeSmsProvider);
  });

  it('impide FakeSmsProvider en produccion', () => {
    expect(() =>
      createSmsProvider({ NODE_ENV: 'production', SMS_PROVIDER_MODE: 'fake' }),
    ).toThrow('no esta permitido en produccion');
  });

  it('crea InalambriaProvider cuando la configuracion esta completa', () => {
    expect(
      createSmsProvider({
        NODE_ENV: 'production',
        SMS_PROVIDER_MODE: 'inalambria',
        INALAMBRIA_API_KEY: 'test-key',
        SMS_TIMEOUT_MS: '3000',
      }),
    ).toBeInstanceOf(InalambriaProvider);
  });

  it('crea N8nSmsProvider para la ruta productiva recomendada', () => {
    expect(
      createSmsProvider({
        NODE_ENV: 'production',
        SMS_PROVIDER_MODE: 'n8n',
        N8N_SMS_WEBHOOK_URL: 'https://n8n.test/webhook/sicsa-sms',
        N8N_INTERNAL_TOKEN: 'internal-token',
      }),
    ).toBeInstanceOf(N8nSmsProvider);
  });

  it('rechaza n8n sin token interno', () => {
    expect(() =>
      createSmsProvider({
        NODE_ENV: 'production',
        SMS_PROVIDER_MODE: 'n8n',
        N8N_SMS_WEBHOOK_URL: 'https://n8n.test/webhook/sicsa-sms',
      }),
    ).toThrow('configuracion del proveedor SMS n8n esta incompleta');
  });

  it('falla claramente si falta la API key', () => {
    expect(() =>
      createSmsProvider({
        NODE_ENV: 'production',
        SMS_PROVIDER_MODE: 'inalambria',
      }),
    ).toThrow('configuracion del proveedor SMS Inalambria esta incompleta');
  });

  it('mantiene proveedor no disponible si no se selecciona modo', () => {
    expect(createSmsProvider({ NODE_ENV: 'development' })).toBeInstanceOf(
      UnavailableSmsProvider,
    );
  });
});
