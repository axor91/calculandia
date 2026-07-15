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
        <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
          <div className="w-full max-w-md rounded-[24px] border border-line bg-white p-8 text-center">
            <h1 className="text-2xl font-black text-ink">
              Сайт временно недоступен
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Мы уже зафиксировали техническую ошибку. Попробуйте загрузить
              страницу ещё раз.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 min-h-11 rounded-xl bg-teal px-5 py-3 font-bold text-white hover:bg-teal-dark"
            >
              Повторить
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
