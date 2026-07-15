import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories - получить все категории
export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 }
    );
  }
}

