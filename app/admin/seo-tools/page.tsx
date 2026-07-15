import SeoTools from '@/components/SeoTools';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SeoToolsPage() {
  return (
    <div className="bg-white border-2 border-neutral-300 shadow-sm p-6">
      <h2 className="text-lg font-bold text-neutral-900 mb-6">SEO инструменты</h2>
      <SeoTools />
    </div>
  );
}


