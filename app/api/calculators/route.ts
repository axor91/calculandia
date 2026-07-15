import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapDbCalculatorToApp } from '@/lib/db-helpers';

// GET /api/calculators - получить все калькуляторы
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const category = (searchParams.get('category') || '').trim();
    const sort = (searchParams.get('sort') || 'createdAt') as 'createdAt' | 'name' | 'id';
    const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc';

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { id: { contains: q } },
      ];
    }
    if (category) where.category = category;

    const [total, calculators] = await Promise.all([
      prisma.calculator.count({ where }),
      prisma.calculator.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const formattedCalculators = calculators.map((calc) =>
      mapDbCalculatorToApp(calc as unknown as Record<string, unknown>),
    );

    return NextResponse.json({ items: formattedCalculators, total, page, pageSize });
  } catch (error) {
    console.error('Ошибка при получении калькуляторов:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 },
    );
  }
}
