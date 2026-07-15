import Link from "next/link";
import { categories, getPublishedCalculators } from "@/lib/catalog";

export default function HomePage() {
  const calculators = getPublishedCalculators();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Calculandia — главная"
          >
            <span
              className="flex h-10 w-10 items-center justify-center bg-neutral-900 text-xl font-bold text-white"
              aria-hidden="true"
            >
              =
            </span>
            <span>
              <span className="block text-xl font-bold text-neutral-900">
                Calculandia
              </span>
              <span className="block text-xs text-neutral-500">
                Калькуляторы для расчётов
              </span>
            </span>
          </Link>
          <nav
            aria-label="Основная навигация"
            className="hidden items-center gap-5 text-sm text-neutral-700 md:flex"
          >
            <a href="#catalog">Калькуляторы</a>
            <a href="#about">О подходе</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Расчёт без лишнего шума
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
              Онлайн-калькуляторы с понятным результатом
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
              Математические и финансовые инструменты для предварительной
              оценки. Формулы и содержание проходят подготовку к первому
              production-релизу.
            </p>
          </div>
        </section>

        <section
          id="catalog"
          className="mx-auto max-w-7xl scroll-mt-6 px-4 pb-16 sm:px-6 lg:px-8"
        >
          <h2 className="text-2xl font-bold text-neutral-950">Каталог</h2>
          <div className="mt-8 space-y-12">
            {categories.map((category) => {
              const items = calculators.filter(
                (calculator) => calculator.category === category.id,
              );
              if (items.length === 0) return null;

              return (
                <section
                  key={category.id}
                  aria-labelledby={`category-${category.id}`}
                >
                  <div className="mb-5 max-w-2xl">
                    <h3
                      id={`category-${category.id}`}
                      className="text-lg font-bold text-neutral-900"
                    >
                      {category.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      {category.description}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((calculator) => (
                      <Link
                        key={calculator.id}
                        href={`/calculator/${calculator.slug}`}
                        className="border border-neutral-300 bg-white p-5 transition-colors hover:border-neutral-900 focus-visible:border-neutral-900"
                      >
                        <span className="block font-semibold text-neutral-950">
                          {calculator.name}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-neutral-600">
                          {calculator.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section id="about" className="border-y border-neutral-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-neutral-950">
              Что меняется перед запуском
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-neutral-600">
              Публичный каталог больше не зависит от базы данных и
              административной панели. Каждый расчёт получает формальную
              спецификацию, граничные тесты и проверяемые примеры до индексации.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-950 text-neutral-300">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm sm:px-6 lg:px-8">
          © {currentYear} Calculandia.ru
        </div>
      </footer>
    </div>
  );
}
