import {
  isConstructionCount,
  lengthToMetres,
  MAX_CALCULATED_QUANTITY,
  MAX_OPENING_ROWS,
  type Length,
} from "./units";

export type Opening = Readonly<{
  width: Length;
  height: Length;
  count: number;
}>;

export function calculateOpeningsAreaM2(
  openings: readonly Opening[],
): number | null {
  if (!Array.isArray(openings) || openings.length > MAX_OPENING_ROWS) {
    return null;
  }

  let total = 0;
  for (const opening of openings) {
    if (!opening || typeof opening !== "object") return null;
    const width = lengthToMetres(opening.width);
    const height = lengthToMetres(opening.height);
    if (
      width === null ||
      height === null ||
      !isConstructionCount(opening.count)
    ) {
      return null;
    }
    total += width * height * opening.count;
    if (!Number.isFinite(total) || total > MAX_CALCULATED_QUANTITY) return null;
  }
  return total;
}
