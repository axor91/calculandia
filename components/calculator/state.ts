export type ShareValue = string | boolean;
export type ShareState = Record<string, ShareValue>;

export const MAX_SHARE_FRAGMENT_LENGTH = 4096;
export const MAX_SHARE_VALUE_LENGTH = 32;

export function parseLocalizedNumber(
  value: string,
  options?: { integer?: boolean },
) {
  const normalized = value
    .trim()
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(",", ".");
  if (
    normalized.length === 0 ||
    normalized.length > MAX_SHARE_VALUE_LENGTH ||
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)
  ) {
    return null;
  }
  const result = Number(normalized);
  if (
    !Number.isFinite(result) ||
    (options?.integer && !Number.isSafeInteger(result))
  ) {
    return null;
  }
  return result;
}

export function encodeShareState(slug: string, state: ShareState) {
  const params = new URLSearchParams({ calc: slug, v: "1" });
  for (const [key, value] of Object.entries(state)) {
    if (typeof value === "boolean") {
      params.set(key, value ? "1" : "0");
      continue;
    }
    // A truncated value would silently restore a DIFFERENT input (and a
    // different result) on the receiving side; refuse to share instead.
    if (value.length > MAX_SHARE_VALUE_LENGTH) return null;
    params.set(key, value);
  }
  const encoded = params.toString();
  return encoded.length <= MAX_SHARE_FRAGMENT_LENGTH ? encoded : null;
}

export function decodeShareState<T extends ShareState>(
  fragment: string,
  slug: string,
  defaults: T,
  allowedValues: Partial<Record<keyof T, readonly string[]>> = {},
): T | null {
  const rawFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  if (
    rawFragment.length === 0 ||
    rawFragment.length > MAX_SHARE_FRAGMENT_LENGTH
  )
    return null;
  const params = new URLSearchParams(rawFragment);
  if (params.get("calc") !== slug || params.get("v") !== "1") return null;

  const restored = { ...defaults } as T;
  for (const key of Object.keys(defaults)) {
    const raw = params.get(key);
    if (raw === null || raw.length > MAX_SHARE_VALUE_LENGTH) continue;
    if (typeof defaults[key] === "boolean") {
      if (raw !== "0" && raw !== "1") continue;
      restored[key as keyof T] = (raw === "1") as T[keyof T];
    } else {
      const allowed = allowedValues[key];
      if (allowed && !allowed.includes(raw)) continue;
      restored[key as keyof T] = raw as T[keyof T];
    }
  }
  return restored;
}

export function localCalendarDate(date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
