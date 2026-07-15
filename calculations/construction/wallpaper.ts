import { calculateOpeningsAreaM2, type Opening } from "./openings";
import {
  ceilDecimalRatio,
  floorDecimalRatio,
  isCalculatedQuantity,
  isReservePercent,
  lengthToMetres,
  MAX_CALCULATED_QUANTITY,
  multiplyDecimal,
  type Length,
} from "./units";

export type WallpaperInput = Readonly<{
  room: Readonly<{
    length: Length;
    width: Length;
    wallHeight: Length;
  }>;
  roll: Readonly<{
    width: Length;
    length: Length;
  }>;
  patternRepeat: Length;
  trimAllowance: Length;
  openings: readonly Opening[];
  reservePercent: number;
}>;

export type WallpaperResult = Readonly<{
  perimeterM: number;
  grossWallAreaM2: number;
  openingsAreaM2: number;
  theoreticalAreaM2: number;
  reservePercent: number;
  areaWithReserveM2: number;
  cutLengthM: number;
  trimAllowanceM: number;
  stripsPerRoll: number;
  theoreticalStrips: number;
  stripsWithReserve: number;
  theoreticalRollsWithReserve: number;
  rollsToBuy: number;
  openingDeductionMethod: "area-equivalent";
}>;

export function calculateWallpaper(
  input: WallpaperInput,
): WallpaperResult | null {
  if (!input || typeof input !== "object" || !input.room || !input.roll) {
    return null;
  }

  const roomLength = lengthToMetres(input.room.length);
  const roomWidth = lengthToMetres(input.room.width);
  const wallHeight = lengthToMetres(input.room.wallHeight);
  const rollWidth = lengthToMetres(input.roll.width);
  const rollLength = lengthToMetres(input.roll.length);
  const patternRepeat = lengthToMetres(input.patternRepeat, {
    allowZero: true,
  });
  const trimAllowance = lengthToMetres(input.trimAllowance, {
    allowZero: true,
  });
  const openingsAreaM2 = calculateOpeningsAreaM2(input.openings);

  if (
    roomLength === null ||
    roomWidth === null ||
    wallHeight === null ||
    rollWidth === null ||
    rollLength === null ||
    patternRepeat === null ||
    trimAllowance === null ||
    openingsAreaM2 === null ||
    !isReservePercent(input.reservePercent)
  ) {
    return null;
  }

  const perimeterM = 2 * (roomLength + roomWidth);
  const grossWallAreaM2 = perimeterM * wallHeight;
  const theoreticalAreaM2 = grossWallAreaM2 - openingsAreaM2;
  const areaWithReserveM2 =
    theoreticalAreaM2 * (1 + input.reservePercent / 100);
  const minimumCutLengthM = wallHeight + trimAllowance;
  let cutLengthM = minimumCutLengthM;
  if (patternRepeat !== 0) {
    const alignedRepeats = ceilDecimalRatio(minimumCutLengthM, patternRepeat);
    if (
      !isCalculatedQuantity(alignedRepeats) ||
      !Number.isSafeInteger(alignedRepeats)
    ) {
      return null;
    }
    cutLengthM = multiplyDecimal(patternRepeat, alignedRepeats);
  }
  const stripsPerRoll = floorDecimalRatio(rollLength, cutLengthM);

  if (
    openingsAreaM2 >= grossWallAreaM2 ||
    !isCalculatedQuantity(theoreticalAreaM2) ||
    !isCalculatedQuantity(areaWithReserveM2) ||
    !isCalculatedQuantity(cutLengthM) ||
    !Number.isSafeInteger(stripsPerRoll) ||
    stripsPerRoll < 1
  ) {
    return null;
  }

  const theoreticalStrips = theoreticalAreaM2 / (rollWidth * wallHeight);
  const stripsWithReserve = ceilDecimalRatio(
    areaWithReserveM2,
    rollWidth * wallHeight,
  );
  const theoreticalRollsWithReserve =
    (theoreticalStrips * (1 + input.reservePercent / 100)) / stripsPerRoll;
  const rollsToBuy = ceilDecimalRatio(stripsWithReserve, stripsPerRoll);

  if (
    !isCalculatedQuantity(theoreticalStrips) ||
    !isCalculatedQuantity(stripsWithReserve) ||
    !isCalculatedQuantity(theoreticalRollsWithReserve) ||
    !isCalculatedQuantity(rollsToBuy) ||
    theoreticalRollsWithReserve > MAX_CALCULATED_QUANTITY
  ) {
    return null;
  }

  return {
    perimeterM,
    grossWallAreaM2,
    openingsAreaM2,
    theoreticalAreaM2,
    reservePercent: input.reservePercent,
    areaWithReserveM2,
    cutLengthM,
    trimAllowanceM: trimAllowance,
    stripsPerRoll,
    theoreticalStrips,
    stripsWithReserve,
    theoreticalRollsWithReserve,
    rollsToBuy,
    openingDeductionMethod: "area-equivalent",
  };
}
