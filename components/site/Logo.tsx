import Link from "next/link";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex min-h-11 items-center gap-3">
      <span
        className="relative grid h-10 w-10 shrink-0 grid-cols-2 overflow-hidden rounded-[13px] bg-ink p-[7px] shadow-[0_5px_16px_rgba(20,32,29,0.16)]"
        aria-hidden="true"
      >
        <span className="border-b border-r border-white/65" />
        <span className="border-b border-white/25" />
        <span className="border-r border-white/25" />
        <span className="relative after:absolute after:left-1/2 after:top-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-mint" />
      </span>
      <span className={compact ? "sr-only" : "block"}>
        <span className="block text-[1.05rem] font-extrabold tracking-[-0.025em] text-ink">
          Calculandia
        </span>
        <span className="block text-[0.68rem] font-medium tracking-[0.055em] text-muted">
          РАСЧЁТ С ОБЪЯСНЕНИЕМ
        </span>
      </span>
      <span className="sr-only"> — главная</span>
    </Link>
  );
}
