import type { Metadata } from "next";
import {
  getCategory,
  getCategoryCalculators,
  type CategoryId,
} from "@/catalog";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import CalculatorCard from "@/components/site/CalculatorCard";
import CategoryMark from "@/components/site/CategoryMark";
import Container from "@/components/site/Container";
import { createPageMetadata } from "@/lib/page-metadata";

function requireCategory(id: CategoryId) {
  const category = getCategory(id);
  if (!category)
    throw new Error(`Static category route is missing from catalog: ${id}`);
  return category;
}

export function createCategoryMetadata(id: CategoryId): Metadata {
  const category = requireCategory(id);
  return createPageMetadata(
    `Калькуляторы: ${category.name.toLocaleLowerCase("ru-RU")}`,
    `${category.intro} Откройте проверяемые онлайн-калькуляторы Calculandia.`,
    `/kalkulyatory/${category.slug}`,
  );
}

export default function CategoryPage({ id }: { id: CategoryId }) {
  const category = requireCategory(id);
  const calculators = getCategoryCalculators(id);

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Калькуляторы", href: "/kalkulyatory" },
            { label: category.name },
          ]}
        />
        <div className="mt-9 flex max-w-4xl items-start gap-5">
          <CategoryMark category={category.id} className="h-14 w-14 shrink-0" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal">
              {calculators.length}{" "}
              {calculators.length === 4 ? "калькулятора" : "калькулятора"}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
              {category.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
              {category.intro}
            </p>
          </div>
        </div>
      </Container>
      <Container className="pb-14 sm:pb-20">
        <h2 className="mb-5 text-2xl font-black tracking-[-0.03em] text-ink">
          Калькуляторы категории
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {calculators.map((calculator) => (
            <CalculatorCard key={calculator.slug} calculator={calculator} />
          ))}
        </div>
        <section className="mt-10 grid gap-6 rounded-[24px] border border-line bg-white p-6 sm:p-8 lg:grid-cols-[1fr_.9fr]">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.03em] text-ink">
              {category.guide.title}
            </h2>
            {category.guide.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-7 text-muted">
                {paragraph}
              </p>
            ))}
            <p className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm leading-6 text-muted">
              <strong className="text-ink">Граница расчёта:</strong>{" "}
              {category.guide.limitation}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-ink">Перед расчётом</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-muted">
              {category.guide.tips.map((tip) => (
                <li key={tip}>— {tip}</li>
              ))}
            </ul>
          </div>
        </section>
        <section className="mt-12 rounded-[24px] border border-line bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-ink">
            Как устроены расчёты
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            Каждый калькулятор публикуется с версией формулы, рабочими
            примерами, допущениями и датой проверки. Введённые значения
            обрабатываются в браузере и не отправляются в аналитику.
          </p>
          <a
            href="/metodologiya"
            className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-teal hover:text-teal-dark"
          >
            Читать методологию →
          </a>
        </section>
      </Container>
    </main>
  );
}
