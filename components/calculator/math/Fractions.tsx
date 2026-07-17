"use client";

import {
  calculateFractions,
  formatRational,
  type FractionOperation,
} from "@/calculations/math/fractions";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  ResultValue,
  SelectField,
  parseNumber,
  useShareableState,
} from "../shared";

type FractionState = {
  lw: string;
  ln: string;
  ld: string;
  rw: string;
  rn: string;
  rd: string;
  operation: string;
};
const fractionDefaults: FractionState = {
  lw: "1",
  ln: "1",
  ld: "2",
  rw: "2",
  rn: "1",
  rd: "3",
  operation: "add",
};

export function FractionsCalculator() {
  const controls = useShareableState("drobi", fractionDefaults, {
    operation: ["add", "subtract", "multiply", "divide"],
  });
  const values = [
    controls.state.lw,
    controls.state.ln,
    controls.state.ld,
    controls.state.rw,
    controls.state.rn,
    controls.state.rd,
  ].map((value) => parseNumber(value, { integer: true }));
  const valid = values.every((value) => value !== null);
  const parseError = values.some(
    (value, index) =>
      value === null &&
      [
        controls.state.lw,
        controls.state.ln,
        controls.state.ld,
        controls.state.rw,
        controls.state.rn,
        controls.state.rd,
      ][index].trim() !== "",
  );
  const result = valid
    ? calculateFractions(
        { whole: values[0]!, numerator: values[1]!, denominator: values[2]! },
        { whole: values[3]!, numerator: values[4]!, denominator: values[5]! },
        controls.state.operation as FractionOperation,
      )
    : null;

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <>
            <ResultValue
              primary
              label="Смешанная дробь"
              value={formatRational(result.value)}
            />
            <ResultValue
              label="Неправильная дробь"
              value={formatRational(result.value, false)}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok ? `Результат расчёта: ${formatRational(result.value)}` : null
      }
      error={
        parseError
          ? "Для дробей разрешены только безопасные целые числа."
          : result && !result.ok
            ? "Используйте целые числа и ненулевые знаменатели. Делить на нулевую дробь нельзя."
            : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-3">
        <legend className="px-2 text-sm font-extrabold text-ink">
          Первая дробь
        </legend>
        <Field
          label="Целая часть"
          value={controls.state.lw}
          onChange={(v) => controls.setField("lw", v)}
        />
        <Field
          label="Числитель"
          value={controls.state.ln}
          onChange={(v) => controls.setField("ln", v)}
        />
        <Field
          label="Знаменатель"
          value={controls.state.ld}
          onChange={(v) => controls.setField("ld", v)}
        />
      </fieldset>
      <div className="sm:col-span-2">
        <SelectField
          label="Действие"
          value={controls.state.operation}
          onChange={(v) => controls.setField("operation", v)}
          options={[
            { value: "add", label: "Сложить (+)" },
            { value: "subtract", label: "Вычесть (−)" },
            { value: "multiply", label: "Умножить (×)" },
            { value: "divide", label: "Разделить (÷)" },
          ]}
        />
      </div>
      <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-3">
        <legend className="px-2 text-sm font-extrabold text-ink">
          Вторая дробь
        </legend>
        <Field
          label="Целая часть"
          value={controls.state.rw}
          onChange={(v) => controls.setField("rw", v)}
        />
        <Field
          label="Числитель"
          value={controls.state.rn}
          onChange={(v) => controls.setField("rn", v)}
        />
        <Field
          label="Знаменатель"
          value={controls.state.rd}
          onChange={(v) => controls.setField("rd", v)}
        />
      </fieldset>
    </CalculatorFrame>
  );
}
