"use client";

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
} from "../shared";

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
