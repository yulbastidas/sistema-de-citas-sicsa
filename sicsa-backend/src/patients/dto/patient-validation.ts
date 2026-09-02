import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const DOCUMENT_TYPES = ['CC', 'TI', 'CE', 'RC', 'PASAPORTE'] as const;
export const GENDER_VALUES = [
  'Femenino',
  'Masculino',
  'Otro',
  'Prefiero no decirlo',
] as const;
export const NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;

const DOCUMENT_RULES: Record<string, { pattern: RegExp; message: string }> = {
  CC: {
    pattern: /^\d{3,10}$/,
    message: 'La cédula debe contener entre 3 y 10 dígitos',
  },
  TI: {
    pattern: /^\d{10,11}$/,
    message: 'La tarjeta de identidad debe contener entre 10 y 11 dígitos',
  },
  CE: {
    pattern: /^\d{4,10}$/,
    message: 'La cédula de extranjería debe contener entre 4 y 10 dígitos',
  },
  RC: {
    pattern: /^\d{10,11}$/,
    message: 'El registro civil debe contener entre 10 y 11 dígitos',
  },
  PASAPORTE: {
    pattern: /^[A-Z0-9]{5,20}$/,
    message: 'El pasaporte debe contener entre 5 y 20 letras o números',
  },
};

export function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function normalizeDocumentNumber(
  value: unknown,
  type: unknown,
): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return type === 'PASAPORTE' ? normalized.toUpperCase() : normalized;
}

@ValidatorConstraint({ name: 'isValidDocumentNumber', async: false })
export class IsValidDocumentNumberConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    const type = (args.object as { tipoDocumento?: string }).tipoDocumento;
    return Boolean(type && DOCUMENT_RULES[type]?.pattern.test(value));
  }

  defaultMessage(args: ValidationArguments): string {
    const type = (args.object as { tipoDocumento?: string }).tipoDocumento;
    return (
      (type && DOCUMENT_RULES[type]?.message) ||
      'El número de documento no es válido para el tipo seleccionado'
    );
  }
}

@ValidatorConstraint({ name: 'isCivilBirthDate', async: false })
export class IsCivilBirthDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() !== year ||
      candidate.getMonth() !== month - 1 ||
      candidate.getDate() !== day
    )
      return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oldestAllowedDate = new Date(today);
    oldestAllowedDate.setFullYear(today.getFullYear() - 120);
    return candidate <= today && candidate >= oldestAllowedDate;
  }

  defaultMessage(): string {
    return 'La fecha de nacimiento debe usar YYYY-MM-DD, ser real, no futura y no superar 120 años';
  }
}
