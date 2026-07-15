import Link from 'next/link';
import { getAllCalculators, getAllCategories } from '@/lib/db-helpers';
import type { Calculator, Category } from '@/lib/types';

// ISR: кэш 5 минут вместо force-dynamic (#9, #41)
export const revalidate = 300;

export default async function HomePage() {
  const [calculators, categories] = await Promise.all([
    getAllCalculators(),
    getAllCategories(),
  ]);

  const calculatorsByCategory = categories.map(cat => ({
    ...cat,
    items: calculators.filter((calc: Calculator) => calc.category === cat.id)
  })).filter(cat => cat.items.length > 0);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Шапка (#21: logo — не h1, а span) */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-neutral-900 rounded-none flex items-center justify-center">
              <span className="text-white text-xl font-bold">=</span>
            </div>
            <div>
              <span className="text-xl font-bold text-neutral-900">Calculandia</span>
              <p className="text-xs text-neutral-500">Калькуляторы для расчётов</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-4 text-sm text-neutral-600">
            {calculatorsByCategory.slice(0, 3).map(cat => (
              <span key={cat.id} className="text-neutral-500">{cat.name}</span>
            ))}
          </nav>
        </div>
      </header>

      {/* Главная страница */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              Онлайн калькуляторы
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Простые и удобные калькуляторы для математических и финансовых расчётов
            </p>
          </div>

          {/* Категории с калькуляторами */}
          <div className="space-y-12">
            {calculatorsByCategory.map(category => (
              <section key={category.id}>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((calc: Calculator) => (
                    <Link
                      key={calc.id}
                      href={`/calculator/${calc.slug || calc.id}`}
                      className="block bg-white p-6 border-2 border-neutral-300 shadow-sm rounded-none hover:border-neutral-900 transition-colors"
                    >
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                        {calc.name}
                      </h3>
                      {calc.description && (
                        <p className="text-neutral-600 text-sm">
                          {calc.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      {/* Футер (#22: убраны мёртвые ссылки, #23: динамический год, #24: убрана ссылка на админку) */}
      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-neutral-600">
              © {currentYear} Calculandia.ru — Калькуляторы онлайн
            </div>
            <div className="flex items-center space-x-6 text-sm text-neutral-600">
              {calculatorsByCategory.flatMap(cat => cat.items).slice(0, 3).map((calc: Calculator) => (
                <Link key={calc.id} href={`/calculator/${calc.slug || calc.id}`} className="text-neutral-600 hover:text-neutral-900 transition-colors">
                  {calc.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
