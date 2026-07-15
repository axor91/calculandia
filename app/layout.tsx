import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: "Онлайн-калькуляторы — Calculandia",
    template: "%s — Calculandia",
  },
  description: siteConfig.description,
  authors: [{ name: "Calculandia" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Онлайн-калькуляторы — Calculandia",
    description: siteConfig.description,
    type: "website",
    url: siteConfig.origin,
    siteName: siteConfig.name,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Онлайн-калькуляторы — Calculandia",
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
