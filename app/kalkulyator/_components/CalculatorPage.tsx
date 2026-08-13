import Link from "next/link";
import type { Metadata } from "next";
import {
  getCalculator,
  getCategory,
  getRelatedCalculators,
  type ContentSection,
  type CalculatorSlug,
} from "@/catalog";
import CalculatorRunner from "@/components/calculator/CalculatorRunner";
import AdSlot from "@/components/site/AdSlot";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import CalculatorCard from "@/components/site/CalculatorCard";
import Container from "@/components/site/Container";
import JsonLd from "@/components/site/JsonLd";
import { adBlockId } from "@/lib/ads";
import { createPageMetadata } from "@/lib/page-metadata";

const canonicalOrigin = "https://calculandia.ru";

function requireCalculator(slug: CalculatorSlug) {
  const calculator = getCalculator(slug);
  if (!calculator)
    throw new Error(`Static calculator route is missing: ${slug}`);
  return calculator;
}

export function createCalculatorMetadata(slug: CalculatorSlug): Metadata {
  const calculator = requireCalculator(slug);
  return createPageMetadata(
    calculator.seo.title,
    calculator.seo.description,
    calculator.path,
  );
}

export default function CalculatorPage({ slug }: { slug: CalculatorSlug }) {
  const calculator = requireCalculator(slug);
  const category = getCategory(calculator.category)!;
  const related = getRelatedCalculators(calculator.related);
  const sections = calculator.sections as readonly ContentSection[];
  const formulas = calculator.formulas ?? [
    { label: "Основная формула", expression: calculator.formula },
  ];
  // Реклама стоит после расчёта и после статьи: до результата она перекрывала бы
  // то, ради чего страницу открыли. Блоков нет — не будет и разметки под них.
  const topAdBlockId = adBlockId("calculatorTop");
  const bottomAdBlockId = adBlockId("calculatorBottom");
  const breadcrumbs = [
    { label: "Главная", href: "/" },
    { label: "Калькуляторы", href: "/kalkulyatory" },
    { label: category.name, href: `/kalkulyatory/${category.slug}` },
    { label: calculator.name },
  ];

  return (
    <main id="main-content" className="flex-1">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: calculator.name,
          description: calculator.seo.description,
          url: `${canonicalOrigin}${calculator.path}`,
          applicationCategory: "CalculatorApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
          isPartOf: {
            "@type": "WebSite",
            name: "Calculandia",
            url: canonicalOrigin,
          },
          dateModified: calculator.contentUpdatedAt,
        }}
      />
      <Container className="py-8 sm:py-12">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-8 max-w-4xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal">
            {calculator.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl lg:text-6xl">
            {calculator.name}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted sm:text-xl">
            {calculator.lead}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted">
            <span>Формула {calculator.formulaVersion}</span>
            <span>Проверено {calculator.formulaReviewedAt}</span>
            <a
              href="#sources"
              className="text-teal underline decoration-teal/30 underline-offset-4 hover:text-teal-dark"
            >
              Источники и допущения
            </a>
          </div>
        </div>
      </Container>

      <Container className="pb-12 sm:pb-16">
        <CalculatorRunner component={calculator.component} />
        {topAdBlockId ? (
          <AdSlot blockId={topAdBlockId} className="mt-10 sm:mt-12" />
        ) : null}
      </Container>

      <Container className="pb-16 sm:pb-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
          <article className="rounded-[24px] border border-line bg-white p-6 sm:p-9">
            <div className="prose-calc">
              {sections.map((section) => (
                <section key={section.heading}>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul>
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
              <section>
                <h2>
                  {formulas.length > 1 ? "Формулы по режимам" : "Формула"}
                </h2>
                <div className="mt-3 grid gap-2">
                  {formulas.map((formula) => (
                    <div
                      key={formula.label}
                      className="rounded-xl bg-canvas px-4 py-3"
                    >
                      <strong className="block text-xs uppercase tracking-wide text-muted">
                        {formula.label}
                      </strong>
                      <code className="mt-1 block text-sm text-ink">
                        {formula.expression}
                      </code>
                    </div>
                  ))}
                </div>
                <p>{calculator.roundingPolicy}</p>
              </section>
              <section>
                <h2>Примеры расчёта</h2>
                <div className="mt-4 grid gap-3">
                  {calculator.examples.map((example) => (
                    <div
                      key={example.title}
                      className="rounded-xl border border-line p-4"
                    >
                      <h3 className="!mt-0">{example.title}</h3>
                      <p>{example.input}</p>
                      <p className="font-bold text-ink">
                        Ответ: {example.result}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h2>Частые вопросы</h2>
                <div className="mt-4 divide-y divide-line rounded-xl border border-line px-4">
                  {calculator.faq.map((item) => (
                    <details key={item.question} className="py-4">
                      <summary className="cursor-pointer font-bold text-ink">
                        {item.question}
                      </summary>
                      <p className="pb-1 pr-4">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            </div>
          </article>
          <aside
            id="sources"
            className="scroll-mt-24 rounded-[24px] border border-line bg-paper p-6 lg:sticky lg:top-24"
          >
            <h2 className="text-xl font-black tracking-[-0.025em] text-ink">
              Проверка расчёта
            </h2>
            <h3 className="mt-5 text-sm font-extrabold text-ink">Учитываем</h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
              {calculator.assumptions.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-extrabold text-ink">Источники</h3>
            <ul className="mt-2 space-y-3">
              {calculator.sources.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    rel="noreferrer"
                    target="_blank"
                    className="text-sm font-bold text-teal underline decoration-teal/25 underline-offset-4 hover:text-teal-dark"
                  >
                    {source.title} ↗
                  </a>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {source.note}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-muted">
              Источники проверены {calculator.sourceCheckedAt}.{" "}
              <Link href="/metodologiya" className="font-bold text-teal">
                Как мы проверяем формулы
              </Link>
            </p>
          </aside>
        </div>

        {bottomAdBlockId ? (
          <AdSlot blockId={bottomAdBlockId} className="mt-12" />
        ) : null}

        {related.length ? (
          <section className="mt-12">
            <h2 className="text-2xl font-black tracking-[-0.035em] text-ink">
              Другие калькуляторы
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <CalculatorCard key={item.slug} calculator={item} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
