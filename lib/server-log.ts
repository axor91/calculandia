export type ServerLogEvent = {
  event: "request_error" | "client_error";
  route?: string;
  source?: string;
  context?: string;
  digest?: string;
};

function safePath(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, "https://calculandia.ru").pathname.slice(0, 160);
  } catch {
    return undefined;
  }
}

export function writeErrorLog(event: ServerLogEvent): void {
  const record = {
    timestamp: new Date().toISOString(),
    level: "error",
    event: event.event,
    ...(safePath(event.route) ? { route: safePath(event.route) } : {}),
    ...(event.source ? { source: event.source.slice(0, 48) } : {}),
    ...(event.context ? { context: event.context.slice(0, 96) } : {}),
    ...(event.digest ? { digest: event.digest.slice(0, 128) } : {}),
  };

  console.error(JSON.stringify(record));
}
