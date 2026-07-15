import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Калькуляторы онлайн — Calculandia.ru',
  description: 'Простые и удобные онлайн калькуляторы для математических и финансовых расчётов. Бесплатные инструменты для повседневных вычислений.',
  keywords: ['калькулятор', 'онлайн', 'математика', 'финансы', 'расчёты', 'calculandia'],
  authors: [{ name: 'Calculandia' }],
  openGraph: {
    title: 'Калькуляторы онлайн — Calculandia.ru',
    description: 'Простые и удобные онлайн калькуляторы для математических и финансовых расчётов.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://calculandia.ru',
    siteName: 'Calculandia',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Калькуляторы онлайн — Calculandia.ru',
    description: 'Простые и удобные калькуляторы для математических и финансовых расчётов.',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://calculandia.ru'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
