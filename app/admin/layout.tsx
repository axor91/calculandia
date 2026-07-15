'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { href: '/admin', label: 'Дашборд' },
    { href: '/admin/calculators', label: 'Калькуляторы' },
    { href: '/admin/seo-tools', label: 'SEO инструменты' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-none flex items-center justify-center">
                <span className="text-white text-xl font-bold">=</span>
              </div>
              <div>
                {/* (#21: h2, не h1 — h1 только для контента) */}
                <span className="text-xl font-bold text-neutral-900">Админка</span>
                <p className="text-xs text-neutral-500">Управление калькуляторами и SEO</p>
              </div>
            </Link>
            {/* Десктоп навигация (#30) */}
            <nav className="hidden md:flex items-center gap-4 text-sm">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname === item.href ? 'font-semibold text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/" className="text-neutral-600 hover:text-neutral-900">← На сайт</Link>
              <button onClick={handleLogout} className="text-neutral-600 hover:text-neutral-900">Выйти</button>
            </nav>
            {/* Бургер-меню (#29, #30) */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center text-neutral-900"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          {/* Мобильное меню */}
          {menuOpen && (
            <nav className="md:hidden mt-4 pt-4 border-t border-neutral-200 space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 text-sm ${pathname === item.href ? 'font-semibold text-neutral-900' : 'text-neutral-600'}`}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-neutral-600">← На сайт</Link>
              <button onClick={handleLogout} className="block py-2 text-sm text-neutral-600">Выйти</button>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
