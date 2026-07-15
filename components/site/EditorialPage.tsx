import type { Metadata } from "next";
import Breadcrumbs from "./Breadcrumbs";
import Container from "./Container";
import { createPageMetadata } from "@/lib/page-metadata";

export function editorialMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return createPageMetadata(title, description, path);
}

export default function EditorialPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="flex-1">
      <Container className="py-8 sm:py-12">
        <Breadcrumbs
          items={[{ label: "Главная", href: "/" }, { label: title }]}
        />
        <header className="mt-9 max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">{intro}</p>
        </header>
        <article className="prose-calc mt-10 max-w-3xl rounded-[24px] border border-line bg-white p-6 sm:p-9">
          {children}
        </article>
      </Container>
    </main>
  );
}
