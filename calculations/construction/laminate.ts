import {
  ceilDecimalRatio,
  isCalculatedQuantity,
  isReservePercent,
  lengthToMetres,
  type Length,
} from "./units";

export const MIN_LAMINATE_PACK_AREA_M2 = 0.5;
export const MAX_LAMINATE_PACK_AREA_M2 = 5;

export type LaminateInput = Readonly<{
  room: Readonly<{
    length: Length;
    width: Length;
  }>;
  packAreaM2: number;
  reservePercent: number;
}>;

export type LaminateResult = Readonly<{
  theoreticalAreaM2: number;
  reservePercent: number;
  areaWithReserveM2: number;
  packAreaM2: number;
  packsToBuy: number;
}>;

function isLaminatePackArea(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_LAMINATE_PACK_AREA_M2 &&
    value <= MAX_LAMINATE_PACK_AREA_M2
  );
}

export function calculateLaminate(input: LaminateInput): LaminateResult | null {
  if (!input || typeof input !== "object" || !input.room) return null;

  const roomLength = lengthToMetres(input.room.length);
  const roomWidth = lengthToMetres(input.room.width);

  if (
    roomLength === null ||
    roomWidth === null ||
    !isLaminatePackArea(input.packAreaM2) ||
    !isReservePercent(input.reservePercent)
  ) {
    return null;
  }

  const theoreticalAreaM2 = roomLength * roomWidth;
  const areaWithReserveM2 =
    theoreticalAreaM2 * (1 + input.reservePercent / 100);

  if (
    !isCalculatedQuantity(theoreticalAreaM2) ||
    !isCalculatedQuantity(areaWithReserveM2)
  ) {
    return null;
  }

  const packsToBuy = ceilDecimalRatio(areaWithReserveM2, input.packAreaM2);
  if (!isCalculatedQuantity(packsToBuy)) return null;

  return {
    theoreticalAreaM2,
    reservePercent: input.reservePercent,
    areaWithReserveM2,
    packAreaM2: input.packAreaM2,
    packsToBuy,
  };
}
