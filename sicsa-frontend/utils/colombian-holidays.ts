const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day));
const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);
const formatDate = (date: Date) => date.toISOString().slice(0, 10);
const nextMonday = (date: Date) => addDays(date, (8 - date.getUTCDay()) % 7);

function getEasterSunday(year: number): Date {
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
  const fixed = [[1, 1], [5, 1], [7, 20], [8, 7], [12, 8], [12, 25]];
  const emiliani = [[1, 6], [3, 19], [6, 29], [8, 15], [10, 12], [11, 1], [11, 11]];
  const dates = [
    ...fixed.map(([month, day]) => toDate(year, month, day)),
    ...emiliani.map(([month, day]) => nextMonday(toDate(year, month, day))),
    addDays(easter, -3),
    addDays(easter, -2),
    addDays(easter, 43),
    addDays(easter, 64),
    addDays(easter, 71),
  ];
  return new Set(dates.map(formatDate));
}

export function isColombianNationalHoliday(fecha: string): boolean {
  const year = Number(fecha.slice(0, 4));
  return Number.isInteger(year) && getColombianNationalHolidays(year).has(fecha);
}

export function getAppointmentDateRestriction(fecha: string): string | null {
  const [year, month, day] = fecha.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (!fecha || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "Selecciona una fecha válida";
  }
  if (date.getDay() === 0 || date.getDay() === 1) {
    return "Los domingos y lunes no hay atención";
  }
  if (isColombianNationalHoliday(fecha)) {
    return "No hay atención en festivos nacionales de Colombia";
  }
  return null;
}
