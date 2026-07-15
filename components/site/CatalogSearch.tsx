"use client";

import { useId, useMemo, useRef, useState } from "react";

export type SearchItem = {
  slug: string;
  path: string;
  name: string;
  description: string;
  category: string;
  aliases: readonly string[];
};

function normalize(value: string): string {
  return value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е").trim();
}

function rank(item: SearchItem, query: string): number {
  const normalizedName = normalize(item.name);
  const aliases = item.aliases.map(normalize);
  const haystack = normalize(
    `${item.name} ${item.description} ${item.category} ${item.aliases.join(" ")}`,
  );
  const tokens = query.split(/\s+/).filter(Boolean);

  if (normalizedName === query || aliases.includes(query)) return 100;
  if (
    normalizedName.startsWith(query) ||
    aliases.some((alias) => alias.startsWith(query))
  )
    return 80;
  if (tokens.every((token) => haystack.includes(token)))
    return 50 + tokens.length;
  return 0;
}

export default function CatalogSearch({
  items,
  variant = "hero",
}: {
  items: readonly SearchItem[];
  variant?: "hero" | "header";
}) {
  const inputId = useId();
  const listboxId = `${inputId}-results`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = normalize(query);

  const results = useMemo(() => {
    if (!normalizedQuery)
      return variant === "hero"
        ? items.filter((item) =>
            [
              "procent-ot-chisla",
              "ipoteka",
              "dni-mezhdu-datami",
              "beton",
            ].includes(item.slug),
          )
        : [];
    return items
      .map((item) => ({ item, score: rank(item, normalizedQuery) }))
      .filter(({ score }) => score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.item.name.localeCompare(b.item.name, "ru"),
      )
      .slice(0, 7)
      .map(({ item }) => item);
  }, [items, normalizedQuery, variant]);

  const isOpen = open && (normalizedQuery.length > 0 || variant === "hero");

  function moveActive(direction: 1 | -1) {
    if (results.length === 0) return;
    setActiveIndex((current) => {
      if (current < 0) return direction === 1 ? 0 : results.length - 1;
      return (current + direction + results.length) % results.length;
    });
  }

  return (
    <div
      className={`relative ${variant === "header" ? "w-full max-w-[360px]" : "w-full max-w-[680px]"}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          setActiveIndex(-1);
          inputRef.current?.focus();
        }
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Найти калькулятор
      </label>
      <span
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <circle
            cx="11"
            cy="11"
            r="6.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m16 16 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={query}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        placeholder={
          variant === "header"
            ? "Найти калькулятор"
            : "Например, проценты, ипотека или плитка"
        }
        className={`w-full border border-line-strong bg-white pl-12 pr-11 text-ink shadow-[0_8px_30px_rgba(20,32,29,0.07)] transition focus:border-teal focus:ring-4 focus:ring-teal/10 ${variant === "header" ? "h-11 rounded-xl text-sm" : "h-15 rounded-2xl text-base sm:text-lg"}`}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            moveActive(1);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            moveActive(-1);
          }
          if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
          if (event.key === "Enter" && results.length > 0) {
            event.preventDefault();
            window.location.assign(results[Math.max(0, activeIndex)].path);
          }
        }}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setActiveIndex(-1);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-xl text-muted hover:bg-canvas hover:text-ink"
          aria-label="Очистить поиск"
        >
          ×
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-[0_22px_70px_rgba(20,32,29,0.16)]">
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Результаты поиска"
            className="max-h-[min(430px,65vh)] overflow-y-auto"
          >
            {results.map((item, index) => (
              <li
                key={item.slug}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => window.location.assign(item.path)}
                className="cursor-pointer"
              >
                <div
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex min-h-14 items-start justify-between gap-4 rounded-xl px-3 py-3 ${activeIndex === index ? "bg-mint/40" : "hover:bg-canvas"}`}
                >
                  <span>
                    <span className="block font-bold text-ink">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 text-muted">
                      {item.description}
                    </span>
                  </span>
                  <span className="mt-1 shrink-0 text-xs font-semibold text-teal">
                    {item.category}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <div className="px-4 py-5">
              <p className="font-bold text-ink">Ничего не найдено</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Попробуйте название задачи или выберите категорию.
              </p>
              <nav
                aria-label="Категории при пустом поиске"
                className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-sm font-bold text-teal"
              >
                <a href="/kalkulyatory/matematika">Математика</a>
                <a href="/kalkulyatory/finansy">Финансы</a>
                <a href="/kalkulyatory/data-i-vremya">Дата и время</a>
                <a href="/kalkulyatory/stroitelstvo">Строительство</a>
                <a href="/kontakty">Предложить калькулятор</a>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
