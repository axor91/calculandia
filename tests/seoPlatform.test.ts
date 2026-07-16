import { describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import { createPageMetadata } from "../lib/page-metadata";
import { isStrictIsoDate } from "../catalog/validate";

describe("SEO platform", () => {
  it("publishes a unique canonical sitemap without legacy URLs", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(entries).toHaveLength(25);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain("https://calculandia.ru/kalkulyator/ipoteka");
    expect(urls.some((url) => url.includes("/calculator/"))).toBe(false);
  });

  it("keeps technical endpoints out of crawling", () => {
    expect(robots()).toMatchObject({
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/healthz", "/host-healthz", "/api/"],
        },
      ],
      sitemap: "https://calculandia.ru/sitemap.xml",
    });
  });

  it("sets canonical and complete social metadata per route", () => {
    const metadata = createPageMetadata(
      "Финансы",
      "Описание",
      "/kalkulyatory/finansy",
    );
    expect(metadata.alternates).toEqual({ canonical: "/kalkulyatory/finansy" });
    expect(metadata.openGraph).toMatchObject({
      title: "Финансы",
      description: "Описание",
      url: "/kalkulyatory/finansy",
      images: [{ url: "/opengraph-image.png" }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it.each([
    ["2026-02-28", true],
    ["2024-02-29", true],
    ["2026-02-29", false],
    ["2026-02-31", false],
    ["2026-13-01", false],
  ])("validates ISO date %s strictly", (value, valid) => {
    expect(isStrictIsoDate(value)).toBe(valid);
  });
});
