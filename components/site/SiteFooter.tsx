import Link from "next/link";
import { categories } from "@/catalog";
import Container from "./Container";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <Container className="py-10 sm:py-12">
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              Бесплатные онлайн-калькуляторы с формулами, примерами и честными
              ограничениями.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-ink">Категории</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    className="inline-flex min-h-8 items-center hover:text-teal"
                    href={`/kalkulyatory/${category.slug}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-ink">О проекте</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              <li>
                <Link
                  className="inline-flex min-h-8 items-center hover:text-teal"
                  href="/o-proekte"
                >
                  О Calculandia
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-8 items-center hover:text-teal"
                  href="/metodologiya"
                >
                  Методология
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-8 items-center hover:text-teal"
                  href="/istochniki"
                >
                  Источники
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-8 items-center hover:text-teal"
                  href="/politika-konfidencialnosti"
                >
                  Конфиденциальность
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-8 items-center hover:text-teal"
                  href="/kontakty"
                >
                  Контакты
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-5 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Calculandia.ru</p>
          <p>
            Результаты финансовых и строительных расчётов носят справочный
            характер.
          </p>
        </div>
      </Container>
    </footer>
  );
}
