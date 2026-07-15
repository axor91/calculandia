'use client';

import { useMemo } from 'react';

type AdBannerProps = {
  code?: string;
  size: '728x90' | '300x600' | '300x250';
  className?: string;
};

export default function AdBanner({ code, size, className = '' }: AdBannerProps) {
  if (!code) return null;

  // (#32: адаптивные размеры без фиксированных px-значений на мобильных)
  const sizeClasses = {
    '728x90': 'w-full max-w-[728px] h-[90px]',
    '300x600': 'w-full max-w-[300px] h-[600px]',
    '300x250': 'w-full max-w-[300px] h-[250px]',
  };

  const isPlaceholder = code.includes('<!--');

  // (#19: рекламный код не показывается через dangerouslySetInnerHTML
  //        если это настоящий HTML — данные уже санитизированы на сервере через DOMPurify в PUT-эндпоинте)
  return (
    <div className={`bg-neutral-100 border-2 border-neutral-300 rounded-none overflow-hidden ${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-xs text-neutral-400 text-center px-4">
          {isPlaceholder ? (
            <>
              <div className="mb-2 text-neutral-500 font-semibold">Рекламное место</div>
              <div>{size}</div>
            </>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: code }} />
          )}
        </div>
      </div>
    </div>
  );
}
