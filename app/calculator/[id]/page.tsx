import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getAllCalculators, getCalculatorById, getAllCategories } from '@/lib/db-helpers';
import type { Calculator, Category } from '@/lib/types';
import AdBanner from '@/components/AdBanner';
import ContentBlock from '@/components/ContentBlock';
import FAQ from '@/components/FAQ';
import ErrorBoundary from '@/components/ErrorBoundary';

// ISR: кэш 5 минут (#9, #41)
export const revalidate = 300;

// Lazy-load компонентов калькуляторов (#42: mathjs ~500KB не грузится для всех)
const PercentDiffCalculator = dynamic(() => import('@/components/PercentDiffCalculator'), {
  loading: () => <div className="text-neutral-400 text-sm py-8 text-center">Загрузка калькулятора...</div>,
});
const MortgageCalculator = dynamic(() => import('@/components/MortgageCalculator'), {
  loading: () => <div className="text-neutral-400 text-sm py-8 text-center">Загрузка калькулятора...</div>,
});
const FractionsCalculator = dynamic(() => import('@/components/FractionsCalculator'), {
  loading: () => <div className="text-neutral-400 text-sm py-8 text-center">Загрузка калькулятора...</div>,
});
const DaysCalculator = dynamic(() => import('@/components/DaysCalculator'), {
  loading: () => <div className="text-neutral-400 text-sm py-8 text-center">Загрузка калькулятора...</div>,
});
const EquationsSolver = dynamic(() => import('@/components/EquationsSolver'), {
  loading: () => <div className="text-neutral-400 text-sm py-8 text-center">Загрузка калькулятора...</div>,
});

// SEO метатеги (#60: baseUrl из env)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const calculator = await getCalculatorById(id);

  if (!calculator) {
    return { title: 'Калькулятор не найден' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calculandia.ru';
  const canonical = `${baseUrl}/calculator/${calculator.slug || calculator.id}`;
  const robots = calculator.seo?.robots || 'index,follow';

  return {
    title: calculator.seo.title,
    description: calculator.seo.description,
    keywords: calculator.seo.keywords,
    alternates: { canonical },
    robots,
    openGraph: {
      title: calculator.seo.title,
      description: calculator.seo.description,
      type: 'website',
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: calculator.seo.title,
      description: calculator.seo.description,
    },
  };
}

// Маппинг компонентов
const componentMap: Record<string, React.ComponentType> = {
  PercentDiffCalculator,
  MortgageCalculator,
  FractionsCalculator,
  DaysCalculator,
  EquationsSolver,
};

// (#55: используем полноценный ErrorBoundary из components)

export default async function CalculatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [calculator, allCalculators, categories] = await Promise.all([
    getCalculatorById(id),
    getAllCalculators(),
    getAllCategories(),
  ]);

  if (!calculator) {
    notFound();
  }

  // Канонизация: если пришли по старому id, редиректим на slug (#5 as any removed)
  const canonicalSegment = calculator.slug || calculator.id;
  if (id !== canonicalSegment) {
    redirect(`/calculator/${canonicalSegment}`);
  }

  const Component = componentMap[calculator.component];
  const category = categories.find(c => c.id === calculator.category);

  // Группировка калькуляторов по категориям для сайдбара
  const calculatorsByCategory = categories.map(cat => ({
    ...cat,
    items: allCalculators.filter((calc: Calculator) => calc.category === cat.id)
  })).filter(cat => cat.items.length > 0);

  const currentYear = new Date().getFullYear();

  // JSON-LD микроразметка
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calculandia.ru';
  const jsonLdParts: Record<string, unknown>[] = [];
  const selectedTypes = calculator.schema?.types;
  const extraJsonLd = calculator.schema?.extraJsonLd;

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

  if (selectedTypes?.includes('FAQPage') && calculator.content?.faq && calculator.content.faq.length > 0) {
    jsonLdParts.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: calculator.content.faq.map(q => ({
        '@type': 'Question',
        name: stripHtml(q.question),
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripHtml(q.answer),
        },
      })),
    });
  }

  if (selectedTypes?.includes('BreadcrumbList')) {
    jsonLdParts.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Главная',
          item: `${baseUrl}`,
        },
        category && {
          '@type': 'ListItem',
          position: 2,
          name: category.name,
          item: `${baseUrl}/calculator/${category.id}`,
        },
        {
          '@type': 'ListItem',
          position: category ? 3 : 2,
          name: calculator.name,
          item: `${baseUrl}/calculator/${calculator.slug || calculator.id}`,
        },
      ].filter(Boolean),
    });
  }

  if (extraJsonLd) {
    try {
      const parsed = JSON.parse(extraJsonLd);
      if (Array.isArray(parsed)) {
        parsed.forEach(p => jsonLdParts.push(p));
      } else {
        jsonLdParts.push(parsed);
      }
    } catch {
      // игнорируем невалидный JSON-LD
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Шапка (#21: один h1 ниже, logo — span) */}
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
          {/* Десктоп навигация */}
          <nav className="hidden md:flex items-center space-x-4 text-sm">
            {calculatorsByCategory.map(cat => (
              <span key={cat.id} className="text-neutral-500 text-xs uppercase tracking-wide">{cat.name}</span>
            ))}
          </nav>
          {/* Мобильное меню (#29: бургер-кнопка) */}
          <details className="md:hidden relative">
            <summary className="w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-900 list-none">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute right-0 top-12 bg-white border-2 border-neutral-300 shadow-lg z-50 w-64 max-h-[80vh] overflow-y-auto">
              {calculatorsByCategory.map(cat => (
                <div key={cat.id} className="p-3">
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{cat.name}</div>
                  {cat.items.map((calc: Calculator) => (
                    <Link
                      key={calc.id}
                      href={`/calculator/${calc.slug || calc.id}`}
                      className={`block px-3 py-2 text-sm ${calc.id === calculator.id
                        ? 'font-semibold text-neutral-900 bg-neutral-100'
                        : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                    >
                      {calc.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            {/* Десктоп меню */}
            <aside className="hidden lg:block w-64 bg-white border-r border-neutral-200 min-h-screen">
              <div className="p-4 sticky top-0">
                <nav className="space-y-6">
                  {calculatorsByCategory.map(cat => (
                    <div key={cat.id}>
                      <h2 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                        {cat.name}
                      </h2>
                      <div className="space-y-1">
                        {cat.items.map((calc: Calculator) => (
                          <Link
                            key={calc.id}
                            href={`/calculator/${calc.slug || calc.id}`}
                            className={`block w-full text-left px-3 py-2 text-sm border-l-2 ${calc.id === calculator.id
                              ? 'font-semibold border-neutral-900 text-neutral-900'
                              : 'text-neutral-600 border-neutral-200 hover:border-neutral-400'
                              }`}
                          >
                            {calc.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Контент калькулятора + реклама */}
            <div className="flex-1 flex gap-8 p-4 md:p-8">
              {/* Основной контент */}
              <main className="flex-1 max-w-3xl">
                {jsonLdParts.length > 0 && (
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdParts.length === 1 ? jsonLdParts[0] : jsonLdParts) }}
                  />
                )}
                {/* Хлебные крошки */}
                <nav className="text-sm mb-6 text-neutral-600" aria-label="Breadcrumb">
                  <Link href="/" className="hover:text-neutral-900 transition-colors">Главная</Link>
                  <span className="mx-2">/</span>
                  <span>{category?.name}</span>
                  <span className="mx-2">/</span>
                  <span className="text-neutral-900">{calculator.name}</span>
                </nav>

                {/* Заголовок (#21: единственный h1 на странице) */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    {calculator.name}
                  </h1>
                  <p className="text-neutral-600">{calculator.description}</p>
                </div>

                {/* Контент перед калькулятором (#18: убран rounded-xl) */}
                {calculator.content?.beforeCalculator && (
                  <ContentBlock
                    html={calculator.content.beforeCalculator}
                    className="mb-8 bg-neutral-50 p-6"
                  />
                )}

                {/* Верхний рекламный баннер */}
                {calculator.ads?.topBanner?.enabled && (
                  <div className="mb-8 flex justify-center">
                    <AdBanner
                      code={calculator.ads.topBanner.code}
                      size="728x90"
                    />
                  </div>
                )}

                {/* Калькулятор (#55: error boundary) */}
                <div className="bg-white p-6 sm:p-8 border-2 border-neutral-300 shadow-sm mb-8">
                  <ErrorBoundary label={calculator.name}>
                    {Component && <Component />}
                  </ErrorBoundary>
                </div>

                {/* Контент после калькулятора */}
                {calculator.content?.afterCalculator && (
                  <div className="bg-white p-6 sm:p-8 border-2 border-neutral-300 shadow-sm mb-8">
                    <ContentBlock html={calculator.content.afterCalculator} />
                  </div>
                )}

                {/* FAQ */}
                {calculator.content?.faq && calculator.content.faq.length > 0 && (
                  <div className="mb-8">
                    <FAQ items={calculator.content.faq} />
                  </div>
                )}

                {/* Нижний рекламный баннер */}
                {calculator.ads?.bottomBanner?.enabled && (
                  <div className="mb-8 flex justify-center">
                    <AdBanner
                      code={calculator.ads.bottomBanner.code}
                      size="728x90"
                    />
                  </div>
                )}
              </main>

              {/* Боковая реклама (desktop) */}
              {calculator.ads?.sidebarBanner?.enabled && (
                <aside className="hidden xl:block flex-shrink-0">
                  <div className="sticky top-8">
                    <AdBanner
                      code={calculator.ads.sidebarBanner.code}
                      size="300x600"
                    />
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Футер (#23: динамический год, #22: нет мёртвых ссылок, #24: нет ссылки на админку) */}
      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-neutral-600">
              © {currentYear} Calculandia.ru — Калькуляторы онлайн
            </div>
            <div className="flex items-center space-x-6 text-sm text-neutral-600">
              {allCalculators.slice(0, 3).map((calc: Calculator) => (
                <Link key={calc.id} href={`/calculator/${calc.slug || calc.id}`} className="hover:text-neutral-900 transition-colors">{calc.name}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
