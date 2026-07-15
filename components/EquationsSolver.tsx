'use client';

import React, { useMemo, useState } from 'react';
import { solveEquations, normalizeExpression } from '@/logic/equations';

type Var = { name: string; value: string };

const SYNTAX_HINT = `Синтаксис (поддерживаются синонимы):\n- Степени: x^a, a^x, корень: sqrt(x), x^(1/n)\n- Абсолют: |x| или abs(x)\n- Логифмы: Log[a, x], ln(x) => log(x), log(x, a)\n- Тригонометрия: sin(x), cos(x), tan(x), cot(x), sec(x), csc(x) и Arc*/гиперболические аналоги\n- Константы: Pi, E, Infinity (inf, oo)\n- Логика: &&, ||, ! (в уравнениях не используется)\nПримеры систем:\n  x^2 + y^2 = 1; x - y = 0\n  sin[x] + y = 1; x^2 - y = 0`;

export default function EquationsSolver() {
  const [equationsText, setEquationsText] = useState('x^2 + y^2 = 1; x - y = 0');
  const [variablesText, setVariablesText] = useState('x, y');
  const [initialText, setInitialText] = useState('x=0.5, y=0.5');
  const [showNormalized, setShowNormalized] = useState(false);

  const variables = useMemo(() => variablesText.split(',').map(s => s.trim()).filter(Boolean), [variablesText]);
  const equations = useMemo(() => equationsText.split(/;|\n/).map(s => s.trim()).filter(Boolean), [equationsText]);
  const initialGuess = useMemo(() => {
    const map: Record<string, number> = {};
    initialText.split(',').forEach(pair => {
      const [k, v] = pair.split('=').map(s => s.trim());
      if (k && v && !isNaN(Number(v))) map[k] = Number(v);
    });
    return map;
  }, [initialText]);

  const normalized = useMemo(() => equations.map(normalizeExpression).join('; '), [equations]);

  const result = useMemo(() => {
    if (equations.length === 0 || variables.length === 0) return null;
    return solveEquations(equations, variables, initialGuess, { restarts: 5, maxIterations: 80 });
  }, [equations, variables, initialGuess]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 border-2 border-neutral-300 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Система уравнений</label>
            <textarea value={equationsText} onChange={(e) => setEquationsText(e.target.value)} className="w-full h-32 px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" />
            <div className="text-xs text-neutral-500 mt-2 whitespace-pre-wrap">{SYNTAX_HINT}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Переменные (через запятую)</label>
            <input type="text" value={variablesText} onChange={(e) => setVariablesText(e.target.value)} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="x, y" />
            <label className="block text-sm font-medium text-neutral-700 mb-2 mt-4">Начальные приближения</label>
            <input type="text" value={initialText} onChange={(e) => setInitialText(e.target.value)} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="x=0.1, y=0.1" />
            <label className="flex items-center gap-2 text-sm mt-3">
              <input type="checkbox" checked={showNormalized} onChange={(e) => setShowNormalized(e.target.checked)} />
              показать нормализованные выражения
            </label>
            {showNormalized && (
              <div className="text-xs text-neutral-600 mt-2">{normalized}</div>
            )}
          </div>
        </div>
      </div>

      {/* Результат */}
      <div className="bg-white p-6 border-2 border-neutral-300 shadow-sm">
        <div className="text-sm font-medium text-neutral-700 mb-2">Результат</div>
        {!result && <div className="text-neutral-400 text-sm">Заполните данные</div>}
        {result && (
          <div className="space-y-4">
            <div className="text-sm text-neutral-600">Сходимость: {result.converged ? 'да' : 'нет'}; остаток: {result.residual.toExponential(3)}; итераций: {result.iterations}</div>
            {result.message && <div className="text-xs text-negative">{result.message}</div>}
            {result.solutions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.solutions.map((sol, idx) => (
                  <div key={idx} className="bg-neutral-50 p-4 border-2 border-neutral-300">
                    <div className="text-xs text-neutral-600 mb-1">Решение #{idx + 1}</div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {Object.entries(sol).map(([k, v]) => (
                        <div key={k}>{k} = {Number(v).toPrecision(10)}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-neutral-600 text-sm">Решения не найдены.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


