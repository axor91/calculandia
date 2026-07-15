import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapDbCalculatorToApp } from '@/lib/db-helpers';
import createDOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import { calculatorUpdateSchema, normalizeKeywords } from '@/lib/validation';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/calculators/[id] - получить один калькулятор
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const calculator = await prisma.calculator.findUnique({
      where: { id },
    });

    if (!calculator) {
      return NextResponse.json(
        { error: 'Калькулятор не найден' },
        { status: 404 },
      );
    }

    const formattedCalculator = mapDbCalculatorToApp(
      calculator as unknown as Record<string, unknown>,
    );

    return NextResponse.json(formattedCalculator);
  } catch (error) {
    console.error('Ошибка при получении калькулятора:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 },
    );
  }
}

// PUT /api/calculators/[id] - обновить калькулятор
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const parsed = calculatorUpdateSchema.safeParse({ ...json, id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const body = parsed.data;
    const jsdomWindow = new JSDOM('').window as unknown as Window;
    const DOMPurify = createDOMPurify(jsdomWindow);

    // Санитизация HTML контента
    const contentBefore = body.content?.beforeCalculator
      ? DOMPurify.sanitize(body.content.beforeCalculator)
      : null;
    const contentAfter = body.content?.afterCalculator
      ? DOMPurify.sanitize(body.content.afterCalculator)
      : null;

    // Санитизация рекламного кода (пункт 38: ads code тоже через DOMPurify)
    const sanitizeAdCode = (code?: string) =>
      code ? DOMPurify.sanitize(code, { ADD_TAGS: ['script', 'iframe'], ADD_ATTR: ['src', 'async', 'defer'] }) : null;

    const calculator = await prisma.calculator.update({
      where: { id },
      data: {
        slug: body.slug ?? undefined,
        seoTitle: body.seo.title,
        seoDescription: body.seo.description,
        seoKeywords: JSON.stringify(normalizeKeywords(body.seo.keywords)),
        seoRobots: body.seo.robots ?? undefined,
        contentBefore,
        contentAfter,
        faq: body.content?.faq ? JSON.stringify(body.content.faq) : null,
        adsTopEnabled: body.ads?.topBanner?.enabled ?? false,
        adsTopCode: sanitizeAdCode(body.ads?.topBanner?.code),
        adsSidebarEnabled: body.ads?.sidebarBanner?.enabled ?? false,
        adsSidebarCode: sanitizeAdCode(body.ads?.sidebarBanner?.code),
        adsBottomEnabled: body.ads?.bottomBanner?.enabled ?? false,
        adsBottomCode: sanitizeAdCode(body.ads?.bottomBanner?.code),
        schemaTypes: body.schema?.types ? JSON.stringify(body.schema.types) : undefined,
        schemaExtra: body.schema?.extraJsonLd ?? undefined,
      },
    });

    return NextResponse.json({ success: true, calculator });
  } catch (error) {
    console.error('Ошибка при обновлении калькулятора:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении данных' },
      { status: 500 },
    );
  }
}
