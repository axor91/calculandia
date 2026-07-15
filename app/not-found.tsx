import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center px-4 py-20"
    >
      <div className="w-full max-w-md rounded-[24px] border border-line bg-white p-8 text-center shadow-[0_14px_45px_rgba(20,32,29,.06)]">
        <div className="mb-3 text-6xl font-black tracking-[-0.06em] text-line-strong">
          404
        </div>
        <h1 className="text-2xl font-black tracking-[-0.03em] text-ink">
          Страница не найдена
        </h1>
        <p className="mb-6 mt-3 text-sm leading-6 text-muted">
          Возможно, калькулятор был перемещён или удалён.
        </p>
        <Link
          href="/kalkulyatory"
          className="inline-flex min-h-11 items-center rounded-xl bg-teal px-6 py-3 font-bold text-white hover:bg-teal-dark"
        >
          Открыть каталог
        </Link>
      </div>
    </main>
  );
}
