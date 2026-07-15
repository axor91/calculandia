'use client';

import Link from 'next/link';

export default function CalculatorError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full bg-white border-2 border-neutral-300 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 flex items-center justify-center">
                    <span className="text-3xl">🧮</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Ошибка загрузки калькулятора</h2>
                <p className="text-neutral-600 text-sm mb-6">
                    Не удалось загрузить данные калькулятора. Попробуйте перезагрузить страницу.
                </p>
                {error.digest && (
                    <p className="text-xs text-neutral-400 mb-4 font-mono">ID: {error.digest}</p>
                )}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 border-2 border-neutral-900 text-neutral-900 font-semibold hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                        Попробовать снова
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 border-2 border-neutral-300 text-neutral-600 font-semibold hover:bg-neutral-100 transition-colors"
                    >
                        На главную
                    </Link>
                </div>
            </div>
        </div>
    );
}
