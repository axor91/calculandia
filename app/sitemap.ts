import { MetadataRoute } from 'next';
import { getAllCalculators } from '@/lib/db-helpers';
import type { Calculator } from '@/lib/types';

export const revalidate = 3600; // 1 час

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calculandia.ru';
  const now = new Date();

  // Получаем калькуляторы напрямую из БД
  const calculators = await getAllCalculators();

  // Главная страница
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  // Страницы калькуляторов (из БД) — используем slug, если есть (#58: админка убрана)
  calculators.forEach((calc: Calculator) => {
    const seg = calc.slug || calc.id;
    routes.push({
      url: `${baseUrl}/calculator/${seg}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  });

  // (#58: убрана /admin из sitemap — не должна индексироваться)
  return routes;
}
