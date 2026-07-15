
'use client';

import { useState, useEffect } from 'react';

type CalcItem = { id: string; slug?: string };

export default function SeoTools() {
  const [siteUrl, setSiteUrl] = useState<string>(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3212');
  const [robotsContent, setRobotsContent] = useState('');
  const [activeTab, setActiveTab] = useState<'sitemap' | 'robots'>('sitemap');
  const [calculators, setCalculators] = useState<CalcItem[]>([]);

  useEffect(() => {
    const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml`;
    setRobotsContent(robots);
  }, [siteUrl]);

  useEffect(() => {
    // (#12: API returns { items: [...] }, not array)
    const load = async () => {
      try {
        const res = await fetch('/api/calculators');
        if (!res.ok) throw new Error('Failed to load calculators');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        setCalculators(items.map((c: CalcItem) => ({ id: c.id, slug: c.slug })));
      } catch (e) {
        console.error(e);
        setCalculators([]);
      }
    };
    load();
  }, []);

  const generateSitemapXML = () => {
    const baseUrl = siteUrl;
    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Главная страница -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Калькуляторы -->`;

    calculators.forEach((calc) => {
      xml += `
  <url>
    <loc>${baseUrl}/calculator/${calc.slug || calc.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    return xml;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [copied, setCopied] = useState(false);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sitemapXML = generateSitemapXML();

  return (
    <div className="space-y-6">
      {/* Уведомление о копировании */}
      {copied && (
        <div className="fixed top-4 right-4 bg-neutral-900 text-white px-4 py-2 text-sm z-50 shadow-lg">
          ✅ Скопировано в буфер обмена
        </div>
      )}

      {/* Настройка URL сайта (#17: убраны rounded-lg, ring-primary, blue/yellow цвета) */}
      <div className="bg-neutral-50 p-4 border-2 border-neutral-300">
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          URL сайта
        </label>
        <input
          type="text"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          className="w-full px-4 py-2 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900"
          placeholder="https://example.com"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Базовый URL для генерации sitemap.xml и robots.txt
        </p>
      </div>

      {/* Вкладки */}
      <div className="border-b-2 border-neutral-300">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('sitemap')}
            className={`px-4 py-2 text-sm font-semibold ${activeTab === 'sitemap'
                ? 'text-neutral-900 border-b-2 border-neutral-900'
                : 'text-neutral-600'
              }`}
          >
            Sitemap.xml
          </button>
          <button
            onClick={() => setActiveTab('robots')}
            className={`px-4 py-2 text-sm font-semibold ${activeTab === 'robots'
                ? 'text-neutral-900 border-b-2 border-neutral-900'
                : 'text-neutral-600'
              }`}
          >
            Robots.txt
          </button>
        </div>
      </div>

      {/* Sitemap */}
      {activeTab === 'sitemap' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Sitemap.xml</h3>
              <p className="text-sm text-neutral-600">
                Автоматически генерируется на основе калькуляторов ({calculators.length} страниц)
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(sitemapXML)}
                className="px-4 py-2 text-sm border-2 border-neutral-300 text-neutral-700"
              >
                📋 Копировать
              </button>
              <button
                onClick={() => downloadFile(sitemapXML, 'sitemap.xml', 'application/xml')}
                className="px-4 py-2 text-sm border-2 border-neutral-900 text-neutral-900"
              >
                ⬇️ Скачать
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 text-neutral-100 p-4 overflow-auto max-h-96">
            <pre className="text-xs font-mono">{sitemapXML}</pre>
          </div>

          <div className="bg-neutral-50 border-2 border-neutral-300 p-4">
            <div className="flex items-start space-x-3">
              <span className="text-neutral-600 text-xl">ℹ️</span>
              <div className="text-sm text-neutral-700">
                <strong>Как использовать:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Sitemap автоматически доступен по адресу: <code className="bg-neutral-200 px-2 py-0.5">{siteUrl}/sitemap.xml</code></li>
                  <li>Добавьте URL в Google Search Console</li>
                  <li>Проверьте индексацию через &quot;Проверка URL&quot;</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Robots.txt */}
      {activeTab === 'robots' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Robots.txt</h3>
              <p className="text-sm text-neutral-600">
                Правила для поисковых роботов
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(robotsContent)}
                className="px-4 py-2 text-sm border-2 border-neutral-300 text-neutral-700"
              >
                📋 Копировать
              </button>
              <button
                onClick={() => downloadFile(robotsContent, 'robots.txt', 'text/plain')}
                className="px-4 py-2 text-sm border-2 border-neutral-900 text-neutral-900"
              >
                ⬇️ Скачать
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Содержимое robots.txt
            </label>
            <textarea
              value={robotsContent}
              onChange={(e) => setRobotsContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 text-sm font-mono bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="bg-neutral-50 border-2 border-neutral-300 p-4">
            <div className="flex items-start space-x-3">
              <span className="text-neutral-600 text-xl">ℹ️</span>
              <div className="text-sm text-neutral-700">
                <strong>Как использовать:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Robots.txt автоматически доступен по адресу: <code className="bg-neutral-200 px-2 py-0.5">{siteUrl}/robots.txt</code></li>
                  <li>Файл блокирует индексацию /admin/ и /api/</li>
                  <li>Указывает путь к sitemap.xml</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 border-2 border-neutral-300 p-4">
            <div className="flex items-start space-x-3">
              <span className="text-neutral-600 text-xl">⚠️</span>
              <div className="text-sm text-neutral-700">
                <strong>Важно:</strong> Изменения в robots.txt требуют перезапуска сервера Next.js.
                Для динамических изменений используйте файл <code className="bg-neutral-200 px-2 py-0.5">app/robots.ts</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
