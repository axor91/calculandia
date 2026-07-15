"use client";

import type { ClientErrorEvent } from "./client-error-schema";

export function reportClientError(event: ClientErrorEvent): void {
  void fetch("/api/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {
    // Reporting must never replace the user-facing recovery path.
  });
}
