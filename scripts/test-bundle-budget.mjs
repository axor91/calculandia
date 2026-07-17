// Deterministic first-load JS budget: gzip size of every script the app
// build manifest lists for a page. Unlike Lighthouse on a shared runner this
// does not depend on CPU throttling, so it can gate every PR without flaking.
// Baseline measured 2026-07-17 on the 30-calculator catalog: ~106.5 KiB per
// page; budgets carry ~17% headroom. Raising a budget requires review.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const budgetsKiB = {
  "/page": 125,
  "/kalkulyator/procent-ot-chisla/page": 125,
  "/kalkulyator/ipoteka/page": 125,
};

const root = process.cwd();
const manifest = JSON.parse(
  await readFile(path.join(root, ".next", "app-build-manifest.json"), "utf8"),
);

let failed = false;
for (const [page, budget] of Object.entries(budgetsKiB)) {
  const files = manifest.pages[page];
  if (!files) {
    console.error(`Bundle budget: page ${page} is missing from the manifest`);
    failed = true;
    continue;
  }
  let total = 0;
  for (const file of new Set(files)) {
    if (!file.endsWith(".js")) continue;
    const contents = await readFile(path.join(root, ".next", file));
    total += gzipSync(contents, { level: 6 }).length;
  }
  const kib = total / 1024;
  const status = kib <= budget ? "ok" : "OVER BUDGET";
  console.log(
    `${page}: ${kib.toFixed(1)} KiB gzip (budget ${budget}) ${status}`,
  );
  if (kib > budget) failed = true;
}

if (failed) {
  console.error("Bundle budget exceeded");
  process.exit(1);
}
