#!/usr/bin/env node
// Production dependency audit gate.
//
// `npm audit` не умеет исключать конкретные advisory, а один transitive пакет
// (postcss внутри тарбола next) физически не переопределяется через overrides.
// Поэтому гейт запускает audit сам и падает на любом high/critical, кроме явно
// внесённых сюда advisory с датой истечения — см. docs/security/dependency-exceptions.md.

import { spawnSync } from "node:child_process";

const BLOCKING_SEVERITIES = new Set(["high", "critical"]);

// Каждая запись обязана иметь ссылку на раздел dependency-exceptions.md и expiry.
// После expires гейт снова красный — исключение нужно пересмотреть, а не продлить молча.
const ALLOWLIST = [
  {
    id: "GHSA-qx2v-qp2m-jg93",
    package: "postcss",
    expires: "2026-10-01",
    exception: "DEP-2026-001",
  },
  {
    id: "GHSA-6g55-p6wh-862q",
    package: "postcss",
    expires: "2026-10-01",
    exception: "DEP-2026-001",
  },
  {
    id: "GHSA-r28c-9q8g-f849",
    package: "postcss",
    expires: "2026-10-01",
    exception: "DEP-2026-001",
  },
];

function runAudit() {
  const result = spawnSync(
    "npm",
    ["audit", "--omit=dev", "--json", "--no-fund", "--no-audit-level"],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  if (result.error) {
    throw result.error;
  }
  // npm audit завершается кодом 1 при наличии находок — это ожидаемо.
  const raw = result.stdout?.trim();
  if (!raw) {
    throw new Error(
      `npm audit не вернул JSON (exit ${result.status}): ${result.stderr?.slice(0, 500) ?? ""}`,
    );
  }
  return JSON.parse(raw);
}

function advisoriesFrom(report) {
  const found = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via === "string") continue;
      if (!BLOCKING_SEVERITIES.has(via.severity)) continue;
      const id = via.url?.split("/").pop() ?? `${via.source}`;
      found.set(id, {
        id,
        package: via.name ?? vulnerability.name,
        severity: via.severity,
        title: via.title ?? "",
        url: via.url ?? "",
      });
    }
  }
  return [...found.values()];
}

function main() {
  const today = new Date().toISOString().slice(0, 10);
  const allowed = new Map(ALLOWLIST.map((entry) => [entry.id, entry]));

  const expired = ALLOWLIST.filter((entry) => entry.expires < today);
  if (expired.length > 0) {
    for (const entry of expired) {
      console.error(
        `audit allowlist истёк: ${entry.id} (${entry.exception}, expires ${entry.expires}) — пересмотреть исключение`,
      );
    }
    process.exit(1);
  }

  const advisories = advisoriesFrom(runAudit());
  const blocking = advisories.filter((item) => !allowed.has(item.id));
  const accepted = advisories.filter((item) => allowed.has(item.id));

  for (const item of accepted) {
    const entry = allowed.get(item.id);
    console.log(
      `accepted ${item.severity} ${item.package} ${item.id} (${entry.exception}, до ${entry.expires})`,
    );
  }

  if (blocking.length > 0) {
    for (const item of blocking) {
      console.error(
        `blocking ${item.severity} ${item.package} ${item.id} ${item.title} ${item.url}`,
      );
    }
    console.error(
      `Найдено ${blocking.length} неисключённых high/critical advisory в production-дереве.`,
    );
    process.exit(1);
  }

  console.log(
    `audit:prod passed — high/critical вне allowlist нет (принято исключений: ${accepted.length}).`,
  );
}

main();
