"use client";

import { calculateGcdLcm } from "@/calculations/math/gcd-lcm";
import {
  CalculatorFrame,
  EmptyResult,
  formatNumber,
  ResultValue,
  useShareableState,
} from "../shared";
import { ListField, parseNumberList } from "./helpers";

type GcdLcmState = { values: string };
const gcdLcmDefaults: GcdLcmState = { values: "48, 180, 36" };

export function GcdLcmCalculator() {
  const controls = useShareableState("nod-nok", gcdLcmDefaults);
  const values = parseNumberList(controls.state.values, { integer: true });
  const result = values ? calculateGcdLcm(values) : null;
  const parseError = controls.state.values.trim() !== "" && values === null;

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <>
            <ResultValue
              primary
              label="НОД"
              value={formatNumber(result.value.gcd, 0)}
            />
            <ResultValue
              label="НОК"
              value={formatNumber(result.value.lcm, 0)}
            />
          </>
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? `Результат расчёта: НОД ${formatNumber(result.value.gcd, 0)}, НОК ${formatNumber(result.value.lcm, 0)}`
          : null
      }
      error={
        parseError
          ? "Введите от 2 до 10 целых чисел через запятую, пробел или с новой строки."
          : result && !result.ok
            ? result.error.code === "overflow"
              ? "НОК слишком велик для точного вычисления."
              : "Нужно от 2 до 10 целых положительных чисел, каждое не больше 10^15."
            : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <ListField
          label="Целые числа"
          value={controls.state.values}
          onChange={(value) => controls.setField("values", value)}
          hint="От 2 до 10 положительных целых чисел, каждое не больше 10^15."
        />
      </div>
    </CalculatorFrame>
  );
}
