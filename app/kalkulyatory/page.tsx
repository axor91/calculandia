import type { Metadata } from "next";
import { categories, getPublishedCalculators } from "@/catalog";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import CalculatorCard from "@/components/site/CalculatorCard";
import CatalogSearch, {
  type SearchItem,
} from "@/components/site/CatalogSearch";
import Container from "@/components/site/Container";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = createPageMetadata(
  "Все онлайн-калькуляторы",
  "Каталог из 14 математических, финансовых, календарных и строительных калькуляторов с формулами, примерами и объяснением результата.",
  "/kalkulyatory",
);

const publishedCalculators = getPublishedCalculators();
const searchItems: SearchItem[] = publishedCalculators.map((calculator) => ({
  slug: calculator.slug,
  path: calculator.path,
  name: calculator.name,
  description: calculator.shortDescription,
  category:
    categories.find((category) => category.id === calculator.category)
      ?.shortName || "",
  aliases: calculator.aliases,
}));

export default function CatalogPage() {
  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8 sm:py-12">
        <Breadcrumbs
          items={[{ label: "Главная", href: "/" }, { label: "Калькуляторы" }]}
        />
        <div className="mt-8 max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal">
            14 инструментов
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
            Каталог калькуляторов
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            Найдите задачу по названию или просмотрите четыре группы. Все ссылки
            доступны и без поиска.
          </p>
        </div>
        <div className="mt-8">
          <CatalogSearch items={searchItems} />
        </div>
      </Container>

      <Container className="pb-16 sm:pb-20">
        <div className="space-y-14">
          {categories.map((category) => {
            const items = publishedCalculators.filter(
              (calculator) => calculator.category === category.id,
            );
            return (
              <section
                key={category.id}
                aria-labelledby={`category-${category.id}`}
                className="scroll-mt-28"
              >
                <div className="flex flex-col justify-between gap-3 border-b border-line pb-5 sm:flex-row sm:items-end">
                  <div>
                    <h2
                      id={`category-${category.id}`}
                      className="text-2xl font-black tracking-[-0.03em] text-ink"
                    >
                      {category.name}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                      {category.description}
                    </p>
                  </div>
                  <a
                    href={`/kalkulyatory/${category.slug}`}
                    className="text-sm font-bold text-teal hover:text-teal-dark"
                  >
                    О категории →
                  </a>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((calculator) => (
                    <CalculatorCard
                      key={calculator.slug}
                      calculator={calculator}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
