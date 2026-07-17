import { calculateOpeningsAreaM2, type Opening } from "./openings";
import {
  ceilDecimalRatio,
  isCalculatedQuantity,
  lengthToMetres,
  MAX_CALCULATED_QUANTITY,
  type Length,
} from "./units";

export const MIN_PAINT_COVERAGE_L_PER_M2 = 0.05;
export const MAX_PAINT_COVERAGE_L_PER_M2 = 0.5;
export const MIN_PAINT_LAYERS = 1;
export const MAX_PAINT_LAYERS = 5;
export const MIN_PAINT_CAN_VOLUME_L = 0.5;
export const MAX_PAINT_CAN_VOLUME_L = 20;
export const MAX_PAINT_RESERVE_PERCENT = 50;

export type PaintInput = Readonly<{
  room: Readonly<{
    length: Length;
    width: Length;
    wallHeight: Length;
  }>;
  openings: readonly Opening[];
  coveragePerLayerLPerM2: number;
  layers: number;
  canVolumeL: number;
  reservePercent: number;
}>;

export type PaintResult = Readonly<{
  perimeterM: number;
  grossWallAreaM2: number;
  openingsAreaM2: number;
  theoreticalAreaM2: number;
  coveragePerLayerLPerM2: number;
  layers: number;
  theoreticalLitres: number;
  reservePercent: number;
  litresWithReserve: number;
  canVolumeL: number;
  cansToBuy: number;
}>;

function isPaintCoverage(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PAINT_COVERAGE_L_PER_M2 &&
    value <= MAX_PAINT_COVERAGE_L_PER_M2
  );
}

function isPaintLayers(value: number): boolean {
  return (
    Number.isSafeInteger(value) &&
    value >= MIN_PAINT_LAYERS &&
    value <= MAX_PAINT_LAYERS
  );
}

function isPaintCanVolume(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PAINT_CAN_VOLUME_L &&
    value <= MAX_PAINT_CAN_VOLUME_L
  );
}

function isPaintReservePercent(value: number): boolean {
  return (
    Number.isFinite(value) && value >= 0 && value <= MAX_PAINT_RESERVE_PERCENT
  );
}

export function calculatePaint(input: PaintInput): PaintResult | null {
  if (!input || typeof input !== "object" || !input.room) return null;

  const roomLength = lengthToMetres(input.room.length);
  const roomWidth = lengthToMetres(input.room.width);
  const wallHeight = lengthToMetres(input.room.wallHeight);
  const openingsAreaM2 = calculateOpeningsAreaM2(input.openings);

  if (
    roomLength === null ||
    roomWidth === null ||
    wallHeight === null ||
    openingsAreaM2 === null ||
    !isPaintCoverage(input.coveragePerLayerLPerM2) ||
    !isPaintLayers(input.layers) ||
    !isPaintCanVolume(input.canVolumeL) ||
    !isPaintReservePercent(input.reservePercent)
  ) {
    return null;
  }

  const perimeterM = 2 * (roomLength + roomWidth);
  const grossWallAreaM2 = perimeterM * wallHeight;
  const theoreticalAreaM2 = grossWallAreaM2 - openingsAreaM2;

  if (
    openingsAreaM2 >= grossWallAreaM2 ||
    !isCalculatedQuantity(theoreticalAreaM2)
  ) {
    return null;
  }

  const theoreticalLitres =
    theoreticalAreaM2 * input.coveragePerLayerLPerM2 * input.layers;
  const litresWithReserve =
    theoreticalLitres * (1 + input.reservePercent / 100);

  if (
    !isCalculatedQuantity(theoreticalLitres) ||
    !isCalculatedQuantity(litresWithReserve) ||
    litresWithReserve > MAX_CALCULATED_QUANTITY
  ) {
    return null;
  }

  const cansToBuy = ceilDecimalRatio(litresWithReserve, input.canVolumeL);
  if (!isCalculatedQuantity(cansToBuy)) return null;

  return {
    perimeterM,
    grossWallAreaM2,
    openingsAreaM2,
    theoreticalAreaM2,
    coveragePerLayerLPerM2: input.coveragePerLayerLPerM2,
    layers: input.layers,
    theoreticalLitres,
    reservePercent: input.reservePercent,
    litresWithReserve,
    canVolumeL: input.canVolumeL,
    cansToBuy,
  };
}
