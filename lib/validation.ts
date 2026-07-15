import { z } from 'zod';

export const faqItemSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  answer: z.string().trim().min(1).max(5000),
});

export const adsPlacementSchema = z.object({
  enabled: z.boolean(),
  code: z.string().max(20000).optional().or(z.literal('')),
});

export const calculatorUpdateSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(1)
    .max(100)
    .optional(),
  seo: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(500),
    keywords: z.array(z.string().trim().min(1)).max(50),
    robots: z.string().trim().min(1).max(200).optional(),
  }),
  content: z
    .object({
      beforeCalculator: z.string().optional(),
      afterCalculator: z.string().optional(),
      faq: z.array(faqItemSchema).max(100).optional(),
    })
    .optional(),
  ads: z
    .object({
      topBanner: adsPlacementSchema.optional(),
      sidebarBanner: adsPlacementSchema.optional(),
      bottomBanner: adsPlacementSchema.optional(),
    })
    .optional(),
  schema: z
    .object({
      types: z.array(z.enum(['FAQPage', 'HowTo', 'Product', 'Article', 'BreadcrumbList'])).optional(),
      extraJsonLd: z.string().max(20000).optional(),
    })
    .optional(),
});

export type CalculatorUpdateInput = z.infer<typeof calculatorUpdateSchema>;

export function normalizeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const k of keywords.map(k => k.trim()).filter(Boolean)) {
    const lower = k.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(k);
    }
    if (result.length >= 50) break;
  }
  return result;
}


