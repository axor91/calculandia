import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import JsonLd from "@/components/site/JsonLd";
import YandexMetrika from "@/components/site/YandexMetrika";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: "Онлайн-калькуляторы — Calculandia",
    template: "%s — Calculandia",
  },
  description: siteConfig.description,
  authors: [{ name: "Calculandia" }],
  verification: {
    google: "qBTyNdqzxXsQ1fKy4oxJXutgXoyg-CieVb8OI_wt7h4",
    yandex: "e73a7b7a96145340",
  },
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
      <body className="flex min-h-dvh flex-col">
        <YandexMetrika />
        <a href="#main-content" className="skip-link">
          Перейти к содержанию
        </a>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.origin,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteConfig.name,
              url: siteConfig.origin,
              inLanguage: "ru-RU",
            },
          ]}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
