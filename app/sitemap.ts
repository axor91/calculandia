import type { MetadataRoute } from "next";
import { getPublishedCalculators } from "@/lib/catalog";
import { siteOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteOrigin,
      lastModified: new Date("2026-07-15"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const calculator of getPublishedCalculators()) {
    routes.push({
      url: `${siteOrigin}/calculator/${calculator.slug}`,
      lastModified: new Date(calculator.updatedAt),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return routes;
}
