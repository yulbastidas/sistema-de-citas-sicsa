const NATIONAL_MOBILE_PATTERN = /^3\d{9}$/;

export function normalizeColombianPhone(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('El celular colombiano debe ser texto');
  }

  const input = value.trim();
  let nationalNumber: string;

  if (NATIONAL_MOBILE_PATTERN.test(input)) {
    nationalNumber = input;
  } else if (/^57(3\d{9})$/.test(input)) {
    nationalNumber = input.slice(2);
  } else if (/^\+57(3\d{9})$/.test(input)) {
    nationalNumber = input.slice(3);
  } else {
    throw new Error(
      'Ingresa un celular colombiano válido de 10 dígitos que comience por 3',
    );
  }

  return `+57${nationalNumber}`;
}

export function maskPhone(value: unknown): string {
  const normalized = normalizeColombianPhone(value);
  return `******${normalized.slice(-4)}`;
}
