import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.SMOKE_PORT || "3213");
const origin = `http://127.0.0.1:${port}`;
const standaloneDir = path.resolve(".next", "standalone");
const buildId = (
  await readFile(path.join(standaloneDir, ".next", "BUILD_ID"), "utf8")
).trim();

async function artifactSnapshot(directory, relativeDirectory = "") {
  const snapshot = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      snapshot.push(...(await artifactSnapshot(absolutePath, relativePath)));
    } else {
      const metadata = await stat(absolutePath);
      snapshot.push(`${relativePath}:${metadata.size}:${metadata.mtimeMs}`);
    }
  }
  return snapshot.sort();
}

const artifactBeforeSmoke = await artifactSnapshot(standaloneDir);

const child = spawn(process.execPath, ["server.js"], {
  cwd: standaloneDir,
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: String(port),
    APP_RELEASE: "forged-runtime-release-must-be-ignored",
    NEXT_PUBLIC_SITE_URL: "https://calculandia.ru",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
let stderrOutput = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  stderrOutput += text;
});

const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitUntilReady() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null)
      throw new Error(`Standalone exited early\n${output}`);
    try {
      const response = await fetch(`${origin}/healthz`, { cache: "no-store" });
      if (response.status === 200) return;
    } catch {
      // The process is still starting.
    }
    await pause(100);
  }
  throw new Error(`Standalone did not become ready\n${output}`);
}

async function expectStatus(pathname, expectedStatus) {
  const response = await fetch(`${origin}${pathname}`, { redirect: "manual" });
  if (response.status !== expectedStatus) {
    throw new Error(
      `${pathname}: expected ${expectedStatus}, received ${response.status}`,
    );
  }
  return response;
}

function telemetryHeaders(clientAddress, contentType = "application/json") {
  return {
    "Content-Type": contentType,
    Origin: "https://calculandia.ru",
    "Sec-Fetch-Site": "same-origin",
    "X-Forwarded-For": clientAddress,
  };
}

async function runSmoke() {
  await waitUntilReady();

  const healthResponse = await expectStatus("/healthz", 200);
  const health = await healthResponse.json();
  if (health.status !== "ok" || health.version !== buildId) {
    throw new Error(`Unexpected health payload: ${JSON.stringify(health)}`);
  }

  const homeResponse = await expectStatus("/", 200);
  const home = await homeResponse.text();
  if (!home.includes('href="https://calculandia.ru"')) {
    throw new Error("Production canonical origin is missing from home HTML");
  }

  const assets = [
    ...home.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+)[^"]*"/g),
  ].map((match) => match[1]);
  if (assets.length === 0)
    throw new Error("No Next.js static assets found in home HTML");
  for (const asset of [...new Set(assets)].slice(0, 4)) {
    await expectStatus(asset, 200);
  }

  for (const pathname of ["/admin", "/login", "/api/calculators"]) {
    await expectStatus(pathname, 404);
  }

  const stderrBeforeCalculatorProbes = stderrOutput;
  for (const pathname of [
    "/calculator/equations",
    "/calculator/unknown",
    ...Array.from(
      { length: 8 },
      (_, index) => `/calculator/probe-${index + 1}`,
    ),
  ]) {
    const response = await expectStatus(pathname, 404);
    const cacheControl = response.headers.get("cache-control") || "";
    if (
      !cacheControl.includes("no-store") ||
      cacheControl.includes("s-maxage")
    ) {
      throw new Error(
        `${pathname}: unsafe 404 cache policy ${cacheControl || "missing"}`,
      );
    }
  }
  await pause(50);
  const calculatorProbeStderr = stderrOutput.slice(
    stderrBeforeCalculatorProbes.length,
  );
  if (calculatorProbeStderr.trim()) {
    throw new Error(
      `Expected calculator 404s emitted stderr:\n${calculatorProbeStderr.slice(0, 1000)}`,
    );
  }

  const acceptedErrorEvent = await fetch(`${origin}/api/client-errors`, {
    method: "POST",
    headers: telemetryHeaders("198.51.100.10"),
    body: JSON.stringify({
      source: "route_boundary",
      context: "/smoke",
      digest: "smoke",
    }),
  });
  if (acceptedErrorEvent.status !== 204) {
    throw new Error(
      `Valid client error event returned ${acceptedErrorEvent.status}`,
    );
  }

  const rejectedErrorEvent = await fetch(`${origin}/api/client-errors`, {
    method: "POST",
    headers: telemetryHeaders("198.51.100.11"),
    body: JSON.stringify({
      source: "route_boundary",
      context: "/smoke",
      message: "blocked",
    }),
  });
  if (rejectedErrorEvent.status !== 400) {
    throw new Error(
      `Client error event with extra fields returned ${rejectedErrorEvent.status}`,
    );
  }

  const oversizedErrorEvent = await fetch(`${origin}/api/client-errors`, {
    method: "POST",
    headers: telemetryHeaders("198.51.100.12"),
    body: JSON.stringify({
      source: "route_boundary",
      context: "x".repeat(1200),
    }),
  });
  if (oversizedErrorEvent.status !== 413) {
    throw new Error(
      `Oversized client error event returned ${oversizedErrorEvent.status}`,
    );
  }

  const crossSiteErrorEvent = await fetch(`${origin}/api/client-errors`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      Origin: "https://evil.example",
      "Sec-Fetch-Site": "cross-site",
      "X-Forwarded-For": "198.51.100.13",
    },
    body: JSON.stringify({ source: "route_boundary", context: "/poison" }),
  });
  if (crossSiteErrorEvent.status !== 403) {
    throw new Error(
      `Cross-site client error event returned ${crossSiteErrorEvent.status}`,
    );
  }

  const wrongMediaTypeEvent = await fetch(`${origin}/api/client-errors`, {
    method: "POST",
    headers: telemetryHeaders("198.51.100.14", "text/plain"),
    body: JSON.stringify({ source: "route_boundary", context: "/poison" }),
  });
  if (wrongMediaTypeEvent.status !== 415) {
    throw new Error(
      `Text client error event returned ${wrongMediaTypeEvent.status}`,
    );
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const attackerEvent = await fetch(`${origin}/api/client-errors`, {
      method: "POST",
      headers: telemetryHeaders("198.51.100.20"),
      body: JSON.stringify({ source: "route_boundary", context: "/attacker" }),
    });
    if (attackerEvent.status !== 204) {
      throw new Error(
        `Attacker quota request ${attempt + 1} returned ${attackerEvent.status}`,
      );
    }
  }

  const exhaustedAttackerEvent = await fetch(`${origin}/api/client-errors`, {
    method: "POST",
    headers: telemetryHeaders("198.51.100.20"),
    body: JSON.stringify({ source: "route_boundary", context: "/attacker" }),
  });
  if (exhaustedAttackerEvent.status !== 429) {
    throw new Error(
      `Exhausted attacker quota returned ${exhaustedAttackerEvent.status}`,
    );
  }

  const isolatedLegitimateEvent = await fetch(`${origin}/api/client-errors`, {
    method: "POST",
    headers: telemetryHeaders("198.51.100.21"),
    body: JSON.stringify({ source: "route_boundary", context: "/legitimate" }),
  });
  if (isolatedLegitimateEvent.status !== 204) {
    throw new Error(
      `Attacker quota starved another client: ${isolatedLegitimateEvent.status}`,
    );
  }

  await pause(25);
  const loggedErrorsBeforeImageBurst = [
    ...output.matchAll(/"event":"(?:request|client)_error"/g),
  ].length;

  const startedAt = Date.now();
  const images = await Promise.all(
    Array.from({ length: 12 }, async () => {
      const response = await expectStatus("/opengraph-image.png", 200);
      if (response.headers.get("content-type") !== "image/png") {
        throw new Error("Open Graph image must be a static PNG");
      }
      return Buffer.from(await response.arrayBuffer());
    }),
  );
  const hashes = new Set(
    images.map((image) => createHash("sha256").update(image).digest("hex")),
  );
  if (hashes.size !== 1)
    throw new Error("Open Graph image responses are not byte-identical");
  if (Date.now() - startedAt > 3000)
    throw new Error("Static Open Graph burst exceeded 3 seconds");
  await pause(25);
  const loggedErrorsAfterImageBurst = [
    ...output.matchAll(/"event":"(?:request|client)_error"/g),
  ].length;
  if (loggedErrorsAfterImageBurst !== loggedErrorsBeforeImageBurst) {
    throw new Error("Static Open Graph requests emitted error logs");
  }

  const artifactAfterSmoke = await artifactSnapshot(standaloneDir);
  if (
    JSON.stringify(artifactAfterSmoke) !== JSON.stringify(artifactBeforeSmoke)
  ) {
    throw new Error(
      "Standalone artifact was mutated by read-only smoke requests",
    );
  }

  console.log(`Standalone smoke passed for immutable build ${buildId}`);
}

try {
  await runSmoke();
} finally {
  if (child.exitCode === null) child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    pause(2000).then(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }),
  ]);
}
