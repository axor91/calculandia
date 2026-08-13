import Script from "next/script";
import { AD_LOADER_SRC, adsEnabled } from "@/lib/ads";

/**
 * Загрузчик рекламы РСЯ. Ставится один раз на страницу и обслуживает все
 * блоки: https://yandex.ru/support/adfox/ru/ad-inventory/codes/code-loader
 *
 * Пока ни один блок не настроен, компонент не отдаёт ничего — сайт остаётся
 * без внешнего скрипта весом 400 КБ.
 */
export default function YandexAds() {
  if (!adsEnabled) return null;
  return (
    <Script
      id="yandex-ads-loader"
      src={AD_LOADER_SRC}
      strategy="afterInteractive"
    />
  );
}
