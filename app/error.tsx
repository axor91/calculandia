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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border-2 border-neutral-300 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Что-то пошло не так
        </h2>
        <p className="text-neutral-600 text-sm mb-6">
          Произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз.
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-400 mb-4 font-mono">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-3 border-2 border-neutral-900 text-neutral-900 font-semibold hover:bg-neutral-900 hover:text-white transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
