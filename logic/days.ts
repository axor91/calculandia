export type DateDiffResult = {
  totalDays: number;
  workingDays: number;
  weeks: { weeks: number; days: number };
  months: { months: number; days: number };
  ymd: { years: number; months: number; days: number };
};

function startOfDay(d: Date): Date {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

export function parseDate(input: string): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function isWorkingDay(d: Date): boolean {
  const day = d.getDay(); // 0 Sun ... 6 Sat
  return day !== 0 && day !== 6;
}

// --- Праздники РФ ---
const ruHolidaysCache = new Map<number, Set<string>>();

function toISO(d: Date): string {
  return formatDateISO(startOfDay(d));
}

function addHoliday(set: Set<string>, d: Date) {
  set.add(toISO(d));
}

function moveIfWeekend(d: Date, set: Set<string>) {
  // Если праздник выпадает на выходной, перенос на ближайший понедельник
  let moved = new Date(d);
  while (!isWorkingDay(moved)) {
    moved = addToDate(moved, 0, 0, 1);
  }
  addHoliday(set, moved);
}

function getRussiaHolidays(year: number): Set<string> {
  if (ruHolidaysCache.has(year)) return ruHolidaysCache.get(year)!;
  const set = new Set<string>();
  // Новогодние каникулы 1-8 января
  for (let i = 1; i <= 8; i++) addHoliday(set, new Date(year, 0, i));
  // 23 февраля, 8 марта, 1 мая, 9 мая, 12 июня, 4 ноября
  const fixed: Array<[number, number]> = [
    [2, 23],
    [3, 8],
    [5, 1],
    [5, 9],
    [6, 12],
    [11, 4],
  ];
  for (const [m, d] of fixed) {
    const date = new Date(year, m - 1, d);
    addHoliday(set, date);
    // перенос, если на выходной
    if (!isWorkingDay(date)) moveIfWeekend(date, set);
  }
  ruHolidaysCache.set(year, set);
  return set;
}

function isRuHoliday(d: Date): boolean {
  const y = d.getFullYear();
  const set = getRussiaHolidays(y);
  return set.has(toISO(d));
}

function isWorkingDayRU(d: Date): boolean {
  return isWorkingDay(d) && !isRuHoliday(d);
}

export function addToDate(base: Date, years = 0, months = 0, days = 0): Date {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + years);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() + days);
  return d;
}

function diffInDays(a: Date, b: Date, includeEnd: boolean): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const da = startOfDay(a).getTime();
  const db = startOfDay(b).getTime();
  const diff = Math.round((db - da) / msPerDay);
  return includeEnd ? diff + (diff >= 0 ? 1 : -1) : diff;
}

function diffWorkingDays(a: Date, b: Date, includeEnd: boolean, useRuHolidays: boolean): number {
  const step = a <= b ? 1 : -1;
  let current = startOfDay(a);
  let end = startOfDay(b);
  let count = 0;
  while (true) {
    if (includeEnd ? (step > 0 ? current > end : current < end) : current.getTime() === end.getTime()) break;
    if (includeEnd) {
      // include both ends
      if ((useRuHolidays ? isWorkingDayRU(current) : isWorkingDay(current))) count++;
      current = addToDate(current, 0, 0, step);
      if (step > 0 ? current > end : current < end) break;
    } else {
      // exclude end
      current = addToDate(current, 0, 0, step);
      if ((useRuHolidays ? isWorkingDayRU(current) : isWorkingDay(current))) count++;
      if (current.getTime() === end.getTime()) break;
    }
  }
  return Math.abs(count);
}

function diffMonthsAndDays(a: Date, b: Date, includeEnd: boolean): { months: number; days: number } {
  const dir = a <= b ? 1 : -1;
  let start = new Date(a);
  let months = 0;
  while (true) {
    const next = addToDate(start, 0, dir, 0);
    if (dir > 0 ? next > b : next < b) break;
    start = next;
    months += dir;
  }
  const days = diffInDays(start, b, includeEnd);
  return { months: Math.abs(months), days: Math.abs(days) };
}

function diffYMD(a: Date, b: Date, includeEnd: boolean): { years: number; months: number; days: number } {
  const dir = a <= b ? 1 : -1;
  let start = new Date(a);
  let years = 0;
  while (true) {
    const next = addToDate(start, dir, 0, 0);
    if (dir > 0 ? next > b : next < b) break;
    start = next;
    years += dir;
  }
  const md = diffMonthsAndDays(start, b, includeEnd);
  return { years: Math.abs(years), months: md.months, days: md.days };
}

export function diffDates(a: Date, b: Date, includeEnd: boolean, useRuHolidays = false): DateDiffResult {
  const totalDays = Math.abs(diffInDays(a, b, includeEnd));
  const workingDays = Math.abs(diffWorkingDays(a, b, includeEnd, useRuHolidays));
  const weeks = { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
  const md = diffMonthsAndDays(a, b, includeEnd);
  const ymd = diffYMD(a, b, includeEnd);
  return { totalDays, workingDays, weeks, months: md, ymd };
}

// Подсчёт рабочих дней при наличии набора НЕрабочих дат (ISO yyyy-mm-dd)
export function countWorkingDaysWithSet(a: Date, b: Date, includeEnd: boolean, nonWorkingISO: Set<string>): number {
  const step = a <= b ? 1 : -1;
  let current = startOfDay(a);
  const end = startOfDay(b);
  let count = 0;
  const isWorkingBySet = (d: Date) => isWorkingDay(d) && !nonWorkingISO.has(formatDateISO(d));
  while (true) {
    if (includeEnd ? (step > 0 ? current > end : current < end) : current.getTime() === end.getTime()) break;
    if (includeEnd) {
      if (isWorkingBySet(current)) count++;
      current = addToDate(current, 0, 0, step);
      if (step > 0 ? current > end : current < end) break;
    } else {
      current = addToDate(current, 0, 0, step);
      if (isWorkingBySet(current)) count++;
      if (current.getTime() === end.getTime()) break;
    }
  }
  return Math.abs(count);
}


