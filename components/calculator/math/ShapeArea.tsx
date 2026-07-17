"use client";

import {
  calculateCircleArea,
  calculateRectangleArea,
  calculateTrapezoidArea,
  calculateTriangleBaseHeightArea,
  calculateTriangleSidesArea,
} from "@/calculations/math/shape-area";
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

type ShapeAreaState = {
  shape: string;
  a: string;
  b: string;
  c: string;
  height: string;
  radius: string;
};
const shapeAreaDefaults: ShapeAreaState = {
  shape: "rectangle",
  a: "3",
  b: "4",
  c: "5",
  height: "4",
  radius: "1",
};

const shapeFieldConfig: Record<
  string,
  readonly {
    key: "a" | "b" | "c" | "height" | "radius";
    label: string;
  }[]
> = {
  rectangle: [
    { key: "a", label: "Сторона a" },
    { key: "b", label: "Сторона b" },
  ],
  "triangle-base-height": [
    { key: "a", label: "Основание" },
    { key: "height", label: "Высота" },
  ],
  "triangle-sides": [
    { key: "a", label: "Сторона a" },
    { key: "b", label: "Сторона b" },
    { key: "c", label: "Сторона c" },
  ],
  circle: [{ key: "radius", label: "Радиус" }],
  trapezoid: [
    { key: "a", label: "Основание a" },
    { key: "b", label: "Основание b" },
    { key: "height", label: "Высота" },
  ],
};

export function ShapeAreaCalculator() {
  const controls = useShareableState("ploshchad-figur", shapeAreaDefaults, {
    shape: [
      "rectangle",
      "triangle-base-height",
      "triangle-sides",
      "circle",
      "trapezoid",
    ],
  });
  const shape = controls.state.shape;
  const fields = shapeFieldConfig[shape] ?? shapeFieldConfig.rectangle!;
  const parsed = Object.fromEntries(
    fields.map((field) => [field.key, parseNumber(controls.state[field.key])]),
  ) as Partial<Record<"a" | "b" | "c" | "height" | "radius", number | null>>;
  const parseError = fields.some(
    (field) =>
      controls.state[field.key].trim() !== "" && parsed[field.key] === null,
  );
  const allFilled = fields.every((field) => parsed[field.key] !== null);

  let result: ReturnType<typeof calculateRectangleArea> | null = null;
  if (allFilled) {
    if (shape === "rectangle") {
      result = calculateRectangleArea(parsed.a!, parsed.b!);
    } else if (shape === "triangle-base-height") {
      result = calculateTriangleBaseHeightArea(parsed.a!, parsed.height!);
    } else if (shape === "triangle-sides") {
      result = calculateTriangleSidesArea(parsed.a!, parsed.b!, parsed.c!);
    } else if (shape === "circle") {
      result = calculateCircleArea(parsed.radius!);
    } else if (shape === "trapezoid") {
      result = calculateTrapezoidArea(parsed.a!, parsed.b!, parsed.height!);
    }
  }

  return (
    <CalculatorFrame
      result={
        result?.ok ? (
          <ResultValue
            primary
            label="Площадь"
            value={formatNumber(result.value, 6)}
          />
        ) : (
          <EmptyResult />
        )
      }
      resultAnnouncement={
        result?.ok
          ? `Результат расчёта: площадь ${formatNumber(result.value, 6)}`
          : null
      }
      error={
        parseError
          ? "Введите обычные конечные числа без экспоненты; можно использовать точку или запятую."
          : result && !result.ok
            ? shape === "triangle-sides"
              ? "Стороны должны быть положительными и удовлетворять неравенству треугольника: сумма двух сторон больше третьей."
              : "Все размеры должны быть положительными конечными числами."
            : null
      }
      notice="Результат — в квадрате той же единицы, в которой заданы размеры (например, размеры в метрах — площадь в м²)."
      onReset={controls.reset}
      onShare={controls.copyLink}
      shareStatus={controls.shareStatus}
    >
      <div className="sm:col-span-2">
        <SelectField
          label="Фигура"
          value={shape}
          onChange={(value) => controls.setField("shape", value)}
          options={[
            { value: "rectangle", label: "Прямоугольник" },
            {
              value: "triangle-base-height",
              label: "Треугольник (основание и высота)",
            },
            { value: "triangle-sides", label: "Треугольник (три стороны)" },
            { value: "circle", label: "Круг" },
            { value: "trapezoid", label: "Трапеция" },
          ]}
        />
      </div>
      {fields.map((field) => (
        <Field
          key={field.key}
          label={field.label}
          value={controls.state[field.key]}
          onChange={(value) => controls.setField(field.key, value)}
        />
      ))}
    </CalculatorFrame>
  );
}
