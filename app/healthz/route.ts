import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getHealthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  let buildId: string | null = null;
  try {
    buildId = await readFile(
      path.join(process.cwd(), ".next", "BUILD_ID"),
      "utf8",
    );
  } catch {
    // A missing immutable identity makes the process unhealthy.
  }

  const health = getHealthStatus(buildId);

  return NextResponse.json(
    { status: health.status, version: health.version },
    {
      status: health.httpStatus,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
