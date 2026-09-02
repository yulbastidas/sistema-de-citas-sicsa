import { FakeSmsProvider } from './fake-sms.provider';
import { InalambriaProvider } from './inalambria.provider';
import { N8nSmsProvider } from './n8n-sms.provider';
import { SmsProvider } from './sms-provider';
import { UnavailableSmsProvider } from './unavailable-sms.provider';

const DEFAULT_INALAMBRIA_BASE_URL = 'https://api.inalambria.express/v1';
const DEFAULT_SMS_TIMEOUT_MS = 5000;

export function createSmsProvider(
  env: NodeJS.ProcessEnv = process.env,
): SmsProvider {
  const mode = env.SMS_PROVIDER_MODE?.trim().toLowerCase();
  const isProduction = env.NODE_ENV === 'production';

  if (mode === 'fake') {
    if (isProduction) {
      throw new Error('SMS_PROVIDER_MODE=fake no esta permitido en produccion');
    }
    return new FakeSmsProvider();
  }

  if (mode === 'inalambria') {
    return new InalambriaProvider({
      apiKey: env.INALAMBRIA_API_KEY ?? '',
      baseUrl: env.INALAMBRIA_API_BASE_URL ?? DEFAULT_INALAMBRIA_BASE_URL,
      timeoutMs: parsePositiveInteger(
        env.SMS_TIMEOUT_MS,
        DEFAULT_SMS_TIMEOUT_MS,
      ),
    });
  }

  if (mode === 'n8n') {
    return new N8nSmsProvider({
      webhookUrl: env.N8N_SMS_WEBHOOK_URL ?? '',
      internalToken: env.N8N_INTERNAL_TOKEN ?? '',
      timeoutMs: parsePositiveInteger(
        env.SMS_TIMEOUT_MS,
        DEFAULT_SMS_TIMEOUT_MS,
      ),
    });
  }

  if (!mode) return new UnavailableSmsProvider();

  throw new Error(`SMS_PROVIDER_MODE no soportado: ${mode}`);
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === '') return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('SMS_TIMEOUT_MS debe ser un entero positivo');
  }
  return parsed;
}
