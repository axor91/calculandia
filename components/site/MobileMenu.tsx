"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { CategoryDefinition } from "@/catalog";

export default function MobileMenu({
  categories,
}: {
  categories: readonly CategoryDefinition[];
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      className="relative ml-auto md:hidden"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-ink"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          aria-hidden="true"
        >
          {open ? (
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>
      {open ? (
        <nav
          id={menuId}
          aria-label="Мобильная навигация"
          className="absolute right-0 top-13 w-[min(320px,calc(100vw-32px))] rounded-2xl border border-line bg-white p-3 shadow-[0_22px_70px_rgba(20,32,29,0.18)]"
        >
          <Link
            href="/kalkulyatory"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-xl px-3 font-bold text-ink hover:bg-canvas"
          >
            Все калькуляторы
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/kalkulyatory/${category.slug}`}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-xl px-3 text-sm text-muted hover:bg-canvas hover:text-ink"
            >
              {category.name}
            </Link>
          ))}
          <div className="my-2 border-t border-line" />
          <Link
            href="/metodologiya"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-xl px-3 text-sm text-muted hover:bg-canvas hover:text-ink"
          >
            Как проверяем расчёты
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
