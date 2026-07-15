import Link from "next/link";
import { categories, getPublishedCalculators } from "@/catalog";
import CalculatorCard from "@/components/site/CalculatorCard";
import CatalogSearch, {
  type SearchItem,
} from "@/components/site/CatalogSearch";
import CategoryMark from "@/components/site/CategoryMark";
import Container from "@/components/site/Container";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata(
  "Онлайн-калькуляторы с формулами и примерами",
  "Понятные онлайн-калькуляторы для денег, дат, математики и ремонта — с формулами, примерами и ограничениями рядом с результатом.",
  "/",
);

function searchItems(): SearchItem[] {
  return getPublishedCalculators().map((calculator) => ({
    slug: calculator.slug,
    path: calculator.path,
    name: calculator.name,
    description: calculator.shortDescription,
    category:
      categories.find((category) => category.id === calculator.category)
        ?.shortName || "",
    aliases: calculator.aliases,
  }));
}

export default function HomePage() {
  const publishedCalculators = getPublishedCalculators();
  const featured = publishedCalculators.filter(
    (calculator) => "featured" in calculator && calculator.featured,
  );

  return (
    <main id="main-content" className="flex-1 overflow-hidden">
      <section className="relative border-b border-line">
        <div className="pointer-events-none absolute -right-32 -top-28 h-[420px] w-[420px] rounded-full bg-mint/65 blur-3xl" />
        <Container className="relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-white/75 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-teal">
              <span className="h-2 w-2 rounded-full bg-teal" /> 14 проверяемых
              инструментов
            </div>
            <h1 className="mt-6 max-w-4xl text-[clamp(2.65rem,7vw,5.2rem)] font-black leading-[0.96] tracking-[-0.058em] text-ink">
              Считайте.
              <br />
              <span className="text-teal">Понимайте</span> результат.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-xl sm:leading-8">
              Калькуляторы для денег, дат, математики и ремонта — с формулами,
              примерами и допущениями рядом с ответом.
            </p>
            <div className="mt-8">
              <CatalogSearch items={searchItems()} />
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <span>Без регистрации</span>
              <span>Расчёты остаются в браузере</span>
              <span>Адаптировано для телефона</span>
            </div>
          </div>

          <div
            className="relative mx-auto hidden w-full max-w-[430px] lg:block"
            aria-hidden="true"
          >
            <div className="rotate-2 rounded-[30px] border border-line bg-white p-7 shadow-[0_28px_90px_rgba(20,32,29,0.13)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted">
                  Ипотечный платёж
                </span>
                <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-teal-dark">
                  формула 1.0
                </span>
              </div>
              <p className="number-tabular mt-8 text-5xl font-black tracking-[-0.055em] text-ink">
                88 848,79 ₽
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-canvas p-4">
                  <span className="text-xs text-muted">Сумма</span>
                  <strong className="number-tabular mt-1 block text-lg text-ink">
                    1 000 000 ₽
                  </strong>
                </div>
                <div className="rounded-2xl bg-canvas p-4">
                  <span className="text-xs text-muted">Ставка</span>
                  <strong className="number-tabular mt-1 block text-lg text-ink">
                    12% годовых
                  </strong>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full w-[72%] rounded-full bg-teal" />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                Аннуитет, 12 месяцев. Комиссии и страховка не включены.
              </p>
            </div>
            <div className="absolute -bottom-6 -left-10 -rotate-3 rounded-2xl border border-amber-ink/10 bg-amber-soft px-5 py-4 shadow-lg">
              <strong className="block text-sm text-amber-ink">
                Формула видна
              </strong>
              <span className="text-xs text-amber-ink">
                результат можно проверить
              </span>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-18">
        <Container>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal">
                Выберите задачу
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">
                Четыре понятные категории
              </h2>
            </div>
            <Link
              href="/kalkulyatory"
              className="hidden min-h-11 items-center gap-2 text-sm font-bold text-teal hover:text-teal-dark sm:flex"
            >
              Весь каталог <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {categories.map((category) => {
              const count = publishedCalculators.filter(
                (calculator) => calculator.category === category.id,
              ).length;
              return (
                <Link
                  key={category.id}
                  href={`/kalkulyatory/${category.slug}`}
                  className="group flex min-h-40 items-start gap-5 rounded-[24px] border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:border-teal/35 hover:shadow-[0_18px_45px_rgba(20,32,29,0.08)]"
                >
                  <CategoryMark
                    category={category.id}
                    className="h-13 w-13 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-3">
                      <strong className="text-xl font-black tracking-[-0.025em] text-ink">
                        {category.name}
                      </strong>
                      <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-muted">
                        {count}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-muted">
                      {category.description}
                    </span>
                    <span className="mt-4 inline-flex text-sm font-bold text-teal">
                      Открыть категорию{" "}
                      <span className="ml-2 transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/kalkulyatory"
            className="mt-5 flex min-h-12 items-center justify-center rounded-xl border border-teal text-sm font-bold text-teal sm:hidden"
          >
            Открыть весь каталог
          </Link>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-14 sm:py-18">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal">
              Частые расчёты
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">
              Начните с популярного
            </h2>
            <p className="mt-3 leading-7 text-muted">
              Четыре разных типа задач — от мгновенной формулы до подробного
              графика.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((calculator) => (
              <CalculatorCard
                key={calculator.slug}
                calculator={calculator}
                compact
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal">
              Доверие к результату
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">
              Не чёрный ящик
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-muted">
              Мы показываем, что именно посчитано, где модель заканчивается и
              когда нужен официальный источник или специалист.
            </p>
            <Link
              href="/metodologiya"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-teal-dark"
            >
              Как мы проверяем формулы
            </Link>
          </div>
          <ol className="grid gap-3">
            {[
              [
                "01",
                "Формула и версия",
                "Изменение математической логики получает новую версию и набор golden-тестов.",
              ],
              [
                "02",
                "Допущения рядом",
                "Ставки, порядок операций, округление и исключённые факторы видны до интерпретации ответа.",
              ],
              [
                "03",
                "Ввод остаётся у вас",
                "Значения калькулятора не уходят на сервер и не попадают в аналитику или replay.",
              ],
            ].map(([number, title, text]) => (
              <li
                key={number}
                className="grid grid-cols-[44px_1fr] gap-4 rounded-2xl border border-line bg-white p-5"
              >
                <span className="text-sm font-black text-teal">{number}</span>
                <span>
                  <strong className="block text-lg text-ink">{title}</strong>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </main>
  );
}
