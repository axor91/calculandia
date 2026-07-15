"use client";

import {
  calculatePercentage,
  type PercentCalculation,
} from "@/calculations/math/percent-of-number";
import {
  calculateRelativePercentChange,
  calculateSymmetricPercentDifference,
} from "@/calculations/math/percent-change";
import {
  calculateFractions,
  formatRational,
  type FractionOperation,
} from "@/calculations/math/fractions";
import {
  solveProportion,
  type ProportionInput,
  type ProportionPosition,
} from "@/calculations/math/proportions";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatNumber,
  ResultValue,
  SelectField,
  parseNumber,
  useShareableState,
} from "./shared";

type PercentState = { mode: string; first: string; second: string };
const percentDefaults: PercentState = {
  mode: "percent-of-number",
  first: "15",
  second: "2400",
};

export function PercentOfNumberCalculator() {
  const controls = useShareableState("procent-ot-chisla", percentDefaults, {
    mode: ["percent-of-number", "part-as-percent", "whole-from-part"],
  });
  const first = parseNumber(controls.state.first);
  const second = parseNumber(controls.state.second);
  let input: PercentCalculation | null = null;
  if (first !== null && second !== null) {
    if (controls.state.mode === "percent-of-number") {
      input = { mode: "percent-of-number", percent: first, number: second };
    } else if (controls.state.mode === "part-as-percent") {
      input = { mode: "part-as-percent", part: first, whole: second };
    } else {
      input = { mode: "whole-from-part", part: first, percent: second };
    }
  }
  const result = input ? calculatePercentage(input) : null;
  const parseError =
    (controls.state.first.trim() !== "" && first === null) ||
    (controls.state.second.trim() !== "" && second === null);
  const substitution =
    input?.mode === "percent-of-number"
      ? `${formatNumber(input.number, 8)} × ${formatNumber(input.percent, 8)} / 100`
      : input?.mode === "part-as-percent"
        ? `${formatNumber(input.part, 8)} / ${formatNumber(input.whole, 8)} × 100`
        : input?.mode === "whole-from-part"
          ? `${formatNumber(input.part, 8)} × 100 / ${formatNumber(input.percent, 8)}`
          : null;
  const labels =
    controls.state.mode === "percent-of-number"
      ? ["Процент", "Число"]
      : controls.state.mode === "part-as-percent"
        ? ["Часть", "Целое"]
        : ["Часть", "Процент"];

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <>
            <ResultValue
              primary
              label={
                controls.state.mode === "part-as-percent"
                  ? "Доля в процентах"
                  : "Ответ"
              }
              value={`${formatNumber(result.value, 8)}${controls.state.mode === "part-as-percent" ? " %" : ""}`}
            />
            {substitution ? (
              <ResultValue label="Подстановка" value={substitution} />
            ) : null}
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? `Результат расчёта: ${formatNumber(result.value, 8)}${controls.state.mode === "part-as-percent" ? " процентов" : ""}`
          : null
      }
      error={
        parseError
          ? "Введите обычные конечные числа без экспоненты; можно использовать точку или запятую."
          : result && !result.ok
            ? "Проверьте делитель: он не может быть равен нулю."
            : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Что найти"
          value={controls.state.mode}
          onChange={(value) => controls.setField("mode", value)}
          options={[
            { value: "percent-of-number", label: "Процент от числа" },
            {
              value: "part-as-percent",
              label: "Сколько процентов составляет часть",
            },
            { value: "whole-from-part", label: "Целое по части и проценту" },
          ]}
        />
      </div>
      <Field
        label={labels[0]}
        value={controls.state.first}
        onChange={(value) => controls.setField("first", value)}
        unit={controls.state.mode === "percent-of-number" ? "%" : undefined}
      />
      <Field
        label={labels[1]}
        value={controls.state.second}
        onChange={(value) => controls.setField("second", value)}
        unit={controls.state.mode === "whole-from-part" ? "%" : undefined}
      />
    </CalculatorFrame>
  );
}

type ChangeState = { mode: string; old: string; next: string };
const changeDefaults: ChangeState = {
  mode: "relative",
  old: "800",
  next: "920",
};

export function PercentChangeCalculator() {
  const controls = useShareableState("procentnoe-izmenenie", changeDefaults, {
    mode: ["relative", "symmetric"],
  });
  const oldValue = parseNumber(controls.state.old);
  const newValue = parseNumber(controls.state.next);
  const result =
    oldValue === null || newValue === null
      ? null
      : controls.state.mode === "relative"
        ? calculateRelativePercentChange(oldValue, newValue)
        : calculateSymmetricPercentDifference(oldValue, newValue);
  const parseError =
    (controls.state.old.trim() !== "" && oldValue === null) ||
    (controls.state.next.trim() !== "" && newValue === null);
  const direction =
    result?.ok && controls.state.mode === "relative"
      ? result.value > 0
        ? "Рост"
        : result.value < 0
          ? "Снижение"
          : "Без изменения"
      : "Разница";

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <ResultValue
            primary
            label={direction}
            value={`${formatNumber(Math.abs(result.value), 6)} %`}
          />
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? `Результат расчёта: ${direction}, ${formatNumber(Math.abs(result.value), 6)} процентов`
          : null
      }
      error={
        parseError
          ? "Введите обычные конечные числа без экспоненты; можно использовать точку или запятую."
          : result && !result.ok
            ? "Для относительного изменения исходное значение должно быть больше нуля; значения не могут быть отрицательными."
            : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Метод"
          value={controls.state.mode}
          onChange={(value) => controls.setField("mode", value)}
          options={[
            { value: "relative", label: "Относительное изменение" },
            { value: "symmetric", label: "Симметричная разница" },
          ]}
        />
      </div>
      <Field
        label={controls.state.mode === "relative" ? "Было" : "Первое значение"}
        value={controls.state.old}
        onChange={(value) => controls.setField("old", value)}
      />
      <Field
        label={controls.state.mode === "relative" ? "Стало" : "Второе значение"}
        value={controls.state.next}
        onChange={(value) => controls.setField("next", value)}
      />
    </CalculatorFrame>
  );
}

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

type ProportionState = {
  unknown: string;
  a: string;
  b: string;
  c: string;
  d: string;
};
const proportionDefaults: ProportionState = {
  unknown: "d",
  a: "3",
  b: "5",
  c: "12",
  d: "",
};

export function ProportionCalculator() {
  const controls = useShareableState("proporcii", proportionDefaults, {
    unknown: ["a", "b", "c", "d"],
  });
  const unknown = controls.state.unknown as ProportionPosition;
  const known: Record<ProportionPosition, number | null> = {
    a: parseNumber(controls.state.a),
    b: parseNumber(controls.state.b),
    c: parseNumber(controls.state.c),
    d: parseNumber(controls.state.d),
  };
  let input: ProportionInput | null = null;
  const positions: ProportionPosition[] = ["a", "b", "c", "d"];
  if (
    positions
      .filter((position) => position !== unknown)
      .every((position) => known[position] !== null)
  ) {
    input = {
      unknown,
      ...Object.fromEntries(
        positions.filter((p) => p !== unknown).map((p) => [p, known[p]]),
      ),
    } as ProportionInput;
  }
  const result = input ? solveProportion(input) : null;
  const parseError = positions.some(
    (position) =>
      position !== unknown &&
      controls.state[position].trim() !== "" &&
      known[position] === null,
  );
  const check = result?.ok
    ? positions
        .map((position) =>
          formatNumber(
            position === unknown ? result.value.value : known[position]!,
            8,
          ),
        )
        .join(" / ")
        .replace(
          /^([^/]+) \/ ([^/]+) \/ ([^/]+) \/ ([^/]+)$/,
          "$1 / $2 = $3 / $4",
        )
    : null;

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <>
            <ResultValue
              primary
              label={`Неизвестное ${result.value.position.toUpperCase()}`}
              value={formatNumber(result.value.value, 8)}
            />
            {check ? (
              <ResultValue label="Проверка A / B = C / D" value={check} />
            ) : null}
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? `Результат расчёта: ${result.value.position.toUpperCase()} равно ${formatNumber(result.value.value, 8)}`
          : null
      }
      error={
        parseError
          ? "Введите обычные конечные числа без экспоненты; можно использовать точку или запятую."
          : result && !result.ok
            ? "Для этих значений пропорция не имеет единственного решения. Проверьте нули в делителях."
            : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Какое значение неизвестно в A / B = C / D"
          value={unknown}
          onChange={(value) => controls.setField("unknown", value)}
          options={positions.map((position) => ({
            value: position,
            label: position.toUpperCase(),
          }))}
        />
      </div>
      {positions.map((position) => (
        <Field
          key={position}
          label={position.toUpperCase()}
          value={position === unknown ? "" : controls.state[position]}
          onChange={(value) => controls.setField(position, value)}
          disabled={position === unknown}
          hint={position === unknown ? "Это значение будет найдено" : undefined}
        />
      ))}
    </CalculatorFrame>
  );
}
