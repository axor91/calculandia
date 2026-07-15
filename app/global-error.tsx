"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      source: "global_boundary",
      context: "root",
      ...(error.digest ? { digest: error.digest } : {}),
    });
  }, [error.digest]);

  return (
    <html lang="ru">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
          <div className="w-full max-w-md border border-neutral-300 bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-neutral-950">
              Сайт временно недоступен
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Мы уже зафиксировали техническую ошибку. Попробуйте загрузить
              страницу ещё раз.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 border-2 border-neutral-950 px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-950 hover:text-white"
            >
              Повторить
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
