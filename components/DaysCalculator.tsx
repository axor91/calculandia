'use client';

import { useEffect, useMemo, useState } from 'react';
import { diffDates, parseDate, formatDateISO, addToDate } from '@/logic/days';
import NumericInput from './NumericInput';

export default function DaysCalculator() {
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [includeEnd, setIncludeEnd] = useState(false);
  const [useRuHolidays, setUseRuHolidays] = useState(true);

  const [baseDate, setBaseDate] = useState('');
  const [mode, setMode] = useState<'add' | 'sub'>('add');
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('0');

  // Избегаем несоответствия SSR/CSR: выставляем сегодняшнюю дату только на клиенте
  useEffect(() => {
    const todayISO = formatDateISO(new Date());
    setDate1(todayISO);
    setBaseDate(todayISO);
  }, []);

  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  const base = parseDate(baseDate);

  const diff = useMemo(() => {
    if (!d1 || !d2) return null;
    return diffDates(d1, d2, includeEnd, useRuHolidays);
  }, [date1, date2, includeEnd, useRuHolidays]);

  const adjusted = useMemo(() => {
    if (!base) return null;
    const y = parseInt(years || '0', 10) || 0;
    const m = parseInt(months || '0', 10) || 0;
    const d = parseInt(days || '0', 10) || 0;
    const sign = mode === 'add' ? 1 : -1;
    return addToDate(base, sign * y, sign * m, sign * d);
  }, [baseDate, mode, years, months, days]);

  const formatDateRu = (d?: Date | null) => (d ? d.toLocaleDateString('ru-RU') : '—');

  return (
    <div className="space-y-8">
      {/* Период между датами */}
      <div className="bg-white p-6 border-2 border-neutral-300 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4" suppressHydrationWarning>Период между датами</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Дата 1</label>
            <input type="date" value={date1} onChange={(e) => setDate1(e.target.value)} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Дата 2</label>
            <input type="date" value={date2} onChange={(e) => setDate2(e.target.value)} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeEnd} onChange={(e) => setIncludeEnd(e.target.checked)} />
            включая конечную дату
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useRuHolidays} onChange={(e) => setUseRuHolidays(e.target.checked)} />
            учитывать праздники РФ
          </label>
        </div>

        {diff && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-neutral-50 p-4">
              <div className="text-xs text-neutral-600">Дней</div>
              <div className="text-2xl font-bold">{diff.totalDays}</div>
            </div>
            <div className="bg-neutral-50 p-4">
              <div className="text-xs text-neutral-600">Рабочих дней</div>
              <div className="text-2xl font-bold">{diff.workingDays}</div>
            </div>
            <div className="bg-neutral-50 p-4">
              <div className="text-xs text-neutral-600">Недель</div>
              <div className="text-2xl font-bold">{diff.weeks.weeks}</div>
              <div className="text-xs text-neutral-600">+ {diff.weeks.days} дн</div>
            </div>
            <div className="bg-neutral-50 p-4">
              <div className="text-xs text-neutral-600">Месяцев</div>
              <div className="text-2xl font-bold">{diff.months.months}</div>
              <div className="text-xs text-neutral-600">+ {diff.months.days} дн</div>
            </div>
            <div className="bg-neutral-50 p-4 col-span-2 md:col-span-4">
              <div className="text-xs text-neutral-600">Годы/Месяцы/Дни</div>
              <div className="text-lg font-semibold">{diff.ymd.years} лет, {diff.ymd.months} мес., {diff.ymd.days} дн.</div>
            </div>
          </div>
        )}
      </div>

      {/* Прибавить/вычесть из даты */}
      <div className="bg-white p-6 border-2 border-neutral-300 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4" suppressHydrationWarning>Прибавить/вычесть из даты</h3>
        {/* Строка 1: базовая дата + выбор операции */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Базовая дата</label>
            <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={mode==='add'} onChange={() => setMode('add')} /> Прибавить</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={mode==='sub'} onChange={() => setMode('sub')} /> Вычесть</label>
          </div>
        </div>

        {/* Строка 2: величины изменения с понятными лейблами */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Годы</label>
            <NumericInput value={years} onChange={setYears} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="0" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Месяцы</label>
            <NumericInput value={months} onChange={setMonths} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="0" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Дни</label>
            <NumericInput value={days} onChange={setDays} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="0" inputMode="decimal" />
          </div>
        </div>

        {adjusted && (
          <div className="mt-4 text-sm text-neutral-700">
            Результат: <span className="font-semibold">{formatDateRu(adjusted)}</span>
            <div className="text-xs text-neutral-500 mt-1">
              Формула: {formatDateRu(base)} {mode === 'add' ? '+' : '−'} {parseInt(years||'0',10)||0} лет, {parseInt(months||'0',10)||0} мес., {parseInt(days||'0',10)||0} дн.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


