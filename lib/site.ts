export const productionOrigin = "https://calculandia.ru";
export const developmentOrigin = "http://localhost:3212";

export function normalizeOrigin(value: string): string {
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be an origin without path, query or fragment",
    );
  }
  return url.origin;
}

export function resolveSiteOrigin(
  nodeEnv: string | undefined,
  configuredOrigin: string | undefined,
): string {
  if (nodeEnv === "production") {
    if (
      configuredOrigin &&
      normalizeOrigin(configuredOrigin) !== productionOrigin
    ) {
      throw new Error(`Production origin must be exactly ${productionOrigin}`);
    }
    return productionOrigin;
  }

  return configuredOrigin
    ? normalizeOrigin(configuredOrigin)
    : developmentOrigin;
}

export const siteOrigin = resolveSiteOrigin(
  process.env.NODE_ENV,
  process.env.NEXT_PUBLIC_SITE_URL,
);

export const siteConfig = {
  name: "Calculandia",
  origin: siteOrigin,
  description:
    "Понятные онлайн-калькуляторы с формулами, примерами и объяснением результата.",
} as const;
