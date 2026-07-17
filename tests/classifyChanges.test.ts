import { describe, expect, it } from "vitest";
import { classifyChanges } from "../scripts/classify-changes.mjs";

describe("change classifier", () => {
  it("routes docs-only changes to the docs class", () => {
    const flags = classifyChanges(["docs/README.md", "README.md"]);
    expect(flags).toMatchObject({
      docs: true,
      ops: false,
      app: false,
      dependencies: false,
    });
    expect(flags.unknown).toEqual([]);
  });

  it("routes ops, workflow and tooling scripts to the ops class", () => {
    const flags = classifyChanges([
      "ops/deploy/publish-release.sh",
      ".github/workflows/ci.yml",
      "scripts/test-ops-tools.mjs",
    ]);
    expect(flags).toMatchObject({ ops: true, app: false, docs: false });
  });

  it("routes application and test code to the app class", () => {
    for (const path of [
      "app/kalkulyator/skidka/page.tsx",
      "components/calculator/finance/Discount.tsx",
      "catalog/wave2/finance.ts",
      "calculations/math/mean.ts",
      "lib/site.ts",
      "public/favicon.ico",
      "tests/launchCatalog.test.ts",
      "playwright.config.ts",
      ".lighthouserc.json",
    ]) {
      expect(classifyChanges([path]).app, path).toBe(true);
    }
  });

  it("marks dependency manifests as app plus dependencies", () => {
    const flags = classifyChanges(["package-lock.json"]);
    expect(flags).toMatchObject({ app: true, dependencies: true });
  });

  it("fails safe on unknown paths by enabling the full pipeline", () => {
    const flags = classifyChanges(["mystery/new-dir/file.bin"]);
    expect(flags).toMatchObject({ app: true, ops: true });
    expect(flags.unknown).toEqual(["mystery/new-dir/file.bin"]);
  });

  it("markdown outside docs/ and the root is not silently docs", () => {
    const flags = classifyChanges(["app/kalkulyator/notes.md"]);
    expect(flags.app).toBe(true);
    expect(flags.docs).toBe(false);
  });

  it("mixed changes accumulate every class", () => {
    const flags = classifyChanges([
      "docs/implementation/status.md",
      "ops/nginx/calculandia.conf",
      "components/Header.tsx",
      "package.json",
    ]);
    expect(flags).toMatchObject({
      docs: true,
      ops: true,
      app: true,
      dependencies: true,
    });
  });

  it("ignores blank lines", () => {
    const flags = classifyChanges(["", "  ", "docs/README.md"]);
    expect(flags.docs).toBe(true);
    expect(flags.unknown).toEqual([]);
  });
});
