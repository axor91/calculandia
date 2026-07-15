"use client";

import React, { useMemo, useState } from 'react';
import NumericInput from './NumericInput';
import { calculateMortgage, calculateAnnuityDetails, calculateDifferentiatedDetails, type MortgageDetailedResult } from '../logic/mortgage';

type Mode = 'byPrice' | 'byLoan';
type PaymentType = 'annuity' | 'differentiated';

const inputClass = 'w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900';

function MortgageCalculator() {
  const [mode, setMode] = useState<Mode>('byPrice');
  const [paymentType, setPaymentType] = useState<PaymentType>('annuity');

  const [price, setPrice] = useState('');
  const [initialPayment, setInitialPayment] = useState('');
  const [loanAmountInput, setLoanAmountInput] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');

  const parseNum = (v: string) => parseFloat(v.replace(/\s+/g, ''));
  const formatInt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

  const loanAmount = useMemo(() => {
    if (mode === 'byLoan') return parseNum(loanAmountInput);
    const p = parseNum(price);
    const init = parseNum(initialPayment);
    if (!Number.isFinite(p) || !Number.isFinite(init)) return NaN;
    return p - init;
  }, [mode, loanAmountInput, price, initialPayment]);

  const details: MortgageDetailedResult | null = useMemo(() => {
    const r = parseNum(rate);
    const y = parseNum(years);
    if (!Number.isFinite(loanAmount) || !Number.isFinite(r) || !Number.isFinite(y)) return null;
    return paymentType === 'annuity'
      ? calculateAnnuityDetails(loanAmount, r, y)
      : calculateDifferentiatedDetails(loanAmount, r, y);
  }, [loanAmount, rate, years, paymentType]);

  const handleInput = (setter: (v: string) => void) => (value: string) => setter(value);

  return (
    <div className="space-y-8">
      {/* Переключатели режима и типа платежей — адаптивные (#30) */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <button className={`text-sm ${mode === 'byPrice' ? 'font-semibold border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-600'}`} onClick={() => setMode('byPrice')}>По стоимости</button>
          <button className={`text-sm ${mode === 'byLoan' ? 'font-semibold border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-600'}`} onClick={() => setMode('byLoan')}>По сумме кредита</button>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="radio" checked={paymentType === 'annuity'} onChange={() => setPaymentType('annuity')} /> Аннуитетные</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" checked={paymentType === 'differentiated'} onChange={() => setPaymentType('differentiated')} /> Дифференц.</label>
        </div>
      </div>

      {/* Входные поля */}
      <div className="space-y-6">
        {mode === 'byPrice' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Стоимость недвижимости</label>
              <NumericInput value={price} onChange={handleInput(setPrice)} className={inputClass} placeholder="5 000 000" inputMode="decimal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Первоначальный взнос</label>
              <NumericInput value={initialPayment} onChange={handleInput(setInitialPayment)} className={inputClass} placeholder="1 000 000" inputMode="decimal" />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Сумма кредита</label>
            <NumericInput value={loanAmountInput} onChange={handleInput(setLoanAmountInput)} className={inputClass} placeholder="2 000 000" inputMode="decimal" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Срок кредита, лет</label>
            <NumericInput value={years} onChange={handleInput(setYears)} className={inputClass} placeholder="20" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Ставка, % годовых</label>
            <NumericInput value={rate} onChange={handleInput(setRate)} className={inputClass} placeholder="12" inputMode="decimal" />
          </div>
        </div>
      </div>

      {/* Итоги */}
      {details ? (
        <div className="space-y-6">
          <div className="bg-neutral-50 p-6 border-2 border-neutral-300">
            <div className="text-sm font-medium text-neutral-700 mb-2">Ежемесячный платёж</div>
            <div className="text-4xl md:text-5xl font-bold text-neutral-900">{formatInt(details.monthlyPayment)} ₽</div>
            {paymentType === 'differentiated' && (
              <div className="text-xs text-neutral-600 mt-1">Первый платёж: {formatInt(details.firstPayment)} ₽, последний: {formatInt(details.lastPayment)} ₽</div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-5 border-2 border-neutral-300">
              <div className="text-xs text-neutral-600">Сумма кредита</div>
              <div className="text-2xl font-bold">{formatInt(details.loanAmount)} ₽</div>
            </div>
            <div className="bg-neutral-50 p-5 border-2 border-neutral-300">
              <div className="text-xs text-neutral-600">Переплата</div>
              <div className="text-2xl font-bold text-negative">{formatInt(details.overpayment)} ₽</div>
            </div>
          </div>

          <div className="bg-neutral-50 p-5 border-2 border-neutral-300">
            <div className="text-xs text-neutral-600">Общая сумма выплат</div>
            <div className="text-2xl font-bold">{formatInt(details.totalPayment)} ₽</div>
          </div>

          {/* График платежей (#31: адаптивная таблица) */}
          <div className="pt-6 mt-6 border-t-2 border-neutral-300">
            <div className="text-sm font-medium text-neutral-700 mb-3">График платежей</div>
            {/* Десктоп: 5 колонок */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-5 gap-2 text-xs text-neutral-600 mb-2 px-3">
                <div>Месяц</div><div>Платёж</div><div>Проценты</div><div>Долг</div><div>Остаток</div>
              </div>
              <div className="max-h-64 overflow-auto border-2 border-neutral-300 bg-white">
                {details.schedule.map((row) => (
                  <div key={row.month} className="grid grid-cols-5 gap-2 px-3 py-2 text-sm border-b border-neutral-200">
                    <div>{row.month}</div>
                    <div>{formatInt(row.payment)}</div>
                    <div>{formatInt(row.interest)}</div>
                    <div>{formatInt(row.principal)}</div>
                    <div>{formatInt(row.balance)}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Мобильная: карточки */}
            <div className="sm:hidden max-h-80 overflow-auto space-y-2">
              {details.schedule.slice(0, 24).map((row) => (
                <div key={row.month} className="bg-white border-2 border-neutral-300 p-3 text-sm">
                  <div className="font-semibold text-neutral-900 mb-1">Месяц {row.month}</div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-neutral-600">
                    <div>Платёж: <span className="text-neutral-900">{formatInt(row.payment)} ₽</span></div>
                    <div>Проценты: <span className="text-neutral-900">{formatInt(row.interest)} ₽</span></div>
                    <div>Основной: <span className="text-neutral-900">{formatInt(row.principal)} ₽</span></div>
                    <div>Остаток: <span className="text-neutral-900">{formatInt(row.balance)} ₽</span></div>
                  </div>
                </div>
              ))}
              {details.schedule.length > 24 && (
                <div className="text-xs text-neutral-500 text-center py-2">
                  Показаны первые 24 из {details.schedule.length} месяцев. Полный график доступен на десктопе.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-50 p-8 border-2 border-neutral-300 text-center">
          <div className="text-neutral-400 text-sm">Заполните поля для расчёта</div>
        </div>
      )}
    </div>
  );
}

export default MortgageCalculator;
