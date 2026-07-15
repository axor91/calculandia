"use client";

import { useState } from "react";
import NumericInput from "./NumericInput";
import {
  addFractions,
  subFractions,
  mulFractions,
  divFractions,
  fromMixed,
  toMixed,
  type Fraction,
} from "@/logic/fractions";

type Mode = "simple" | "mixed";
type Op = "add" | "sub" | "mul" | "div";

// Единый стиль инпутов (#33: убраны фиксированные w-16/w-24, адаптивная ширина)
const inputClass =
  "w-full px-3 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900";

export default function FractionsCalculator() {
  const [mode, setMode] = useState<Mode>("mixed");
  const [op, setOp] = useState<Op>("add");

  const [w1, setW1] = useState("");
  const [n1, setN1] = useState("");
  const [d1, setD1] = useState("");

  const [w2, setW2] = useState("");
  const [n2, setN2] = useState("");
  const [d2, setD2] = useState("");

  const parseVal = (s: string) => (s.trim() === "" ? NaN : parseFloat(s));

  const frac1: Fraction | null =
    mode === "mixed"
      ? fromMixed(parseVal(w1), parseVal(n1), parseVal(d1))
      : fromMixed(0, parseVal(n1), parseVal(d1));
  const frac2: Fraction | null =
    mode === "mixed"
      ? fromMixed(parseVal(w2), parseVal(n2), parseVal(d2))
      : fromMixed(0, parseVal(n2), parseVal(d2));

  let result: Fraction | null = null;
  if (frac1 && frac2) {
    if (op === "add") result = addFractions(frac1, frac2);
    if (op === "sub") result = subFractions(frac1, frac2);
    if (op === "mul") result = mulFractions(frac1, frac2);
    if (op === "div") result = divFractions(frac1, frac2);
  }
  const mixed = result ? toMixed(result) : null;

  return (
    <div className="space-y-8">
      {/* Вид дроби */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode("simple")}
          className={`text-left px-4 py-3 border-2 ${mode === "simple" ? "border-neutral-900 text-neutral-900 font-semibold" : "border-neutral-300 text-neutral-700"}`}
        >
          Простые дроби
        </button>
        <button
          onClick={() => setMode("mixed")}
          className={`text-left px-4 py-3 border-2 ${mode === "mixed" ? "border-neutral-900 text-neutral-900 font-semibold" : "border-neutral-300 text-neutral-700"}`}
        >
          Смешанные дроби
        </button>
      </div>

      {/* Ввод (#33: адаптивные ширины) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-semibold text-neutral-700 mb-2">
            Дробь 1
          </div>
          <div className="flex items-center gap-2">
            {mode === "mixed" && (
              <div className="w-20 sm:w-24 flex-shrink-0">
                <NumericInput
                  value={w1}
                  onChange={setW1}
                  className={inputClass}
                  placeholder="цел"
                  inputMode="decimal"
                />
              </div>
            )}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <NumericInput
                value={n1}
                onChange={setN1}
                className={inputClass}
                placeholder="числитель"
                inputMode="decimal"
              />
              <div className="w-full h-px bg-neutral-900" />
              <NumericInput
                value={d1}
                onChange={setD1}
                className={inputClass}
                placeholder="знаменатель"
                inputMode="decimal"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-neutral-700 mb-2">
            Дробь 2
          </div>
          <div className="flex items-center gap-2">
            {mode === "mixed" && (
              <div className="w-20 sm:w-24 flex-shrink-0">
                <NumericInput
                  value={w2}
                  onChange={setW2}
                  className={inputClass}
                  placeholder="цел"
                  inputMode="decimal"
                />
              </div>
            )}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <NumericInput
                value={n2}
                onChange={setN2}
                className={inputClass}
                placeholder="числитель"
                inputMode="decimal"
              />
              <div className="w-full h-px bg-neutral-900" />
              <NumericInput
                value={d2}
                onChange={setD2}
                className={inputClass}
                placeholder="знаменатель"
                inputMode="decimal"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Операция */}
      <div>
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          Операция
        </label>
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => setOp("add")}
            className={`px-4 py-3 border-2 text-lg ${op === "add" ? "border-neutral-900 text-neutral-900 font-semibold" : "border-neutral-300 text-neutral-700"}`}
          >
            +
          </button>
          <button
            onClick={() => setOp("sub")}
            className={`px-4 py-3 border-2 text-lg ${op === "sub" ? "border-neutral-900 text-neutral-900 font-semibold" : "border-neutral-300 text-neutral-700"}`}
          >
            −
          </button>
          <button
            onClick={() => setOp("mul")}
            className={`px-4 py-3 border-2 text-lg ${op === "mul" ? "border-neutral-900 text-neutral-900 font-semibold" : "border-neutral-300 text-neutral-700"}`}
          >
            ×
          </button>
          <button
            onClick={() => setOp("div")}
            className={`px-4 py-3 border-2 text-lg ${op === "div" ? "border-neutral-900 text-neutral-900 font-semibold" : "border-neutral-300 text-neutral-700"}`}
          >
            ÷
          </button>
        </div>
      </div>

      {/* Результат */}
      <div className="bg-neutral-50 p-6 border-2 border-neutral-300">
        <div className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
          Результат
        </div>
        <div className="text-4xl font-bold text-neutral-900 mt-1">
          {mixed ? (
            mixed.numerator === 0 ? (
              `${mixed.whole}`
            ) : mixed.whole !== 0 ? (
              `${mixed.whole} ${mixed.numerator}/${mixed.denominator}`
            ) : (
              `${mixed.numerator}/${mixed.denominator}`
            )
          ) : (
            <span className="text-neutral-300">—</span>
          )}
        </div>
      </div>

      {/* Подсказка */}
      <div className="text-xs text-neutral-500">
        Если дробь имеет вид «смешанной дроби», заполните поле целой части. Для
        простой дроби оставьте его пустым.
      </div>
    </div>
  );
}
