// Заголовки безопасности. Вынесены из next.config.ts, чтобы политику можно было
// проверить тестом в обоих состояниях — с рекламой и без неё.

// Домены Яндекс Метрики — «Общий список адресов» из официальной доки:
// https://yandex.ru/support/metrica/ru/code/install-counter-csp
const METRIKA_HTTPS_HOSTS = [
  "https://mc.yandex.ru",
  "https://mc.yandex.az",
  "https://mc.yandex.by",
  "https://mc.yandex.co.il",
  "https://mc.yandex.com",
  "https://mc.yandex.com.am",
  "https://mc.yandex.com.ge",
  "https://mc.yandex.com.tr",
  "https://mc.yandex.ee",
  "https://mc.yandex.fr",
  "https://mc.yandex.kg",
  "https://mc.yandex.kz",
  "https://mc.yandex.lt",
  "https://mc.yandex.lv",
  "https://mc.yandex.md",
  "https://mc.yandex.tj",
  "https://mc.yandex.tm",
  "https://mc.yandex.uz",
  "https://mc.webvisor.com",
  "https://mc.webvisor.org",
  "https://yastatic.net",
];

const METRIKA_WSS_HOSTS = METRIKA_HTTPS_HOSTS.filter(
  (host) => host !== "https://yastatic.net",
).map((host) => host.replace("https://", "wss://"));

// Домены Рекламной сети Яндекса по директивам — из официальной доки:
// https://yandex.ru/support/partner/ru/web/adplatform/csp-configuration
// Списки подмешиваются только при настроенном рекламном блоке: без рекламы
// политика остаётся прежней и, в частности, без 'unsafe-eval' в проде.
const ADS_HOSTS = {
  script: [
    "'unsafe-inline'",
    "'unsafe-eval'",
    "yastatic.net",
    "*.yandex.ru",
    "*.adfox.ru",
    "yandex.ru",
    "yandex.com",
    "verify.yandex.ru",
  ],
  style: ["'unsafe-inline'", "'unsafe-eval'", "yastatic.net", "*.adfox.ru"],
  img: [
    "*.yandex.net",
    "*.adfox.ru",
    "*.yandex.ru",
    "yandex.ru",
    "yandex.com",
    "data:",
  ],
  media: [
    "yastatic.net",
    "*.yandex.net",
    "*.yandex.ru",
    "*.adfox.ru",
    "yandex.ru",
    "yandex.com",
    "blob:",
    "data:",
  ],
  connect: [
    "blob:",
    "yastatic.net",
    "*.yandex.net",
    "*.adfox.ru",
    "*.yandex.ru",
    "yandex.ru",
    "yandex.com",
  ],
  frame: [
    "yandexadexchange.net",
    "*.yandexadexchange.net",
    "yastatic.net",
    "*.yandex.ru",
    "*.adfox.ru",
  ],
  font: ["yastatic.net", "data:"],
} as const;

export interface PolicyOptions {
  readonly isDevelopment: boolean;
  readonly adsEnabled: boolean;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function contentSecurityPolicy({
  isDevelopment,
  adsEnabled,
}: PolicyOptions): string {
  const ads = (directive: keyof typeof ADS_HOSTS): readonly string[] =>
    adsEnabled ? ADS_HOSTS[directive] : [];

  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    ...METRIKA_HTTPS_HOSTS,
    ...ads("script"),
  ];
  const connectSources = [
    "'self'",
    ...METRIKA_HTTPS_HOSTS,
    ...METRIKA_WSS_HOSTS,
    ...ads("connect"),
  ];

  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("ws:", "http:", "https:");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${unique(scriptSources).join(" ")}`,
    `style-src ${unique(["'self'", "'unsafe-inline'", ...ads("style")]).join(" ")}`,
    `img-src ${unique(["'self'", "data:", "blob:", ...METRIKA_HTTPS_HOSTS, ...ads("img")]).join(" ")}`,
    `font-src ${unique(["'self'", "data:", ...ads("font")]).join(" ")}`,
    `connect-src ${unique(connectSources).join(" ")}`,
    "worker-src 'self' blob:",
    `frame-src ${unique([...METRIKA_HTTPS_HOSTS, ...ads("frame")]).join(" ")}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ];

  if (adsEnabled) {
    directives.push(`media-src ${unique(ADS_HOSTS.media).join(" ")}`);
  }

  return directives.join("; ");
}

export function securityHeaders(
  options: PolicyOptions,
): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  ];
}
