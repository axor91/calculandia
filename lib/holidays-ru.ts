import { prisma } from './prisma';

// Документация isdayoff: https://isdayoff.ru/
// YYYY - весь год, ответ строка из 365/366 символов, '0' рабочий, '1' выходной/праздник

async function fetchYearFromIsDayOff(year: number): Promise<string | null> {
  try {
    const res = await fetch(`https://isdayoff.ru/api/getdata?year=${year}&cc=ru`);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.length < 365) return null;
    return text;
  } catch {
    return null;
  }
}

export async function ensureRuHolidaysYear(year: number): Promise<void> {
  const exists = await prisma.ruHoliday.count({ where: { year } });
  if (exists > 350) return; // уже загружен почти весь год

  const data = await fetchYearFromIsDayOff(year);
  if (!data) return; // фолбэк в логике расчёта

  // (#13, #45: замена N+1 запросов на batch-операцию)
  // Удаляем старые записи за год и вставляем все за один запрос
  const base = new Date(year, 0, 1);
  const items = [] as { date: Date; year: number; isWorking: boolean; source: string }[];
  for (let i = 0; i < data.length; i++) {
    const d = new Date(base);
    d.setDate(1 + i);
    items.push({ date: d, year, isWorking: data[i] === '0', source: 'isdayoff' });
  }

  // Транзакция: удалить + createMany вместо N отдельных upsert
  await prisma.$transaction([
    prisma.ruHoliday.deleteMany({ where: { year } }),
    prisma.ruHoliday.createMany({ data: items }),
  ]);
}

export async function isRuWorkingDay(date: Date): Promise<boolean | null> {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const rec = await prisma.ruHoliday.findUnique({ where: { date: day } });
  if (rec) return rec.isWorking;
  await ensureRuHolidaysYear(day.getFullYear());
  const rec2 = await prisma.ruHoliday.findUnique({ where: { date: day } });
  return rec2 ? rec2.isWorking : null;
}
