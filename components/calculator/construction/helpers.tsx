import { type Length, type Opening } from "@/calculations/construction";
import { parseNumber } from "../shared";

export type BuildingState = Record<string, string>;

export function fieldsComplete(state: BuildingState, keys: readonly string[]) {
  return keys.every((key) => state[key]?.trim() !== "");
}

export function length(value: string, unit: Length["unit"]): Length | null {
  const parsed = parseNumber(value);
  return parsed === null ? null : { value: parsed, unit };
}

export function optionalOpening(
  width: string,
  height: string,
  count: string,
): Opening[] | null {
  if (!width.trim() && !height.trim()) return [];
  const parsedWidth = length(width, "m");
  const parsedHeight = length(height, "m");
  const parsedCount = parseNumber(count, { integer: true });
  return parsedWidth && parsedHeight && parsedCount !== null
    ? [{ width: parsedWidth, height: parsedHeight, count: parsedCount }]
    : null;
}
