import { describe, expect, it } from "vitest";
import {
  adContainerId,
  parseAdsTxt,
  parseBlockId,
  resolveAdUnits,
} from "../lib/ads";

describe("Рекламные блоки РСЯ", () => {
  it("выключена, пока ни один блок не настроен", () => {
    expect(resolveAdUnits({})).toEqual([]);
    expect(
      resolveAdUnits({
        NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_TOP: "   ",
        NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_BOTTOM: "",
      }),
    ).toEqual([]);
  });

  it("собирает настроенные блоки по позициям", () => {
    expect(
      resolveAdUnits({
        NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_TOP: " R-A-123456-1 ",
        NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_BOTTOM: "R-A-123456-2",
      }),
    ).toEqual([
      { placement: "calculatorTop", blockId: "R-A-123456-1" },
      { placement: "calculatorBottom", blockId: "R-A-123456-2" },
    ]);
  });

  it("позиции включаются независимо друг от друга", () => {
    expect(
      resolveAdUnits({
        NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_BOTTOM: "R-A-123456-2",
      }),
    ).toEqual([{ placement: "calculatorBottom", blockId: "R-A-123456-2" }]);
  });

  it.each([
    "123456",
    "R-A-123456",
    "A-123456-1",
    "R-A-123456-1; alert(1)",
    "<script>",
    "R-A-abcdef-1",
  ])("останавливает сборку на непохожем идентификаторе %s", (value) => {
    expect(() => parseBlockId("calculatorTop", value)).toThrow(
      /must look like R-A-123456-1/,
    );
  });

  it("не даёт занять один блок двумя контейнерами", () => {
    expect(() =>
      resolveAdUnits({
        NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_TOP: "R-A-123456-1",
        NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_BOTTOM: "R-A-123456-1",
      }),
    ).toThrow(/one block id renders into one container/);
  });

  it("имя контейнера совпадает с ожиданиями кода блока РСЯ", () => {
    expect(adContainerId("R-A-123456-1")).toBe("yandex_rtb_R-A-123456-1");
  });

  it("ads.txt отсутствует, пока строки не заданы", () => {
    expect(parseAdsTxt(undefined)).toBeNull();
    expect(parseAdsTxt("  \n \n")).toBeNull();
  });

  it("ads.txt нормализует строки и завершается переводом строки", () => {
    expect(
      parseAdsTxt("yandex.ru, 123456, DIRECT\\n  yandex.com, 123456, DIRECT  "),
    ).toBe("yandex.ru, 123456, DIRECT\nyandex.com, 123456, DIRECT\n");
  });
});
