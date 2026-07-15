// (#43): Selective import невозможен, т.к. используются compile, derivative, lusolve
// которые тянут всё дерево зависимостей. create(all) — вынужденная мера.
import { create, all } from 'mathjs';

const math = create(all, {});

export type SolveOptions = {
  maxIterations?: number;
  tolerance?: number;
  restarts?: number; // кол-во случайных перезапусков, если нет сходимости
  useSymbolicJacobian?: boolean;
};

export type SolveResult = {
  solutions: Array<Record<string, number>>;
  residual: number;
  iterations: number;
  converged: boolean;
  message?: string;
};

// Преобразование синтаксиса к mathjs
export function normalizeExpression(input: string): string {
  let s = input.trim();
  if (!s) return s;
  // Заменяем [ ] на ( ) для функций вида Cos[x]
  s = s.replace(/([A-Za-z]+)\[/g, '$1(').replace(/\]/g, ')');
  // Синонимы функций и констант
  const replacements: Array<[RegExp, string]> = [
    [/\bPi\b|π/gi, 'pi'],
    [/\bE\b/gi, 'e'],
    [/\bInfinity\b|\binf\b|\boo\b/gi, 'Infinity'],
    [/\bLn\b\s*\(/gi, 'log('],
    [/\bln\b\s*\(/g, 'log('],
    [/\bSin\b/gi, 'sin'],
    [/\bCos\b/gi, 'cos'],
    [/\bTan\b|\btg\b/gi, 'tan'],
    [/\bCot\b|\bctg\b/gi, 'cot'],
    [/\bSec\b/gi, 'sec'],
    [/\bCsc\b|\bcosec\b/gi, 'csc'],
    [/\bArcSin\b|\barcsin\b/gi, 'asin'],
    [/\bArcCos\b|\barccos\b/gi, 'acos'],
    [/\bArcTan\b|\barctg\b/gi, 'atan'],
    [/\bArcCot\b|\barcctg\b/gi, 'acot'],
    [/\bArcSec\b|\barcsec\b/gi, 'asec'],
    [/\bArcCsc\b|\barccosec\b/gi, 'acsc'],
    [/\bCosh\b|\bch\b/gi, 'cosh'],
    [/\bSinh\b|\bsh\b/gi, 'sinh'],
    [/\bTanh\b|\bth\b/gi, 'tanh'],
    [/\bCoth\b|\bcth\b/gi, 'coth'],
    [/\bSech\b/gi, 'sech'],
    [/\bCsch\b|\bcosech\b/gi, 'csch'],
    [/\bArcCosh\b|\bareach\b/gi, 'acosh'],
    [/\bArcSinh\b|\bareash\b/gi, 'asinh'],
    [/\bArcTanh\b|\bareath\b/gi, 'atanh'],
    [/\bArcCoth\b|\bareacth\b/gi, 'acoth'],
    [/\bArcSech\b|\bareasech\b/gi, 'asech'],
    [/\bArcCsch\b|\bareacosech\b/gi, 'acsch'],
    [/\bAbs\b/gi, 'abs'],
  ];
  for (const [re, to] of replacements) s = s.replace(re, to);

  // Поддержка Log[a, x] => log(x, a)
  s = s.replace(/\bLog\s*\(([^,]+),\s*([^\)]+)\)/gi, 'log($2, $1)');
  s = s.replace(/\bLog\s*\[([^,]+),\s*([^\]]+)\]/gi, 'log($2, $1)');

  // |x| → abs(x) (простая, без вложенных |)
  s = s.replace(/\|([^|]+)\|/g, 'abs($1)');

  return s;
}

export function equationToZero(expr: string): string {
  const s = normalizeExpression(expr);
  const parts = s.split('=');
  if (parts.length === 1) return s; // уже вида f(x)=0
  const lhs = parts[0];
  const rhs = parts.slice(1).join('=');
  return `(${lhs})-(${rhs})`;
}

function buildFunctions(equations: string[], variables: string[]) {
  const compiled = equations.map((eq) => math.compile(equationToZero(eq)));
  const jacobian: any[][] = [];
  for (let i = 0; i < equations.length; i++) {
    const row: any[] = [];
    for (let j = 0; j < variables.length; j++) {
      const d = math.derivative(equationToZero(equations[i]), variables[j]);
      row.push(d.compile());
    }
    jacobian.push(row);
  }
  return { compiled, jacobian } as const;
}

function evaluateVector(compiled: any[], scope: Record<string, number>): number[] {
  return compiled.map((c) => Number(c.evaluate(scope)));
}

function evaluateJacobian(jac: any[][], scope: Record<string, number>): number[][] {
  return jac.map((row) => row.map((c) => Number(c.evaluate(scope))));
}

function norm2(v: number[]): number {
  return Math.sqrt(v.reduce((acc, x) => acc + x * x, 0));
}

function solveLinear(A: number[][], b: number[]): number[] {
  // Используем mathjs lusolve
  const x = math.lusolve(A as any, b.map((x) => [x]) as any) as unknown as number[][];
  return x.map((row) => row[0]);
}

export function solveEquations(
  equations: string[],
  variables: string[],
  initialGuess?: Partial<Record<string, number>>,
  options: SolveOptions = {},
): SolveResult {
  const maxIterations = options.maxIterations ?? 50;
  const tolerance = options.tolerance ?? 1e-8;
  const restarts = Math.max(1, options.restarts ?? 3);

  if (equations.length === 0 || variables.length === 0) {
    return { solutions: [], residual: NaN, iterations: 0, converged: false, message: 'Не заданы уравнения или переменные' };
  }
  const { compiled, jacobian } = buildFunctions(equations, variables);

  const trySolve = (seed: Record<string, number>) => {
    let scope: Record<string, number> = { ...seed };
    for (const v of variables) if (!Number.isFinite(scope[v])) scope[v] = 1;

    let it = 0;
    while (it < maxIterations) {
      const F = evaluateVector(compiled, scope);
      const r = norm2(F);
      if (r < tolerance) return { scope, iterations: it, residual: r, converged: true } as const;
      const J = evaluateJacobian(jacobian, scope);
      const dx = solveLinear(J, F.map((x) => -x));

      // Линейный поиск
      let alpha = 1;
      let improved = false;
      for (let k = 0; k < 10; k++) {
        const trial: Record<string, number> = { ...scope };
        variables.forEach((v, i) => (trial[v] = trial[v] + alpha * dx[i]));
        const Fr = evaluateVector(compiled, trial);
        if (norm2(Fr) < r) {
          scope = trial;
          improved = true;
          break;
        }
        alpha *= 0.5;
      }
      if (!improved) {
        // шаг не улучшил — остановка
        break;
      }
      it++;
    }
    const F = evaluateVector(compiled, scope);
    return { scope, iterations: it, residual: norm2(F), converged: false } as const;
  };

  const solutions: Array<Record<string, number>> = [];
  let bestResidual = Infinity;
  let bestIterations = 0;
  let converged = false;

  for (let attempt = 0; attempt < restarts; attempt++) {
    const seed: Record<string, number> = { ...initialGuess } as Record<string, number>;
    // случайный старт
    for (const v of variables) if (!Number.isFinite(seed[v])) seed[v] = (Math.random() - 0.5) * 10;
    const res = trySolve(seed);
    bestResidual = Math.min(bestResidual, res.residual);
    bestIterations = res.iterations;
    if (res.converged && res.residual < tolerance) {
      converged = true;
      // Проверка уникальности решения
      // (#53: удалена неиспользуемая переменная unique — дедупликация ниже через !solutions.some)
      // simple uniqueness via residual/coordinates tolerance
      if (!solutions.some((s) => variables.every((v) => Math.abs((s[v] ?? 0) - res.scope[v]) < 1e-6))) {
        solutions.push(variables.reduce((acc, v) => ((acc[v] = res.scope[v]), acc), {} as Record<string, number>));
      }
    }
  }

  // Если ничего не сошлось — вернуть лучшее приближение
  if (solutions.length === 0) {
    return { solutions: [], residual: bestResidual, iterations: bestIterations, converged: false, message: 'Не удалось достичь сходимости. Попробуйте другие стартовые значения.' };
  }

  return { solutions, residual: bestResidual, iterations: bestIterations, converged: true };
}


