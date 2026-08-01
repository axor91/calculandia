import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";

const isDevelopment = process.env.NODE_ENV !== "production";

function resolveBuildId(): string {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error("Git HEAD must be a full SHA-1 before building");
  }

  const status = execFileSync(
    "git",
    ["status", "--porcelain", "--untracked-files=normal"],
    { encoding: "utf8" },
  ).trim();
  return status ? `${sha}-dirty` : sha;
}

const buildId = resolveBuildId();

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

function contentSecurityPolicy(): string {
  const scriptSources = ["'self'", "'unsafe-inline'", ...METRIKA_HTTPS_HOSTS];
  const connectSources = [
    "'self'",
    ...METRIKA_HTTPS_HOSTS,
    ...METRIKA_WSS_HOSTS,
  ];

  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("ws:", "http:", "https:");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${METRIKA_HTTPS_HOSTS.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "worker-src 'self' blob:",
    `frame-src ${METRIKA_HTTPS_HOSTS.join(" ")}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  generateBuildId: async () => buildId,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
