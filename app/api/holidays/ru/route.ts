import { NextRequest, NextResponse } from 'next/server';
import { ensureRuHolidaysYear } from '@/lib/holidays-ru';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || '', 10);
    if (!Number.isFinite(year) || year < 1970 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }
    await ensureRuHolidaysYear(year);
    const list = await prisma.ruHoliday.findMany({
      where: { year },
      select: { date: true, isWorking: true },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}


