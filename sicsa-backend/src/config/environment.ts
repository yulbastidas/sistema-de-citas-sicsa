import * as dotenv from 'dotenv';

dotenv.config();

const JWT_DURATION_PATTERN = /^\d+(ms|s|m|h|d|w|y)$/;

function readIntegerEnvironmentValue(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const rawValue = readEnvironmentValue(name);
  const value = rawValue === undefined ? fallback : Number(rawValue);

  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} debe ser un entero entre ${minimum} y ${maximum}`);
  }

  return value;
}

function readEnvironmentValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function requireEnvironmentValue(name: string): string {
  const value = readEnvironmentValue(name);

  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria ${name}`);
  }

  return value;
}

export function getJwtSecret(): string {
  return requireEnvironmentValue('JWT_SECRET');
}

export function getJwtExpiresIn(): string {
  const expiresIn = readEnvironmentValue('JWT_EXPIRES_IN') ?? '1h';

  if (!JWT_DURATION_PATTERN.test(expiresIn)) {
    throw new Error('JWT_EXPIRES_IN debe usar un formato como 30m, 1h o 7d');
  }

  return expiresIn;
}

export function getCorsOrigins(): string[] {
  const configuredOrigins = requireEnvironmentValue('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length === 0) {
    throw new Error('CORS_ORIGINS debe contener al menos un origen');
  }

  if (configuredOrigins.includes('*')) {
    throw new Error('CORS_ORIGINS no permite el origen comodín *');
  }

  return configuredOrigins;
}

export function getAiServiceUrl(): string {
  return requireEnvironmentValue('AI_SERVICE_URL').replace(/\/$/, '');
}

export function getAiTimeoutMs(): number {
  const rawTimeout = readEnvironmentValue('AI_TIMEOUT_MS') ?? '3000';
  const timeout = Number(rawTimeout);

  if (!Number.isInteger(timeout) || timeout < 100 || timeout > 30000) {
    throw new Error('AI_TIMEOUT_MS debe ser un entero entre 100 y 30000');
  }

  return timeout;
}

export function getDatabaseSynchronize(): boolean {
  const rawValue = readEnvironmentValue('DB_SYNCHRONIZE');
  const synchronize =
    rawValue === undefined
      ? process.env.NODE_ENV !== 'production'
      : rawValue === 'true';

  if (rawValue !== undefined && rawValue !== 'true' && rawValue !== 'false') {
    throw new Error('DB_SYNCHRONIZE debe ser true o false');
  }

  if (process.env.NODE_ENV === 'production' && synchronize) {
    throw new Error('DB_SYNCHRONIZE no puede ser true en producción');
  }

  return synchronize;
}

export interface AuthRateLimitConfig {
  loginMaxAttempts: number;
  loginWindowMs: number;
  loginBlockMs: number;
  generalIpLimit: number;
  codeMaxAttempts: number;
  codeResendCooldownMs: number;
}

export function getAuthRateLimitConfig(): AuthRateLimitConfig {
  return {
    loginMaxAttempts: readIntegerEnvironmentValue(
      'AUTH_LOGIN_MAX_ATTEMPTS',
      5,
      2,
      20,
    ),
    loginWindowMs:
      readIntegerEnvironmentValue('AUTH_LOGIN_WINDOW_SECONDS', 900, 60, 86400) *
      1000,
    loginBlockMs:
      readIntegerEnvironmentValue('AUTH_LOGIN_BLOCK_SECONDS', 900, 30, 86400) *
      1000,
    generalIpLimit: readIntegerEnvironmentValue(
      'AUTH_GENERAL_IP_LIMIT',
      20,
      5,
      1000,
    ),
    codeMaxAttempts: readIntegerEnvironmentValue(
      'AUTH_CODE_MAX_ATTEMPTS',
      10,
      3,
      100,
    ),
    codeResendCooldownMs:
      readIntegerEnvironmentValue(
        'AUTH_CODE_RESEND_COOLDOWN_SECONDS',
        60,
        10,
        3600,
      ) * 1000,
  };
}

export function getOptionalEnvironmentUrl(name: string): string | undefined {
  const value = readEnvironmentValue(name);

  if (!value) return undefined;

  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`${name} debe contener una URL válida`);
  }
}

export interface OtpConfig {
  hmacSecret: string;
  expiresMs: number;
  maxAttempts: number;
  resendCooldownMs: number;
  hourlySendLimit: number;
  dailySendLimit: number;
}

export function getOtpConfig(): OtpConfig {
  return {
    hmacSecret: requireEnvironmentValue('OTP_HMAC_SECRET'),
    expiresMs:
      readIntegerEnvironmentValue('OTP_EXPIRES_SECONDS', 300, 60, 900) * 1000,
    maxAttempts: readIntegerEnvironmentValue('OTP_MAX_ATTEMPTS', 5, 2, 10),
    resendCooldownMs:
      readIntegerEnvironmentValue('OTP_RESEND_COOLDOWN_SECONDS', 60, 30, 600) *
      1000,
    hourlySendLimit: readIntegerEnvironmentValue(
      'OTP_MAX_SENDS_PER_HOUR',
      5,
      1,
      20,
    ),
    dailySendLimit: readIntegerEnvironmentValue(
      'OTP_MAX_SENDS_PER_DAY',
      10,
      1,
      50,
    ),
  };
}

export function validateEnvironment(): void {
  getJwtSecret();
  getJwtExpiresIn();
  getCorsOrigins();
  getAiServiceUrl();
  getAiTimeoutMs();
  getAuthRateLimitConfig();
  getDatabaseSynchronize();

  if (process.env.NODE_ENV === 'production') {
    const requiredProductionVariables = [
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
      'N8N_INTERNAL_TOKEN',
      'N8N_VERIFICATION_CODE_WEBHOOK_URL',
      'N8N_PASSWORD_RESET_WEBHOOK_URL',
      'MFA_ENCRYPTION_KEY',
      'OTP_HMAC_SECRET',
    ];

    requiredProductionVariables.forEach(requireEnvironmentValue);
  }
}
