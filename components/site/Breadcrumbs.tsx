import Link from "next/link";
import { siteOrigin } from "@/lib/site";
import JsonLd from "./JsonLd";

export type BreadcrumbItem = { label: string; href?: string };

export default function Breadcrumbs({
  items,
}: {
  items: readonly BreadcrumbItem[];
}) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(item.href ? { item: `${siteOrigin}${item.href}` } : {}),
          })),
        }}
      />
      <nav
        aria-label="Хлебные крошки"
        className="overflow-hidden text-sm text-muted"
      >
        <ol className="flex items-center gap-2 whitespace-nowrap">
          {items.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-2"
            >
              {index > 0 && (
                <span aria-hidden="true" className="text-line-strong">
                  /
                </span>
              )}
              {item.href ? (
                <Link href={item.href} className="truncate hover:text-teal">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate text-ink">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
