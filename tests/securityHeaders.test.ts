import { describe, expect, it } from "vitest";
import {
  contentSecurityPolicy,
  securityHeaders,
} from "../lib/security-headers";

function directive(policy: string, name: string): string | undefined {
  return policy
    .split("; ")
    .find((part) => part.startsWith(`${name} `) || part === name);
}

const withoutAds = contentSecurityPolicy({
  isDevelopment: false,
  adsEnabled: false,
});
const withAds = contentSecurityPolicy({
  isDevelopment: false,
  adsEnabled: true,
});

describe("Content-Security-Policy", () => {
  it("без рекламы остаётся политикой запуска: ни eval, ни рекламных доменов", () => {
    expect(withoutAds).toBe(
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://mc.yandex.az https://mc.yandex.by https://mc.yandex.co.il https://mc.yandex.com https://mc.yandex.com.am https://mc.yandex.com.ge https://mc.yandex.com.tr https://mc.yandex.ee https://mc.yandex.fr https://mc.yandex.kg https://mc.yandex.kz https://mc.yandex.lt https://mc.yandex.lv https://mc.yandex.md https://mc.yandex.tj https://mc.yandex.tm https://mc.yandex.uz https://mc.webvisor.com https://mc.webvisor.org https://yastatic.net; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: https://mc.yandex.ru https://mc.yandex.az https://mc.yandex.by https://mc.yandex.co.il https://mc.yandex.com https://mc.yandex.com.am https://mc.yandex.com.ge https://mc.yandex.com.tr https://mc.yandex.ee https://mc.yandex.fr https://mc.yandex.kg https://mc.yandex.kz https://mc.yandex.lt https://mc.yandex.lv https://mc.yandex.md https://mc.yandex.tj https://mc.yandex.tm https://mc.yandex.uz https://mc.webvisor.com https://mc.webvisor.org https://yastatic.net; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://mc.yandex.ru https://mc.yandex.az https://mc.yandex.by https://mc.yandex.co.il https://mc.yandex.com https://mc.yandex.com.am https://mc.yandex.com.ge https://mc.yandex.com.tr https://mc.yandex.ee https://mc.yandex.fr https://mc.yandex.kg https://mc.yandex.kz https://mc.yandex.lt https://mc.yandex.lv https://mc.yandex.md https://mc.yandex.tj https://mc.yandex.tm https://mc.yandex.uz https://mc.webvisor.com https://mc.webvisor.org https://yastatic.net wss://mc.yandex.ru wss://mc.yandex.az wss://mc.yandex.by wss://mc.yandex.co.il wss://mc.yandex.com wss://mc.yandex.com.am wss://mc.yandex.com.ge wss://mc.yandex.com.tr wss://mc.yandex.ee wss://mc.yandex.fr wss://mc.yandex.kg wss://mc.yandex.kz wss://mc.yandex.lt wss://mc.yandex.lv wss://mc.yandex.md wss://mc.yandex.tj wss://mc.yandex.tm wss://mc.yandex.uz wss://mc.webvisor.com wss://mc.webvisor.org; " +
        "worker-src 'self' blob:; " +
        "frame-src https://mc.yandex.ru https://mc.yandex.az https://mc.yandex.by https://mc.yandex.co.il https://mc.yandex.com https://mc.yandex.com.am https://mc.yandex.com.ge https://mc.yandex.com.tr https://mc.yandex.ee https://mc.yandex.fr https://mc.yandex.kg https://mc.yandex.kz https://mc.yandex.lt https://mc.yandex.lv https://mc.yandex.md https://mc.yandex.tj https://mc.yandex.tm https://mc.yandex.uz https://mc.webvisor.com https://mc.webvisor.org https://yastatic.net; " +
        "frame-ancestors 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "manifest-src 'self'",
    );
  });

  it("ослабления ради рекламы не действуют, пока блок не настроен", () => {
    expect(withoutAds).not.toContain("'unsafe-eval'");
    expect(withoutAds).not.toContain("yandexadexchange.net");
    expect(withoutAds).not.toContain("*.adfox.ru");
    expect(directive(withoutAds, "media-src")).toBeUndefined();
  });

  // Списки — «Размещение рекламы на сайтах с CSP», официальная дока РСЯ:
  // https://yandex.ru/support/partner/ru/web/adplatform/csp-configuration
  it.each([
    [
      "script-src",
      "'unsafe-eval' yastatic.net *.yandex.ru *.adfox.ru yandex.ru yandex.com verify.yandex.ru",
    ],
    ["style-src", "'unsafe-eval' yastatic.net *.adfox.ru"],
    ["img-src", "*.yandex.net *.adfox.ru *.yandex.ru yandex.ru yandex.com"],
    ["font-src", "yastatic.net"],
    [
      "connect-src",
      "blob: yastatic.net *.yandex.net *.adfox.ru *.yandex.ru yandex.ru yandex.com",
    ],
    [
      "frame-src",
      "yandexadexchange.net *.yandexadexchange.net yastatic.net *.yandex.ru *.adfox.ru",
    ],
    [
      "media-src",
      "yastatic.net *.yandex.net *.yandex.ru *.adfox.ru yandex.ru yandex.com blob: data:",
    ],
  ])("с рекламой директива %s содержит домены сети", (name, expected) => {
    expect(directive(withAds, name)).toContain(expected);
  });

  it("dev-режим по-прежнему получает eval и локальные транспорты", () => {
    const dev = contentSecurityPolicy({
      isDevelopment: true,
      adsEnabled: false,
    });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toContain("ws:");
  });

  it("остальные заголовки безопасности не зависят от рекламы", () => {
    const keys = (adsEnabled: boolean) =>
      securityHeaders({ isDevelopment: false, adsEnabled })
        .filter((header) => header.key !== "Content-Security-Policy")
        .map((header) => `${header.key}: ${header.value}`);
    expect(keys(true)).toEqual(keys(false));
    expect(keys(true)).toContain("X-Frame-Options: DENY");
  });
});
