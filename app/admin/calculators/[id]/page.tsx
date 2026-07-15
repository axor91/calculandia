import Link from 'next/link';
import { getCalculatorById } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CalculatorEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const calculator = await getCalculatorById(id);
  if (!calculator) {
    return (
      <div className="bg-white border-2 border-neutral-300 shadow-sm p-6">Калькулятор не найден</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">{calculator.name}</h2>
        <Link href="/admin/calculators" className="text-sm text-neutral-700">← Назад к списку</Link>
      </div>

      <div className="bg-white border-2 border-neutral-300 shadow-sm p-6">
        <div className="text-sm text-neutral-600 mb-4">ID: {calculator.id}</div>
        <div className="text-sm text-neutral-600 mb-4">Категория: {calculator.category}</div>
        <div className="text-sm text-neutral-600 mb-4">Компонент: {calculator.component}</div>
        <Link href={`/admin`} className="border-2 border-neutral-900 px-4 py-3 text-neutral-900 inline-block">Открыть форму редактирования</Link>
      </div>
    </div>
  );
}


