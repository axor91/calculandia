import type { Instrumentation } from "next";
import { writeErrorLog } from "@/lib/server-log";

export function register() {
  // The hook is intentionally present even when no external error provider is configured.
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
) => {
  const digest =
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined;

  writeErrorLog({
    event: "request_error",
    route: request.path,
    digest,
  });
};
