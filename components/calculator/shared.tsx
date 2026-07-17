"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  decodeShareState,
  encodeShareState,
  parseLocalizedNumber,
  type ShareState,
} from "./state";

const CalculatorErrorContext = createContext<{
  errorId?: string;
}>({});

export function parseNumber(value: string, options?: { integer?: boolean }) {
  return parseLocalizedNumber(value, options);
}

export function formatNumber(value: number, digits = 2) {
  if (value !== 0 && Math.abs(value) < 10 ** -digits) {
    return new Intl.NumberFormat("ru-RU", {
      maximumSignificantDigits: Math.min(10, Math.max(3, digits)),
    }).format(value);
  }
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatMoney(value: number) {
  return `${formatNumber(value, 2)} ₽`;
}

export function useShareableState<T extends ShareState>(
  slug: string,
  defaults: T,
  allowedValues: Partial<Record<keyof T, readonly string[]>> = {},
) {
  const defaultsRef = useRef(defaults);
  const allowedValuesRef = useRef(allowedValues);
  const [state, setState] = useState<T>(defaultsRef.current);
  const [restoreVersion, setRestoreVersion] = useState(0);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    const restored = decodeShareState(
      window.location.hash,
      slug,
      defaultsRef.current,
      allowedValuesRef.current,
    );
    if (!restored) return;
    setState(restored);
    setRestoreVersion((version) => version + 1);
  }, [slug]);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultsRef.current);
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }, []);

  const copyLink = useCallback(async () => {
    const encoded = encodeShareState(slug, state);
    if (!encoded) {
      setShareStatus("error");
      return;
    }
    const url = `${location.origin}${location.pathname}#${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      history.replaceState(null, "", `${location.pathname}#${encoded}`);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
    window.setTimeout(() => setShareStatus("idle"), 2500);
  }, [slug, state]);

  return { state, setField, reset, copyLink, shareStatus, restoreVersion };
}

export function Field({
  label,
  value,
  onChange,
  unit,
  hint,
  type = "text",
  min,
  max,
  step,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  hint?: string;
  type?: "text" | "date";
  min?: string;
  max?: string;
  step?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const formError = useContext(CalculatorErrorContext);
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy =
    [hintId, formError.errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
        {label}
        {unit ? <span className="sr-only">, {unit}</span> : null}
      </label>
      <span className="relative block">
        <input
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, 32))}
          type={type}
          inputMode={type === "text" ? "decimal" : undefined}
          autoComplete="off"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-describedby={describedBy}
          className="min-h-12 w-full rounded-xl border border-line-strong bg-paper px-4 py-3 pr-16 text-base font-semibold text-ink shadow-[0_1px_0_rgba(20,32,29,.04)] transition-colors hover:border-teal focus:border-teal disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
        />
        {unit ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-muted"
          >
            {unit}
          </span>
        ) : null}
      </span>
      {hint ? (
        <span id={hintId} className="mt-1.5 block text-xs leading-5 text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
}) {
  const id = useId();
  const formError = useContext(CalculatorErrorContext);
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy =
    [hintId, formError.errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, 512))}
        rows={rows}
        aria-describedby={describedBy}
        className="w-full rounded-xl border border-line-strong bg-paper px-4 py-3 text-base font-semibold text-ink shadow-[0_1px_0_rgba(20,32,29,.04)] transition-colors hover:border-teal focus:border-teal"
      />
      {hint ? (
        <span id={hintId} className="mt-1.5 block text-xs leading-5 text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  const id = useId();
  const formError = useContext(CalculatorErrorContext);
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={formError.errorId}
        className="min-h-12 w-full rounded-xl border border-line-strong bg-paper px-4 py-3 font-semibold text-ink hover:border-teal focus:border-teal"
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  const formError = useContext(CalculatorErrorContext);
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy =
    [hintId, formError.errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="min-h-12 rounded-xl border border-line bg-paper px-4 py-3">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={describedBy}
          className="mt-0.5 h-5 w-5 accent-teal"
        />
        <span className="block text-sm font-bold text-ink">{label}</span>
      </label>
      {hint ? (
        <p id={hintId} className="ml-8 mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function ResultAnnouncement({ value }: { value?: string | null }) {
  const previous = useRef(value);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (!value || value === previous.current) return;
    previous.current = value;
    const timer = window.setTimeout(() => setAnnounced(value), 400);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <span className="sr-only" role="status" aria-live="polite" aria-atomic>
      {announced}
    </span>
  );
}

export function CalculatorFrame({
  children,
  result,
  error,
  onReset,
  onShare,
  shareStatus,
  submitLabel,
  onSubmit,
  notice,
  resultAnnouncement,
}: {
  children: React.ReactNode;
  result: React.ReactNode;
  error?: string | null;
  onReset: () => void;
  onShare: () => void;
  shareStatus: "idle" | "copied" | "error";
  submitLabel?: string;
  onSubmit?: () => void;
  notice?: string | null;
  resultAnnouncement?: string | null;
}) {
  const errorId = useId();
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,.88fr)] lg:items-start">
      <form
        className="rounded-[24px] border border-line bg-white p-5 shadow-[0_10px_35px_rgba(20,32,29,.055)] sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <CalculatorErrorContext.Provider
          value={{
            errorId: error ? errorId : undefined,
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">{children}</div>
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger"
            >
              {error}
            </p>
          ) : null}
        </CalculatorErrorContext.Provider>
        {notice ? (
          <p
            role="status"
            className="mt-5 rounded-xl bg-amber-soft px-4 py-3 text-sm font-semibold text-amber-ink"
          >
            {notice}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {onSubmit ? (
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-teal px-5 py-2.5 text-sm font-extrabold text-white hover:bg-teal-dark"
            >
              {submitLabel ?? "Рассчитать"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 rounded-xl border border-line-strong bg-paper px-4 py-2.5 text-sm font-bold text-ink hover:border-teal"
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={onShare}
            className="min-h-11 rounded-xl border border-line-strong bg-paper px-4 py-2.5 text-sm font-bold text-ink hover:border-teal"
          >
            {shareStatus === "copied"
              ? "Ссылка скопирована"
              : shareStatus === "error"
                ? "Не удалось скопировать"
                : "Поделиться расчётом"}
          </button>
          <span className="sr-only" role="status" aria-live="polite">
            {shareStatus === "copied"
              ? "Ссылка на расчёт скопирована"
              : shareStatus === "error"
                ? "Не удалось скопировать ссылку на расчёт"
                : ""}
          </span>
        </div>
      </form>
      <section
        aria-label="Результат расчёта"
        className="rounded-[24px] border border-teal/20 bg-mint p-5 sm:p-7 lg:sticky lg:top-24"
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal-dark">
          Результат
        </p>
        <div className="mt-4">{result}</div>
        <ResultAnnouncement value={resultAnnouncement} />
        <p className="mt-5 border-t border-teal/15 pt-4 text-xs leading-5 text-teal-dark">
          Предварительный расчёт. Проверьте исходные данные и условия задачи.
        </p>
      </section>
    </div>
  );
}

export function ResultValue({
  label,
  value,
  primary = false,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div
      className={
        primary
          ? "mb-5"
          : "flex items-baseline justify-between gap-4 border-t border-teal/15 py-3"
      }
    >
      <span
        className={
          primary
            ? "block text-sm font-semibold text-teal-dark"
            : "text-sm text-teal-dark"
        }
      >
        {label}
      </span>
      <strong
        className={
          primary
            ? "number-tabular mt-1 block text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl"
            : "number-tabular text-right text-base font-extrabold text-ink"
        }
      >
        {value}
      </strong>
    </div>
  );
}

export function EmptyResult() {
  return (
    <p className="text-sm leading-6 text-teal-dark">
      Заполните поля корректными значениями — результат появится здесь.
    </p>
  );
}
