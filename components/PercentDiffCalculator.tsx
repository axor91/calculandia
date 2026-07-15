'use client';

import React, { useState } from 'react';
import NumericInput from './NumericInput';
import { calculatePercentDifference, calculatePercentDifferenceAverage, calculatePercentRatio } from '../logic/percentDiff';

type CalculationMethod = 'change' | 'average' | 'ratio';

// Единый стиль инпутов — дизайн-система (#16: убраны rounded-lg, ring-primary-500)
const inputClass = 'w-full px-4 py-3.5 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900';

function PercentDiffCalculator() {
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [method, setMethod] = useState<CalculationMethod>('change');

  const n1 = parseFloat(num1);
  const n2 = parseFloat(num2);

  const results = {
    change: calculatePercentDifference(n1, n2),
    average: calculatePercentDifferenceAverage(n1, n2),
    ratio: calculatePercentRatio(n1, n2),
  };

  const result = results[method];

  return (
    <div className="space-y-8">
      {/* Метод расчёта */}
      <div>
        <label className="block text-sm font-semibold text-neutral-700 mb-3">
          Метод расчёта
        </label>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setMethod('change')}
            className={`text-left px-4 py-3 border-2 ${method === 'change'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-neutral-300 text-neutral-700'
              }`}
          >
            <div className="font-semibold">Процентное изменение</div>
            <div className="text-xs mt-1">На сколько % изменилось от первого числа</div>
          </button>

          <button
            onClick={() => setMethod('average')}
            className={`text-left px-4 py-3 border-2 ${method === 'average'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-neutral-300 text-neutral-700'
              }`}
          >
            <div className="font-semibold">Разница от среднего</div>
            <div className="text-xs mt-1">Симметричная разница (без базового значения)</div>
          </button>

          <button
            onClick={() => setMethod('ratio')}
            className={`text-left px-4 py-3 border-2 ${method === 'ratio'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-neutral-300 text-neutral-700'
              }`}
          >
            <div className="font-semibold">Процентное соотношение</div>
            <div className="text-xs mt-1">Насколько одно число больше/меньше другого</div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Первое число
          </label>
          <NumericInput
            value={num1}
            onChange={setNum1}
            className={inputClass}
            placeholder="Введите число"
            allowNegative
            inputMode="decimal"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Второе число
          </label>
          <NumericInput
            value={num2}
            onChange={setNum2}
            className={inputClass}
            placeholder="Введите число"
            allowNegative
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="bg-neutral-50 p-6 space-y-3 border-2 border-neutral-300">
        <div className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
          Результат
        </div>
        <div className={`text-5xl font-bold ${result !== null && (result > 0 ? 'text-positive' : result < 0 ? 'text-negative' : 'text-neutral-900')}`}>
          {result !== null ? (
            <>
              {result > 0 && '+'}
              {result.toFixed(2)}%
            </>
          ) : (
            <span className="text-neutral-300">—</span>
          )}
        </div>
        {result !== null && (
          <div className="text-base text-neutral-600 font-medium">
            {result > 0 ? '↑ Увеличение' : result < 0 ? '↓ Уменьшение' : '= Без изменений'}
          </div>
        )}
      </div>

      <div className="bg-neutral-50 p-4 border-2 border-neutral-300">
        <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
          Формула
        </div>
        <p className="text-sm text-neutral-700 font-mono">
          {method === 'change' && '((Число 2 − Число 1) / Число 1) × 100%'}
          {method === 'average' && '|Число 1 − Число 2| / ((Число 1 + Число 2) / 2) × 100%'}
          {method === 'ratio' && '(Большее − Меньшее) / Меньшее × 100%'}
        </p>
      </div>
    </div>
  );
}

export default PercentDiffCalculator;
