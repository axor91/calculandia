import { calculateOpeningsAreaM2, type Opening } from "./openings";
import {
  ceilDecimalRatio,
  isCalculatedQuantity,
  isReservePercent,
  lengthToMetres,
  type Length,
} from "./units";

export const brickFormats = {
  single: { lengthM: 0.25, widthM: 0.12, heightM: 0.065 },
  oneAndHalf: { lengthM: 0.25, widthM: 0.12, heightM: 0.088 },
  double: { lengthM: 0.25, widthM: 0.12, heightM: 0.138 },
} as const;

export type BrickFormat = keyof typeof brickFormats;

export const brickWallThicknessOptionsM = [0.12, 0.25, 0.38, 0.51] as const;
export type BrickWallThicknessM = (typeof brickWallThicknessOptionsM)[number];

export const MIN_BRICK_JOINT_MM = 5;
export const MAX_BRICK_JOINT_MM = 15;

export type BrickInput = Readonly<{
  wall: Readonly<{
    length: Length;
    height: Length;
  }>;
  openings: readonly Opening[];
  wallThicknessM: number;
  format: BrickFormat;
  jointMm: number;
  reservePercent: number;
}>;

export type BrickResult = Readonly<{
  wallAreaM2: number;
  openingsAreaM2: number;
  wallThicknessM: number;
  format: BrickFormat;
  jointMm: number;
  masonryVolumeM3: number;
  brickVolumeWithJointM3: number;
  bricksPerM3: number;
  theoreticalBricks: number;
  reservePercent: number;
  bricksWithReserve: number;
}>;

function isBrickWallThickness(value: number): boolean {
  return (brickWallThicknessOptionsM as readonly number[]).includes(value);
}

function isBrickJoint(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_BRICK_JOINT_MM &&
    value <= MAX_BRICK_JOINT_MM
  );
}

export function calculateBrick(input: BrickInput): BrickResult | null {
  if (!input || typeof input !== "object" || !input.wall) return null;

  const wallLength = lengthToMetres(input.wall.length);
  const wallHeight = lengthToMetres(input.wall.height);
  const openingsAreaM2 = calculateOpeningsAreaM2(input.openings);
  const format = brickFormats[input.format];

  if (
    wallLength === null ||
    wallHeight === null ||
    openingsAreaM2 === null ||
    !format ||
    !isBrickWallThickness(input.wallThicknessM) ||
    !isBrickJoint(input.jointMm) ||
    !isReservePercent(input.reservePercent)
  ) {
    return null;
  }

  const grossWallAreaM2 = wallLength * wallHeight;
  const wallAreaM2 = grossWallAreaM2 - openingsAreaM2;

  if (openingsAreaM2 >= grossWallAreaM2 || !isCalculatedQuantity(wallAreaM2)) {
    return null;
  }

  const masonryVolumeM3 = wallAreaM2 * input.wallThicknessM;
  const jointM = input.jointMm / 1000;
  const brickVolumeWithJointM3 =
    (format.lengthM + jointM) *
    (format.heightM + jointM) *
    (format.widthM + jointM);

  if (
    !isCalculatedQuantity(masonryVolumeM3) ||
    !isCalculatedQuantity(brickVolumeWithJointM3)
  ) {
    return null;
  }

  const bricksPerM3 = 1 / brickVolumeWithJointM3;
  const theoreticalBricks = ceilDecimalRatio(
    masonryVolumeM3,
    brickVolumeWithJointM3,
  );
  const bricksWithReserve = ceilDecimalRatio(
    theoreticalBricks * (1 + input.reservePercent / 100),
    1,
  );

  if (
    !isCalculatedQuantity(theoreticalBricks) ||
    !isCalculatedQuantity(bricksWithReserve)
  ) {
    return null;
  }

  return {
    wallAreaM2,
    openingsAreaM2,
    wallThicknessM: input.wallThicknessM,
    format: input.format,
    jointMm: input.jointMm,
    masonryVolumeM3,
    brickVolumeWithJointM3,
    bricksPerM3,
    theoreticalBricks,
    reservePercent: input.reservePercent,
    bricksWithReserve,
  };
}
