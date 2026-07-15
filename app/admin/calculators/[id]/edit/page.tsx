'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type FAQItem = { question: string; answer: string };
type Calculator = {
  id: string;
  slug?: string;
  name: string;
  category: string;
  description: string;
  component: string;
  seo: { title: string; description: string; keywords: string[]; robots?: string };
  content?: { beforeCalculator?: string; afterCalculator?: string; faq?: FAQItem[] };
  ads?: {
    topBanner?: { enabled: boolean; code?: string };
    sidebarBanner?: { enabled: boolean; code?: string };
    bottomBanner?: { enabled: boolean; code?: string };
  };
};

export default function CalculatorEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [calcId, setCalcId] = useState<string>('');
  const [calculator, setCalculator] = useState<Calculator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'seo' | 'content' | 'ads' | 'schema'>('seo');
  // (#27: toast вместо alert)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    (async () => {
      const { id } = await params;
      setCalcId(id);
    })();
  }, [params]);

  useEffect(() => {
    if (!calcId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/calculators/${calcId}`);
        if (!res.ok) throw new Error('Не удалось загрузить калькулятор');
        const data = await res.json();
        setCalculator(data);
        setFormData({
          seo: {
            title: data.seo.title,
            description: data.seo.description,
            keywords: data.seo.keywords.join(', '),
            robots: data.seo.robots || 'index,follow',
            slug: data.slug || '',
          },
          content: {
            beforeCalculator: data.content?.beforeCalculator || '',
            afterCalculator: data.content?.afterCalculator || '',
            faq: data.content?.faq || [],
          },
          ads: {
            topBanner: { enabled: data.ads?.topBanner?.enabled || false, code: data.ads?.topBanner?.code || '' },
            sidebarBanner: { enabled: data.ads?.sidebarBanner?.enabled || false, code: data.ads?.sidebarBanner?.code || '' },
            bottomBanner: { enabled: data.ads?.bottomBanner?.enabled || false, code: data.ads?.bottomBanner?.code || '' },
          },
          schema: { types: data.schema?.types || [], extraJsonLd: data.schema?.extraJsonLd || '' },
        });
      } catch (e) {
        console.error(e);
        showToast('Ошибка загрузки', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [calcId]);

  const [formData, setFormData] = useState({
    seo: { title: '', description: '', keywords: '', robots: 'index,follow', slug: '' },
    content: { beforeCalculator: '', afterCalculator: '', faq: [] as FAQItem[] },
    ads: {
      topBanner: { enabled: false, code: '' },
      sidebarBanner: { enabled: false, code: '' },
      bottomBanner: { enabled: false, code: '' },
    },
    schema: { types: [] as string[], extraJsonLd: '' },
  });

  const handleSave = async () => {
    if (!calculator) return;
    const payload = {
      id: calculator.id,
      slug: formData.seo.slug?.trim() || calculator.slug,
      seo: {
        ...calculator.seo,
        title: formData.seo.title,
        description: formData.seo.description,
        keywords: formData.seo.keywords.split(',').map(k => k.trim()).filter(Boolean),
        robots: formData.seo.robots || 'index,follow',
      },
      content: formData.content,
      ads: formData.ads,
      schema: formData.schema,
    };
    try {
      setSaving(true);
      const res = await fetch(`/api/calculators/${calculator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      showToast('Сохранено', 'success');
    } catch (e) {
      console.error(e);
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addFAQ = () => setFormData(fd => ({ ...fd, content: { ...fd.content, faq: [...fd.content.faq, { question: '', answer: '' }] } }));
  // (#28: confirm перед удалением FAQ)
  const removeFAQ = (i: number) => {
    if (!window.confirm(`Удалить вопрос #${i + 1}?`)) return;
    setFormData(fd => ({ ...fd, content: { ...fd.content, faq: fd.content.faq.filter((_, idx) => idx !== i) } }));
  };
  const updateFAQ = (i: number, field: 'question' | 'answer', value: string) =>
    setFormData(fd => {
      const faq = [...fd.content.faq];
      faq[i] = { ...faq[i], [field]: value };
      return { ...fd, content: { ...fd.content, faq } };
    });

  const title = useMemo(() => calculator?.name || 'Калькулятор', [calculator]);

  if (loading) return <div className="text-neutral-600">Загрузка...</div>;
  if (!calculator) return <div className="text-neutral-600">Калькулятор не найден</div>;

  return (
    <div className="bg-white border-2 border-neutral-300 shadow-sm p-4 sm:p-6">
      {/* (#27: Toast уведомление) */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 text-sm shadow-lg ${toastMsg.type === 'success' ? 'bg-neutral-900 text-white' : 'bg-red-700 text-white'
          }`}>
          {toastMsg.text}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
        <Link href="/admin/calculators" className="text-sm text-neutral-700">← Список</Link>
      </div>

      <div className="border-b-2 border-neutral-300 mb-4 flex gap-4 text-sm font-semibold">
        <button onClick={() => setActiveTab('seo')} className={activeTab === 'seo' ? 'text-neutral-900 border-b-2 border-neutral-900 px-2 py-2' : 'text-neutral-600 px-2 py-2'}>SEO</button>
        <button onClick={() => setActiveTab('content')} className={activeTab === 'content' ? 'text-neutral-900 border-b-2 border-neutral-900 px-2 py-2' : 'text-neutral-600 px-2 py-2'}>Контент</button>
        <button onClick={() => setActiveTab('ads')} className={activeTab === 'ads' ? 'text-neutral-900 border-b-2 border-neutral-900 px-2 py-2' : 'text-neutral-600 px-2 py-2'}>Реклама</button>
        <button onClick={() => setActiveTab('schema')} className={activeTab === 'schema' ? 'text-neutral-900 border-b-2 border-neutral-900 px-2 py-2' : 'text-neutral-600 px-2 py-2'}>Микроразметка</button>
      </div>

      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">SEO Заголовок</label>
            <input value={formData.seo.title} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">SEO Описание</label>
            <textarea value={formData.seo.description} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })} rows={4} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Ключевые слова</label>
            <input value={formData.seo.keywords} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, keywords: e.target.value } })} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="слово1, слово2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">robots</label>
              <input value={formData.seo.robots} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, robots: e.target.value } })} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="index,follow" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Slug (ЧПУ)</label>
              <input value={formData.seo.slug} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, slug: e.target.value } })} className="w-full px-4 py-3 text-base bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="naprimer-kalkulyator" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Контент после калькулятора (HTML)</label>
            <textarea value={formData.content.afterCalculator} onChange={(e) => setFormData({ ...formData, content: { ...formData.content, afterCalculator: e.target.value } })} rows={12} className="w-full px-4 py-3 text-sm font-mono bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-neutral-700">FAQ</label>
              <button onClick={addFAQ} className="px-3 py-1.5 text-sm border-2 border-neutral-900 text-neutral-900">+ Добавить вопрос</button>
            </div>
            <div className="space-y-4">
              {formData.content.faq.map((item, index) => (
                <div key={index} className="border-2 border-neutral-300 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-semibold text-neutral-700">Вопрос {index + 1}</span>
                    <button onClick={() => removeFAQ(index)} className="text-negative text-sm">Удалить</button>
                  </div>
                  <div className="space-y-3">
                    <input value={item.question} onChange={(e) => updateFAQ(index, 'question', e.target.value)} className="w-full px-3 py-2 text-sm bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="Вопрос" />
                    <textarea value={item.answer} onChange={(e) => updateFAQ(index, 'answer', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900" placeholder="Ответ" />
                  </div>
                </div>
              ))}
              {formData.content.faq.length === 0 && (
                <div className="text-center py-8 text-neutral-500 text-sm">Нет добавленных вопросов</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="space-y-6">
          {(['topBanner', 'sidebarBanner', 'bottomBanner'] as const).map((key) => (
            <div key={key} className="border-2 border-neutral-300 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-900">{key === 'topBanner' ? 'Верхний баннер (728x90)' : key === 'sidebarBanner' ? 'Боковой баннер (300x600)' : 'Нижний баннер (728x90)'}</h3>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={(formData.ads as any)[key].enabled} onChange={(e) => setFormData(fd => ({ ...fd, ads: { ...fd.ads, [key]: { ...((fd.ads as any)[key]), enabled: e.target.checked } } }))} className="w-4 h-4" />
                  <span className="text-sm text-neutral-700">Включено</span>
                </label>
              </div>
              <textarea value={(formData.ads as any)[key].code} onChange={(e) => setFormData(fd => ({ ...fd, ads: { ...fd.ads, [key]: { ...((fd.ads as any)[key]), code: e.target.value } } }))} rows={4} disabled={!((formData.ads as any)[key].enabled)} className="w-full px-3 py-2 text-xs font-mono bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500" placeholder="HTML код рекламы или комментарий" />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="border-2 border-neutral-300 p-4">
            <div className="text-sm font-semibold text-neutral-900 mb-3">Типы микроразметки (JSON-LD)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {['FAQPage', 'HowTo', 'Product', 'Article', 'BreadcrumbList'].map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.schema.types.includes(t)}
                    onChange={(e) => setFormData(fd => ({
                      ...fd,
                      schema: {
                        ...fd.schema,
                        types: e.target.checked
                          ? Array.from(new Set([...fd.schema.types, t]))
                          : fd.schema.types.filter(x => x !== t),
                      },
                    }))}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-2 border-neutral-300 p-4">
            <div className="text-sm font-semibold text-neutral-900 mb-2">Дополнительный JSON-LD</div>
            <textarea
              value={formData.schema.extraJsonLd}
              onChange={(e) => setFormData(fd => ({ ...fd, schema: { ...fd.schema, extraJsonLd: e.target.value } }))}
              rows={8}
              placeholder='{ "@context": "https://schema.org", "@type": "Thing" }'
              className="w-full px-3 py-2 text-xs font-mono bg-white border-2 border-neutral-300 focus:outline-none focus:border-neutral-900"
            />
            <div className="text-xs text-neutral-600 mt-2">Вставьте валидный JSON-LD для расширенной разметки.</div>
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-6 mt-6 border-t border-neutral-200">
        <button onClick={handleSave} disabled={saving} className="border-2 border-neutral-900 text-neutral-900 px-6 py-3 font-semibold disabled:opacity-60">{saving ? '💾 Сохранение...' : '💾 Сохранить'}</button>
        <Link href="/admin/calculators" className="border-2 border-neutral-300 px-6 py-3 text-neutral-700">Отменить</Link>
      </div>
    </div>
  );
}


