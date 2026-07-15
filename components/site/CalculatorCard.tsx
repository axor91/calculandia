import Link from "next/link";
import type { CalculatorDefinition } from "@/catalog";
import CategoryMark from "./CategoryMark";

export default function CalculatorCard({
  calculator,
  compact = false,
}: {
  calculator: CalculatorDefinition;
  compact?: boolean;
}) {
  return (
    <Link
      href={calculator.path}
      className={`group flex h-full flex-col border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-teal/35 hover:shadow-[0_18px_45px_rgba(20,32,29,0.09)] ${compact ? "rounded-2xl p-5" : "rounded-[22px] p-5 sm:p-6"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <CategoryMark category={calculator.category} />
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition group-hover:border-teal group-hover:bg-teal group-hover:text-white"
          aria-hidden="true"
        >
          ↗
        </span>
      </div>
      <h3 className="mt-5 text-lg font-extrabold tracking-[-0.02em] text-ink">
        {calculator.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        {calculator.shortDescription}
      </p>
      {!compact && (
        <p className="mt-auto pt-5 text-xs font-bold uppercase tracking-[0.09em] text-teal">
          Открыть калькулятор
        </p>
      )}
    </Link>
  );
}
