import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border-2 border-neutral-300 p-8 text-center">
        <div className="text-6xl font-bold text-neutral-300 mb-2">404</div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Страница не найдена
        </h2>
        <p className="text-neutral-600 text-sm mb-6">
          Возможно, калькулятор был перемещён или удалён.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 border-2 border-neutral-900 text-neutral-900 font-semibold hover:bg-neutral-900 hover:text-white transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
