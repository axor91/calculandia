import Link from 'next/link';
import { searchCalculators } from '@/lib/db-helpers';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CalculatorsList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (params.q as string) || '';
  const page = Number(params.page || 1);
  const pageSize = 20;
  const category = (params.category as string) || '';
  const sort = (params.sort as string) || 'createdAt';
  const order = (params.order as string) || 'asc';
  const data = await searchCalculators({ q, page, pageSize, category, sort: sort as any, order: order as any });

  return (
    <div className="bg-white border-2 border-neutral-300 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-neutral-900" suppressHydrationWarning>Калькуляторы</h2>
        <form action="/admin/calculators" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Поиск по названию/описанию"
            className="px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900"
          />
          <input name="category" defaultValue={category} placeholder="Категория (id)" className="px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" />
          <select name="sort" defaultValue={sort} className="px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900">
            <option value="createdAt">Создан</option>
            <option value="name">Название</option>
            <option value="id">ID</option>
          </select>
          <select name="order" defaultValue={order} className="px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900">
            <option value="asc">↑</option>
            <option value="desc">↓</option>
          </select>
          <button className="border-2 border-neutral-900 px-4 py-3 text-neutral-900 font-semibold">Найти</button>
        </form>
      </div>

      <div className="divide-y divide-neutral-200">
        {data.items?.map((c: any) => (
          <div key={c.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-900">{c.name}</div>
              <div className="text-xs text-neutral-600">{c.description}</div>
            </div>
            <Link href={`/admin/calculators/${c.id}/edit`} className="border-2 border-neutral-900 px-3 py-2 text-sm text-neutral-900">
              Редактировать
            </Link>
          </div>
        ))}
        {(!data.items || data.items.length === 0) && (
          <div className="py-8 text-sm text-neutral-600">Ничего не найдено</div>
        )}
      </div>

      <div className="mt-6 flex justify-between text-sm">
        <Link href={`/admin/calculators?q=${encodeURIComponent(q)}&page=${Math.max(1, page - 1)}`} className="text-neutral-700">
          ← Назад
        </Link>
        <Link href={`/admin/calculators?q=${encodeURIComponent(q)}&page=${page + 1}`} className="text-neutral-700">
          Вперёд →
        </Link>
      </div>
    </div>
  );
}


