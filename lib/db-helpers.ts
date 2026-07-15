import { prisma } from './prisma';
import type { Calculator, Category } from './types';

// Безопасный JSON.parse с fallback
export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Единый маппер: строка из БД → тип Calculator для UI/API.
 * Используется и в db-helpers, и в API routes (импортируется из этого файла).
 */
export function mapDbCalculatorToApp(calc: Record<string, unknown>): Calculator {
  return {
    id: calc.id as string,
    slug: (calc.slug as string) || undefined,
    name: calc.name as string,
    category: calc.category as string,
    description: calc.description as string,
    component: calc.component as string,
    seo: {
      title: calc.seoTitle as string,
      description: calc.seoDescription as string,
      keywords: safeJsonParse<string[]>(calc.seoKeywords as string, []),
      robots: (calc.seoRobots as string) || 'index,follow',
    },
    content: {
      beforeCalculator: (calc.contentBefore as string) || undefined,
      afterCalculator: (calc.contentAfter as string) || undefined,
      faq: safeJsonParse<Array<{ question: string; answer: string }> | undefined>(
        calc.faq as string | null,
        undefined,
      ),
    },
    ads: {
      topBanner: {
        enabled: (calc.adsTopEnabled as boolean) ?? false,
        code: (calc.adsTopCode as string) || undefined,
      },
      sidebarBanner: {
        enabled: (calc.adsSidebarEnabled as boolean) ?? false,
        code: (calc.adsSidebarCode as string) || undefined,
      },
      bottomBanner: {
        enabled: (calc.adsBottomEnabled as boolean) ?? false,
        code: (calc.adsBottomCode as string) || undefined,
      },
    },
    schema: {
      types: safeJsonParse<string[] | undefined>(calc.schemaTypes as string | null, undefined),
      extraJsonLd: (calc.schemaExtra as string) || undefined,
    },
  };
}

// Получить все калькуляторы из БД
export async function getAllCalculators(): Promise<Calculator[]> {
  try {
    const calculators = await prisma.calculator.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return calculators.map((calc) => mapDbCalculatorToApp(calc as unknown as Record<string, unknown>));
  } catch (error) {
    console.error('Ошибка загрузки калькуляторов из БД:', error);
    return [];
  }
}

// Получить один калькулятор по ID или slug
export async function getCalculatorById(idOrSlug: string): Promise<Calculator | null> {
  try {
    let calc = await prisma.calculator.findUnique({
      where: { id: idOrSlug },
    });
    if (!calc) {
      calc = await prisma.calculator.findUnique({
        where: { slug: idOrSlug },
      });
    }
    if (!calc) return null;
    return mapDbCalculatorToApp(calc as unknown as Record<string, unknown>);
  } catch (error) {
    console.error('Ошибка загрузки калькулятора из БД:', error);
    return null;
  }
}

// Поиск/пагинация калькуляторов (для админки)
export async function searchCalculators(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  category?: string;
  sort?: 'createdAt' | 'name' | 'id';
  order?: 'asc' | 'desc';
}): Promise<{ items: Calculator[]; total: number; page: number; pageSize: number }> {
  const q = (params.q || '').trim();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const category = (params.category || '').trim();
  const sort = params.sort || 'createdAt';
  const order = params.order || 'asc';
  try {
    // Строим where-условие вручную, чтобы не использовать mode: 'insensitive' (не работает в SQLite)
    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { id: { contains: q } },
      ];
    }
    if (category) where.category = category;

    const [total, rows] = await Promise.all([
      prisma.calculator.count({ where }),
      prisma.calculator.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((r) => mapDbCalculatorToApp(r as unknown as Record<string, unknown>)),
      total,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Ошибка поиска калькуляторов из БД:', error);
    return { items: [], total: 0, page, pageSize };
  }
}

// Получить категории из БД
export async function getAllCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map((c): Category => ({
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      icon: c.icon ?? undefined,
    }));
  } catch (error) {
    console.error('Ошибка загрузки категорий из БД:', error);
    return [];
  }
}
