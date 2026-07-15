import {
  isCalculatedQuantity,
  isConstructionCount,
  isReservePercent,
  lengthToMetres,
  type Length,
} from "./units";

type ConcreteCommonInput = Readonly<{
  count: number;
  reservePercent: number;
}>;

export type RectangularConcreteInput = ConcreteCommonInput &
  Readonly<{
    shape: "rectangular";
    length: Length;
    width: Length;
    height: Length;
  }>;

export type CylinderConcreteInput = ConcreteCommonInput &
  Readonly<{
    shape: "cylinder";
    diameter: Length;
    height: Length;
  }>;

export type ConcreteInput = RectangularConcreteInput | CylinderConcreteInput;

export type ConcreteResult = Readonly<{
  shape: ConcreteInput["shape"];
  count: number;
  theoreticalVolumeM3: number;
  reservePercent: number;
  reserveVolumeM3: number;
  volumeWithReserveM3: number;
}>;

export function calculateConcrete(input: ConcreteInput): ConcreteResult | null {
  if (
    !input ||
    typeof input !== "object" ||
    !isConstructionCount(input.count) ||
    !isReservePercent(input.reservePercent)
  ) {
    return null;
  }

  const height = lengthToMetres(input.height);
  if (height === null) return null;

  let singleVolume: number;
  if (input.shape === "rectangular") {
    const length = lengthToMetres(input.length);
    const width = lengthToMetres(input.width);
    if (length === null || width === null) return null;
    singleVolume = length * width * height;
  } else if (input.shape === "cylinder") {
    const diameter = lengthToMetres(input.diameter);
    if (diameter === null) return null;
    singleVolume = Math.PI * (diameter / 2) ** 2 * height;
  } else {
    return null;
  }

  const theoreticalVolumeM3 = singleVolume * input.count;
  const reserveVolumeM3 = theoreticalVolumeM3 * (input.reservePercent / 100);
  const volumeWithReserveM3 = theoreticalVolumeM3 + reserveVolumeM3;
  if (
    !isCalculatedQuantity(theoreticalVolumeM3) ||
    !isCalculatedQuantity(volumeWithReserveM3)
  ) {
    return null;
  }

  return {
    shape: input.shape,
    count: input.count,
    theoreticalVolumeM3,
    reservePercent: input.reservePercent,
    reserveVolumeM3,
    volumeWithReserveM3,
  };
}
