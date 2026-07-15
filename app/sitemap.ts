import type { MetadataRoute } from "next";
import { categories, getPublishedCalculators } from "@/catalog";
import { productionOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    ["", "weekly", 1],
    ["/kalkulyatory", "weekly", 0.9],
    ["/o-proekte", "monthly", 0.5],
    ["/metodologiya", "monthly", 0.7],
    ["/istochniki", "monthly", 0.5],
    ["/kontakty", "yearly", 0.3],
    ["/politika-konfidencialnosti", "yearly", 0.2],
  ] as const;
  const routes: MetadataRoute.Sitemap = [
    ...staticPages.map(([path, changeFrequency, priority]) => ({
      url: `${productionOrigin}${path}`,
      lastModified: new Date("2026-07-15"),
      changeFrequency,
      priority,
    })),
    ...categories.map((category) => ({
      url: `${productionOrigin}/kalkulyatory/${category.slug}`,
      lastModified: new Date("2026-07-15"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  for (const calculator of getPublishedCalculators()) {
    const lastModified =
      calculator.formulaReviewedAt > calculator.contentUpdatedAt
        ? calculator.formulaReviewedAt
        : calculator.contentUpdatedAt;
    routes.push({
      url: `${productionOrigin}${calculator.path}`,
      lastModified: new Date(lastModified),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return routes;
}
