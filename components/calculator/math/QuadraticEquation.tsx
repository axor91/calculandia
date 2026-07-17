"use client";

import { calculateQuadratic } from "@/calculations/math/quadratic";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  parseNumber,
  useShareableState,
} from "../shared";

type QuadraticState = { a: string; b: string; c: string };
const quadraticDefaults: QuadraticState = { a: "1", b: "-5", c: "6" };

export function QuadraticEquationCalculator() {
  const controls = useShareableState("kvadratnoe-uravnenie", quadraticDefaults);
  const a = parseNumber(controls.state.a);
  const b = parseNumber(controls.state.b);
  const c = parseNumber(controls.state.c);
  const result =
    a !== null && b !== null && c !== null ? calculateQuadratic(a, b, c) : null;
  const parseError =
    (controls.state.a.trim() !== "" && a === null) ||
    (controls.state.b.trim() !== "" && b === null) ||
    (controls.state.c.trim() !== "" && c === null);

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <>
            {result.value.kind === "two-real" ? (
              <>
                <ResultValue
                  primary
                  label="Корень x₁"
                  value={formatNumber(result.value.x1, 8)}
                />
                <ResultValue
                  label="Корень x₂"
                  value={formatNumber(result.value.x2, 8)}
                />
              </>
            ) : result.value.kind === "one-real" ? (
              <ResultValue
                primary
                label="Единственный корень"
                value={formatNumber(result.value.x, 8)}
              />
            ) : (
              <ResultValue
                primary
                label="Действительных корней нет"
                value={`${formatNumber(result.value.re, 8)} ± ${formatNumber(result.value.im, 8)}i`}
              />
            )}
            <ResultValue
              label="Дискриминант"
              value={formatNumber(result.value.discriminant, 8)}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? result.value.kind === "two-real"
            ? `Результат расчёта: корни ${formatNumber(result.value.x1, 8)} и ${formatNumber(result.value.x2, 8)}`
            : result.value.kind === "one-real"
              ? `Результат расчёта: единственный корень ${formatNumber(result.value.x, 8)}`
              : `Результат расчёта: действительных корней нет, комплексные корни ${formatNumber(result.value.re, 8)} плюс-минус ${formatNumber(result.value.im, 8)} i`
          : null
      }
      error={
        parseError
          ? "Введите обычные конечные числа без экспоненты; можно использовать точку или запятую."
          : result && !result.ok
            ? "Коэффициент a не может быть нулём — это линейное уравнение."
            : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <Field
        label="a"
        value={controls.state.a}
        onChange={(value) => controls.setField("a", value)}
      />
      <Field
        label="b"
        value={controls.state.b}
        onChange={(value) => controls.setField("b", value)}
      />
      <Field
        label="c"
        value={controls.state.c}
        onChange={(value) => controls.setField("c", value)}
      />
    </CalculatorFrame>
  );
}
