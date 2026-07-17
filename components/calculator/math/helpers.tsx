"use client";

import { useId } from "react";
import { parseNumber } from "../shared";

/** Multi-value input (2..200 numbers) for calculators that take a list rather
 * than a fixed set of fields. Kept local to this file: shared.tsx's `Field`
 * caps input at 32 characters (single numbers only), and its `TextareaField`
 * caps at 512 (too short for up to 200 comma-separated values). */
export function ListField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, 2000))}
        rows={2}
        aria-describedby={hintId}
        className="min-h-12 w-full rounded-xl border border-line-strong bg-paper px-4 py-3 text-base font-semibold text-ink shadow-[0_1px_0_rgba(20,32,29,.04)] transition-colors hover:border-teal focus:border-teal"
      />
      {hint ? (
        <span id={hintId} className="mt-1.5 block text-xs leading-5 text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function parseNumberList(
  raw: string,
  options?: { integer?: boolean },
): number[] | null {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) return null;

  const values: number[] = [];
  for (const token of tokens) {
    const parsed = parseNumber(token, options);
    if (parsed === null) return null;
    values.push(parsed);
  }
  return values;
}
