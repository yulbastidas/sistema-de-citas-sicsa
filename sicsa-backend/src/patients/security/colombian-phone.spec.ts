import { maskPhone, normalizeColombianPhone } from './colombian-phone';

describe('Colombian phone normalization', () => {
  it.each([
    ['3001234567', '+573001234567'],
    ['573001234567', '+573001234567'],
    ['+573001234567', '+573001234567'],
  ])('normalizes %s to E.164', (input, expected) => {
    expect(normalizeColombianPhone(input)).toBe(expected);
  });

  it.each(['2001234567', '300123456', '300ABC4567', ''])(
    'rejects invalid input %p',
    (input) => {
      expect(() => normalizeColombianPhone(input)).toThrow(
        'Ingresa un celular colombiano válido',
      );
    },
  );

  it('masks the complete number except for its last four digits', () => {
    expect(maskPhone('+573001234567')).toBe('******4567');
  });
});
