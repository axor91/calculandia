"use client";

import { useMemo } from "react";
import { calculateDiscount } from "@/calculations/finance";
import {
  CalculatorFrame,
  EmptyResult,
  Field,
  formatMoney,
  formatNumber,
  ResultValue,
  SelectField,
  useShareableState,
} from "../shared";
import { parseRequired, safeCalculate, type FinanceState } from "./helpers";

const discountDefaults: FinanceState = {
  mode: "price",
  price: "1000",
  discountPercent: "15",
  secondDiscountPercent: "0",
  oldPrice: "2500",
  newPrice: "2000",
};

export function DiscountCalculator() {
  const controls = useShareableState("skidka", discountDefaults, {
    mode: ["price", "compare"],
  });
  const calculation = useMemo(
    () =>
      safeCalculate(() => {
        if (controls.state.mode === "compare") {
          const values = parseRequired(controls.state, [
            "oldPrice",
            "newPrice",
          ]);
          if (!values) throw new Error();
          return calculateDiscount({
            mode: "compare",
            oldPrice: values.oldPrice,
            newPrice: values.newPrice,
          });
        }
        const values = parseRequired(controls.state, [
          "price",
          "discountPercent",
          "secondDiscountPercent",
        ]);
        if (!values) throw new Error();
        return calculateDiscount({
          mode: "price",
          price: values.price,
          discountPercent: values.discountPercent,
          secondDiscountPercent: values.secondDiscountPercent,
        });
      }),
    [controls.state],
  );
  const result = calculation.value;

  return (
    <CalculatorFrame
      result={
        result ? (
          result.mode === "price" ? (
            <>
              <ResultValue
                primary
                label="Итоговая цена"
                value={formatMoney(result.finalPrice)}
              />
              <ResultValue
                label="Экономия"
                value={formatMoney(result.savings)}
              />
              <ResultValue
                label="Суммарная скидка"
                value={`${formatNumber(result.effectiveDiscountPercent, 4)} %`}
              />
            </>
          ) : (
            <>
              <ResultValue
                primary
                label="Скидка"
                value={`${formatNumber(result.discountPercent, 4)} %`}
              />
              <ResultValue
                label="Экономия"
                value={formatMoney(result.savings)}
              />
            </>
          )
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result
          ? result.mode === "price"
            ? `Результат расчёта: итоговая цена ${formatMoney(result.finalPrice)}`
            : `Результат расчёта: скидка ${formatNumber(result.discountPercent, 4)} процентов`
          : null
      }
      error={
        calculation.error
          ? "Проверьте значения: цены — положительные числа, новая цена не больше старой, скидки — от 0 до 100%."
          : null
      }
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Что известно"
          value={controls.state.mode}
          onChange={(v) => controls.setField("mode", v)}
          options={[
            { value: "price", label: "Цена и процент скидки" },
            { value: "compare", label: "Старая и новая цена" },
          ]}
        />
      </div>
      {controls.state.mode === "price" ? (
        <>
          <Field
            label="Цена"
            value={controls.state.price}
            onChange={(v) => controls.setField("price", v)}
            unit="₽"
          />
          <Field
            label="Скидка"
            value={controls.state.discountPercent}
            onChange={(v) => controls.setField("discountPercent", v)}
            unit="%"
          />
          <Field
            label="Вторая скидка"
            value={controls.state.secondDiscountPercent}
            onChange={(v) => controls.setField("secondDiscountPercent", v)}
            unit="%"
            hint="Применяется последовательно к цене после первой скидки; по умолчанию 0"
          />
        </>
      ) : (
        <>
          <Field
            label="Старая цена"
            value={controls.state.oldPrice}
            onChange={(v) => controls.setField("oldPrice", v)}
            unit="₽"
          />
          <Field
            label="Новая цена"
            value={controls.state.newPrice}
            onChange={(v) => controls.setField("newPrice", v)}
            unit="₽"
          />
        </>
      )}
    </CalculatorFrame>
  );
}
