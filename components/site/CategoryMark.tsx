import type { CategoryId } from "@/catalog";

const styles = {
  matematika: "bg-mint text-teal",
  finansy: "bg-amber-soft text-amber-ink",
  "data-i-vremya": "bg-violet-soft text-violet",
  stroitelstvo: "bg-coral-soft text-coral",
} as const;

export default function CategoryMark({
  category,
  className = "",
}: {
  category: CategoryId;
  className?: string;
}) {
  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${styles[category]} ${className}`}
      aria-hidden="true"
    >
      {category === "matematika" && (
        <span className="text-xl font-black">%</span>
      )}
      {category === "finansy" && <span className="text-lg font-black">₽</span>}
      {category === "data-i-vremya" && (
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none">
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
      {category === "stroitelstvo" && (
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none">
          <path
            d="M5 19V9l7-4 7 4v10H5Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M9 19v-6h6v6" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
    </span>
  );
}
