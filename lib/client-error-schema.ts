export const clientErrorSources = [
  "calculator_boundary",
  "route_boundary",
  "global_boundary",
] as const;

export type ClientErrorSource = (typeof clientErrorSources)[number];

export type ClientErrorEvent = {
  source: ClientErrorSource;
  context: string;
  digest?: string;
};

const safeContextPattern = /^[\p{L}\p{N}/ _-]+$/u;
const safeDigestPattern = /^[a-zA-Z0-9_-]+$/;

export function parseClientErrorEvent(value: unknown): ClientErrorEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const allowedKeys = new Set(["source", "context", "digest"]);

  if (Object.keys(candidate).some((key) => !allowedKeys.has(key))) return null;

  if (
    typeof candidate.source !== "string" ||
    !clientErrorSources.includes(candidate.source as ClientErrorSource)
  ) {
    return null;
  }

  if (
    typeof candidate.context !== "string" ||
    candidate.context.length < 1 ||
    candidate.context.length > 96 ||
    !safeContextPattern.test(candidate.context)
  ) {
    return null;
  }

  if (
    candidate.digest !== undefined &&
    (typeof candidate.digest !== "string" ||
      candidate.digest.length > 128 ||
      !safeDigestPattern.test(candidate.digest))
  ) {
    return null;
  }

  return {
    source: candidate.source as ClientErrorSource,
    context: candidate.context,
    ...(candidate.digest ? { digest: candidate.digest as string } : {}),
  };
}
