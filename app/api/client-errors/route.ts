import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { parseClientErrorEvent } from "@/lib/client-error-schema";
import { FixedWindowRateLimiter } from "@/lib/fixed-window-rate-limit";
import { writeErrorLog } from "@/lib/server-log";
import { productionOrigin } from "@/lib/site";

export const runtime = "nodejs";

const maximumBodyBytes = 1024;
const limiter = new FixedWindowRateLimiter({
  windowMs: 60_000,
  perKeyLimit: 10,
  globalLimit: 300,
});

function errorResponse(error: string, status: number, retryAfter?: string) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        ...(retryAfter ? { "Retry-After": retryAfter } : {}),
      },
    },
  );
}

function isTrustedBrowserRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const expectedOrigin =
    process.env.NODE_ENV === "production"
      ? productionOrigin
      : new URL(request.url).origin;
  const fetchSite = request.headers.get("sec-fetch-site");

  return origin === expectedOrigin && fetchSite === "same-origin";
}

function clientRateLimitKey(request: Request): string {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const trustedProxyAddress =
    forwarded?.at(-1) || request.headers.get("x-real-ip")?.trim() || "direct";

  return createHash("sha256")
    .update(trustedProxyAddress)
    .digest("base64url")
    .slice(0, 22);
}

async function readLimitedBody(request: Request): Promise<string | null> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    size += value.byteLength;
    if (size > maximumBodyBytes) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }

  return body + decoder.decode();
}

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return errorResponse("Forbidden request context", 403);
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json")) {
    return errorResponse("Unsupported media type", 415);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (!Number.isFinite(contentLength) || contentLength > maximumBodyBytes) {
    return errorResponse("Payload too large", 413);
  }

  const body = await readLimitedBody(request);
  if (body === null) {
    return errorResponse("Payload too large", 413);
  }

  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const event = parseClientErrorEvent(value);
  if (!event) {
    return errorResponse("Invalid event", 400);
  }

  if (!limiter.consume(clientRateLimitKey(request))) {
    return errorResponse("Rate limit exceeded", 429, "60");
  }

  writeErrorLog({
    event: "client_error",
    source: event.source,
    context: event.context,
    digest: event.digest,
  });

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
