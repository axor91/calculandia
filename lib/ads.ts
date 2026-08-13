// Рекламная сеть Яндекса: конфигурация блоков.
//
// Идентификатор блока выдаёт личный кабинет РСЯ, придумать его нельзя. Пока
// переменная окружения пуста, реклама выключена целиком: загрузчик на страницу
// не попадает, ни одного запроса к сети не уходит, CSP не ослабляется.
//
// Переменные читаются буквально (`process.env.NEXT_PUBLIC_...`), потому что
// Next подставляет значение на сборке только при статическом обращении:
// динамическая индексация оставит в клиентском бандле undefined.
// https://nextjs.org/docs/app/guides/environment-variables

/** Формат идентификатора блока РСЯ: R-A-<номер площадки>-<номер блока>. */
const BLOCK_ID_PATTERN = /^R-[A-Z]-\d{1,12}-\d{1,4}$/;

export type AdPlacement = "calculatorTop" | "calculatorBottom";

export interface AdUnit {
  readonly placement: AdPlacement;
  readonly blockId: string;
}

/** Контейнер, в который РСЯ рисует блок. Имя задаётся параметром renderTo. */
export function adContainerId(blockId: string): string {
  return `yandex_rtb_${blockId}`;
}

/**
 * Мусор в переменной — ошибка сборки, а не тихо выключенная реклама:
 * опечатку в идентификаторе иначе не отличить от «ещё не подключали».
 */
export function parseBlockId(
  placement: AdPlacement,
  raw: string | undefined,
): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (!BLOCK_ID_PATTERN.test(value)) {
    throw new Error(
      `Ad block id for ${placement} must look like R-A-123456-1, got ${JSON.stringify(value)}`,
    );
  }
  return value;
}

export function resolveAdUnits(
  env: Record<string, string | undefined>,
): readonly AdUnit[] {
  const configured: readonly (readonly [AdPlacement, string | undefined])[] = [
    ["calculatorTop", env.NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_TOP],
    ["calculatorBottom", env.NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_BOTTOM],
  ];

  const units: AdUnit[] = [];
  for (const [placement, raw] of configured) {
    const blockId = parseBlockId(placement, raw);
    if (!blockId) continue;
    const duplicate = units.find((unit) => unit.blockId === blockId);
    if (duplicate) {
      throw new Error(
        `Ad block ${blockId} is configured for both ${duplicate.placement} and ${placement}: one block id renders into one container`,
      );
    }
    units.push({ placement, blockId });
  }
  return units;
}

export const adUnits = resolveAdUnits({
  NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_TOP:
    process.env.NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_TOP,
  NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_BOTTOM:
    process.env.NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_BOTTOM,
});

export const adsEnabled = adUnits.length > 0;

export function adBlockId(placement: AdPlacement): string | null {
  return adUnits.find((unit) => unit.placement === placement)?.blockId ?? null;
}

/** Загрузчик рекламы: один на страницу, ставится в head. */
export const AD_LOADER_SRC = "https://yandex.ru/ads/system/context.js";

/**
 * Содержимое /ads.txt. Без него DSP-платформы ограничивают закупку на площадке
 * (https://yandex.ru/support/partner/ru/web/ads-txt-setup), а строки выдаёт
 * кабинет РСЯ: Настройки → Общие → ads.txt. Значение приходит переменной
 * окружения, потому что идентификатор партнёра известен только владельцу.
 * В .env перенос строки записывается как \n внутри двойных кавычек.
 */
export function parseAdsTxt(raw: string | undefined): string | null {
  const lines = (raw ?? "")
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return null;
  return `${lines.join("\n")}\n`;
}

export const adsTxt = parseAdsTxt(process.env.YANDEX_ADS_TXT);
