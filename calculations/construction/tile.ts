import { calculateOpeningsAreaM2, type Opening } from "./openings";
import {
  ceilDecimalRatio,
  isCalculatedQuantity,
  isConstructionCount,
  isReservePercent,
  lengthToMetres,
  MAX_CALCULATED_QUANTITY,
  type Length,
} from "./units";

export type TileInput = Readonly<{
  surface: Readonly<{
    width: Length;
    height: Length;
    count: number;
  }>;
  tile: Readonly<{
    width: Length;
    height: Length;
  }>;
  openings: readonly Opening[];
  reservePercent: number;
  piecesPerBox: number;
}>;

export type TileResult = Readonly<{
  grossAreaM2: number;
  openingsAreaM2: number;
  theoreticalAreaM2: number;
  reservePercent: number;
  areaWithReserveM2: number;
  tileAreaM2: number;
  theoreticalPieces: number;
  piecesWithReserve: number;
  boxesToBuy: number;
  piecesToBuy: number;
  purchaseAreaM2: number;
}>;

export function calculateTile(input: TileInput): TileResult | null {
  if (!input || typeof input !== "object" || !input.surface || !input.tile) {
    return null;
  }

  const surfaceWidth = lengthToMetres(input.surface.width);
  const surfaceHeight = lengthToMetres(input.surface.height);
  const tileWidth = lengthToMetres(input.tile.width);
  const tileHeight = lengthToMetres(input.tile.height);
  const openingsAreaM2 = calculateOpeningsAreaM2(input.openings);

  if (
    surfaceWidth === null ||
    surfaceHeight === null ||
    tileWidth === null ||
    tileHeight === null ||
    openingsAreaM2 === null ||
    !isConstructionCount(input.surface.count) ||
    !isConstructionCount(input.piecesPerBox) ||
    !isReservePercent(input.reservePercent)
  ) {
    return null;
  }

  const grossAreaM2 = surfaceWidth * surfaceHeight * input.surface.count;
  const theoreticalAreaM2 = grossAreaM2 - openingsAreaM2;
  const areaWithReserveM2 =
    theoreticalAreaM2 * (1 + input.reservePercent / 100);
  const tileAreaM2 = tileWidth * tileHeight;

  if (
    openingsAreaM2 >= grossAreaM2 ||
    !isCalculatedQuantity(theoreticalAreaM2) ||
    !isCalculatedQuantity(areaWithReserveM2) ||
    !isCalculatedQuantity(tileAreaM2)
  ) {
    return null;
  }

  const theoreticalPieces = theoreticalAreaM2 / tileAreaM2;
  const piecesWithReserve = ceilDecimalRatio(areaWithReserveM2, tileAreaM2);
  const boxesToBuy = ceilDecimalRatio(piecesWithReserve, input.piecesPerBox);
  const piecesToBuy = boxesToBuy * input.piecesPerBox;
  const purchaseAreaM2 = piecesToBuy * tileAreaM2;

  if (
    !isCalculatedQuantity(theoreticalPieces) ||
    !isCalculatedQuantity(piecesWithReserve) ||
    !isCalculatedQuantity(boxesToBuy) ||
    !isCalculatedQuantity(piecesToBuy) ||
    !Number.isFinite(purchaseAreaM2) ||
    purchaseAreaM2 > MAX_CALCULATED_QUANTITY
  ) {
    return null;
  }

  return {
    grossAreaM2,
    openingsAreaM2,
    theoreticalAreaM2,
    reservePercent: input.reservePercent,
    areaWithReserveM2,
    tileAreaM2,
    theoreticalPieces,
    piecesWithReserve,
    boxesToBuy,
    piecesToBuy,
    purchaseAreaM2,
  };
}
