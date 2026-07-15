import Link from "next/link";
import { categories, getPublishedCalculators } from "@/catalog";
import CatalogSearch, { type SearchItem } from "./CatalogSearch";
import Container from "./Container";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";

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

export default function SiteHeader() {
  const items = searchItems();
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/95 backdrop-blur-xl">
      <Container className="flex min-h-[72px] items-center gap-5">
        <Logo />
        <div className="ml-auto hidden flex-1 justify-center lg:flex">
          <CatalogSearch items={items} variant="header" />
        </div>
        <nav
          aria-label="Основная навигация"
          className="ml-auto hidden items-center gap-1 md:flex lg:ml-0"
        >
          <Link
            href="/kalkulyatory"
            className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-white"
          >
            Каталог
          </Link>
          <Link
            href="/metodologiya"
            className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-white"
          >
            Методология
          </Link>
        </nav>
        <MobileMenu categories={categories} />
      </Container>
    </header>
  );
}
