import {
  getColombianNationalHolidays,
  getEasterSunday,
  isColombianNationalHoliday,
} from './colombian-holidays';

describe('festivos nacionales de Colombia', () => {
  it('calcula correctamente el domingo de Pascua', () => {
    expect(getEasterSunday(2026).toISOString().slice(0, 10)).toBe('2026-04-05');
  });

  it.each(['2026-01-01', '2026-05-01', '2026-07-20', '2026-12-25'])(
    'incluye el festivo fijo %s',
    (fecha) => expect(isColombianNationalHoliday(fecha)).toBe(true),
  );

  it.each([
    '2026-04-02',
    '2026-04-03',
    '2026-05-18',
    '2026-06-08',
    '2026-06-15',
  ])('incluye el festivo móvil %s', (fecha) =>
    expect(isColombianNationalHoliday(fecha)).toBe(true),
  );

  it('traslada al lunes los festivos regulados por la Ley Emiliani', () => {
    const holidays = getColombianNationalHolidays(2026);
    expect(holidays.has('2026-01-12')).toBe(true);
    expect(holidays.has('2026-03-23')).toBe(true);
    expect(holidays.has('2026-11-16')).toBe(true);
  });

  it('no bloquea un día ordinario', () => {
    expect(isColombianNationalHoliday('2026-09-16')).toBe(false);
  });
});
