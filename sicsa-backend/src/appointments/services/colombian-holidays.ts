const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function nextMonday(date: Date): Date {
  const daysUntilMonday = (8 - date.getUTCDay()) % 7;
  return addDays(date, daysUntilMonday);
}

/** Algoritmo gregoriano de Meeus/Jones/Butcher. */
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return toDate(year, month, day);
}

export function getColombianNationalHolidays(year: number): Set<string> {
  const easter = getEasterSunday(year);
  const fixed = [
    [1, 1],
    [5, 1],
    [7, 20],
    [8, 7],
    [12, 8],
    [12, 25],
  ];
  const emiliani = [
    [1, 6],
    [3, 19],
    [6, 29],
    [8, 15],
    [10, 12],
    [11, 1],
    [11, 11],
  ];
  const dates = [
    ...fixed.map(([month, day]) => toDate(year, month, day)),
    ...emiliani.map(([month, day]) => nextMonday(toDate(year, month, day))),
    addDays(easter, -3), // Jueves Santo
    addDays(easter, -2), // Viernes Santo
    addDays(easter, 43), // Ascensión trasladada al lunes
    addDays(easter, 64), // Corpus Christi trasladado al lunes
    addDays(easter, 71), // Sagrado Corazón trasladado al lunes
  ];

  return new Set(dates.map(formatDate));
}

export function isColombianNationalHoliday(fecha: string): boolean {
  const year = Number(fecha.slice(0, 4));
  return (
    Number.isInteger(year) && getColombianNationalHolidays(year).has(fecha)
  );
}
