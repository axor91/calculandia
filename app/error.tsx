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
      source: "route_boundary",
      context: window.location.pathname,
      ...(error.digest ? { digest: error.digest } : {}),
    });
  }, [error.digest]);

  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center px-4 py-20"
    >
      <div className="w-full max-w-md rounded-[24px] border border-line bg-white p-8 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-danger">
          Техническая ошибка
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-ink">
          Что-то пошло не так
        </h1>
        <p className="mb-6 mt-3 text-sm leading-6 text-muted">
          Произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-muted">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="min-h-11 rounded-xl bg-teal px-6 py-3 font-bold text-white hover:bg-teal-dark"
        >
          Попробовать снова
        </button>
      </div>
    </main>
  );
}
