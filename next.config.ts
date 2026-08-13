import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { adsEnabled } from "./lib/ads";
import { securityHeaders } from "./lib/security-headers";

const isDevelopment = process.env.NODE_ENV !== "production";

function resolveBuildId(): string {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error("Git HEAD must be a full SHA-1 before building");
  }

  const status = execFileSync(
    "git",
    ["status", "--porcelain", "--untracked-files=normal"],
    { encoding: "utf8" },
  ).trim();
  return status ? `${sha}-dirty` : sha;
}

const buildId = resolveBuildId();
const headers = securityHeaders({ isDevelopment, adsEnabled });

const nextConfig: NextConfig = {
  output: "standalone",
  generateBuildId: async () => buildId,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
