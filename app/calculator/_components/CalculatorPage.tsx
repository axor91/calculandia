import type { Metadata } from "next";
import Link from "next/link";
import DaysCalculator from "@/components/DaysCalculator";
import ErrorBoundary from "@/components/ErrorBoundary";
import FractionsCalculator from "@/components/FractionsCalculator";
import MortgageCalculator from "@/components/MortgageCalculator";
import PercentDiffCalculator from "@/components/PercentDiffCalculator";
import {
  getCalculator,
  getCategory,
  getPublishedCalculators,
} from "@/lib/catalog";
import { siteOrigin } from "@/lib/site";
import type { CalculatorComponentId } from "@/lib/types";

const componentMap: Record<CalculatorComponentId, React.ComponentType> = {
  PercentDiffCalculator,
  MortgageCalculator,
  FractionsCalculator,
  DaysCalculator,
};

function requireCalculator(slug: string) {
  const calculator = getCalculator(slug);
  if (!calculator) {
    throw new Error(`Static calculator route is missing from catalog: ${slug}`);
  }
  return calculator;
}

export function createCalculatorMetadata(slug: string): Metadata {
  const calculator = requireCalculator(slug);
  const canonical = `${siteOrigin}/calculator/${calculator.slug}`;

  return {
    title: calculator.seo.title,
    description: calculator.seo.description,
    alternates: { canonical },
    openGraph: {
      title: calculator.seo.title,
      description: calculator.seo.description,
      type: "website",
      url: canonical,
    },
  };
}

export default function CalculatorPage({ slug }: { slug: string }) {
  const calculator = requireCalculator(slug);
  const category = getCategory(calculator.category);
  const Component = componentMap[calculator.component];
  const related = getPublishedCalculators().filter(
    (item) =>
      item.category === calculator.category && item.id !== calculator.id,
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-bold text-neutral-950">
            Calculandia
          </Link>
          <Link
            href="/#catalog"
            className="text-sm text-neutral-700 hover:text-neutral-950"
          >
            Все калькуляторы
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <nav
          aria-label="Хлебные крошки"
          className="mb-6 text-sm text-neutral-600"
        >
          <Link href="/" className="hover:text-neutral-950">
            Главная
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span>{category?.name}</span>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span aria-current="page" className="text-neutral-950">
            {calculator.name}
          </span>
        </nav>

        <header className="mb-7 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            {calculator.name}
          </h1>
          <p className="mt-3 text-lg leading-7 text-neutral-600">
            {calculator.description}
          </p>
        </header>

        <section
          aria-label={calculator.name}
          className="border border-neutral-300 bg-white p-5 shadow-sm sm:p-8"
        >
          <ErrorBoundary label={calculator.name}>
            <Component />
          </ErrorBoundary>
        </section>

        {related.length > 0 && (
          <section className="mt-10" aria-labelledby="related-title">
            <h2
              id="related-title"
              className="text-xl font-bold text-neutral-950"
            >
              Похожие инструменты
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/calculator/${item.slug}`}
                  className="border border-neutral-300 bg-white p-4 hover:border-neutral-900"
                >
                  <span className="font-semibold text-neutral-950">
                    {item.name}
                  </span>
                  <span className="mt-1 block text-sm text-neutral-600">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
