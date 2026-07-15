import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  const [calculatorsCount, categoriesCount, latest] = await Promise.all([
    prisma.calculator.count(),
    prisma.category.count(),
    prisma.calculator.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, updatedAt: true, category: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-neutral-300 shadow-sm p-6">
        <h2 className="text-lg font-bold text-neutral-900 mb-4" suppressHydrationWarning>Дашборд админки</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-50 border-2 border-neutral-300 p-4">
            <div className="text-xs text-neutral-600">Калькуляторов</div>
            <div className="text-4xl font-bold text-neutral-900">{calculatorsCount}</div>
          </div>
          <div className="bg-neutral-50 border-2 border-neutral-300 p-4">
            <div className="text-xs text-neutral-600">Категорий</div>
            <div className="text-4xl font-bold text-neutral-900">{categoriesCount}</div>
          </div>
          <div className="bg-neutral-50 border-2 border-neutral-300 p-4">
            <div className="text-xs text-neutral-600">Быстрые действия</div>
            <div className="mt-2 flex gap-2">
              <Link href="/admin/calculators" className="border-2 border-neutral-900 px-3 py-2 text-sm text-neutral-900">Калькуляторы</Link>
              <Link href="/admin/seo-tools" className="border-2 border-neutral-900 px-3 py-2 text-sm text-neutral-900">SEO инструменты</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-neutral-300 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-neutral-900" suppressHydrationWarning>Недавние изменения</h3>
          <Link href="/admin/calculators" className="text-sm text-neutral-700">Все калькуляторы →</Link>
        </div>
        <div className="divide-y divide-neutral-200">
          {latest.map((c: { id: string; name: string; updatedAt: Date; category: string }) => (
            <div key={c.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-900">{c.name}</div>
                <div className="text-xs text-neutral-600">ID: {c.id} · Категория: {c.category}</div>
              </div>
              <Link href={`/admin/calculators/${c.id}/edit`} className="border-2 border-neutral-900 px-3 py-2 text-sm text-neutral-900">Редактировать</Link>
            </div>
          ))}
          {latest.length === 0 && (
            <div className="py-8 text-sm text-neutral-600">Нет изменений</div>
          )}
        </div>
      </div>
    </div>
  );
}


