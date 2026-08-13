"use client";

import { useEffect, useRef } from "react";
import { adContainerId } from "@/lib/ads";

declare global {
  interface Window {
    yaContextCb?: (() => void)[];
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (params: { blockId: string; renderTo: string }) => void;
        };
      };
    };
  }
}

/**
 * Сколько держим зарезервированную высоту, если объявление так и не пришло.
 * Место резервируется, чтобы реклама не сдвигала текст под собой; если её нет
 * (нет заполнения, блокировщик, оборванная загрузка) — резерв снимается,
 * иначе на странице остаётся пустая полоса.
 */
const RESERVE_TIMEOUT_MS = 4000;
const RESERVED_HEIGHT = "250px";

export default function AdSlot({
  blockId,
  className,
}: {
  blockId: string;
  className?: string;
}) {
  const containerId = adContainerId(blockId);
  const hostRef = useRef<HTMLDivElement>(null);

  // Содержимое контейнера рисует РСЯ, поэтому React к нему не притрагивается:
  // ни состояния, ни dangerouslySetInnerHTML. Пустой dangerouslySetInnerHTML
  // выглядит как способ «отдать узел третьей стороне», но на деле React
  // переустанавливает им innerHTML на первом же обновлении после гидрации и
  // стирает вставленное объявление — воспроизведено в браузере, закреплено
  // тестом tests/e2e/ads.spec.ts. Резерв высоты снимается правкой стиля.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const container = host.firstElementChild;
    if (!container) return;

    const dropReserve = () => {
      host.style.minHeight = "";
    };

    // Обе ссылки живут в отложенных колбэках, поэтому порядок объявления
    // на исполнение не влияет.
    const timer = setTimeout(() => {
      observer.disconnect();
      if (container.childElementCount > 0) return;
      dropReserve();
      host.className = "";
    }, RESERVE_TIMEOUT_MS);
    const observer = new MutationObserver(() => {
      if (container.childElementCount === 0) return;
      dropReserve();
      observer.disconnect();
      clearTimeout(timer);
    });
    observer.observe(container, { childList: true });

    // Очередь загрузчика: код блока кладётся в неё и выполняется, когда
    // context.js готов. Порядок скриптов при этом значения не имеет.
    window.yaContextCb = window.yaContextCb ?? [];
    window.yaContextCb.push(() => {
      window.Ya?.Context?.AdvManager?.render({
        blockId,
        renderTo: containerId,
      });
    });

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [blockId, containerId]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ minHeight: RESERVED_HEIGHT }}
    >
      <div id={containerId} />
    </div>
  );
}
