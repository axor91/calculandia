import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GIT_DIFF_ARGS,
  classifyChangeRecords,
  classifyChanges,
  classifyDiffInput,
  parseNameStatusZ,
} from "../scripts/classify-changes.mjs";

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

// --- NUL-separated `--name-status` parsing -------------------------------

describe("name-status -z parsing", () => {
  it("reads two path fields for rename and copy records", () => {
    const records = parseNameStatusZ(
      "R100\0app/a.ts\0docs/a.md\0C75\0lib/src.ts\0lib/dst.ts\0M\0docs/x.md\0",
    );
    expect(records).toEqual([
      { status: "R100", letter: "R", paths: ["app/a.ts", "docs/a.md"] },
      { status: "C75", letter: "C", paths: ["lib/src.ts", "lib/dst.ts"] },
      { status: "M", letter: "M", paths: ["docs/x.md"] },
    ]);
  });

  it("classifies both endpoints of a rename record", () => {
    const flags = classifyChangeRecords(
      parseNameStatusZ("R100\0app/calculator.ts\0docs/calculator.md\0"),
    );
    expect(flags).toMatchObject({ app: true, docs: true });
  });

  it("rejects a truncated record instead of guessing", () => {
    expect(() => parseNameStatusZ("R100\0app/a.ts\0")).toThrow(/truncated/);
    expect(() => parseNameStatusZ("Z\0app/a.ts\0")).toThrow(/unrecognised/);
  });

  it("falls back to the full pipeline on legacy --name-only input", () => {
    const { flags, warning } = classifyDiffInput("docs/calculator.md\n");
    expect(flags).toMatchObject({
      docs: true,
      ops: true,
      app: true,
      dependencies: true,
    });
    expect(warning).toMatch(/not NUL-separated/);
  });

  it("falls back to the full pipeline on an unparseable record", () => {
    const { flags, warning } = classifyDiffInput("R100\0app/a.ts\0");
    expect(flags).toMatchObject({ app: true, ops: true, dependencies: true });
    expect(warning).toMatch(/unparseable/);
  });

  it("falls back to the full pipeline on an empty change list", () => {
    const { flags, warning } = classifyDiffInput("");
    expect(flags).toMatchObject({ app: true, ops: true, dependencies: true });
    expect(warning).toMatch(/empty change list/);
  });
});

// --- End-to-end against real git repositories ----------------------------

const CLASSIFIER = fileURLToPath(
  new URL("../scripts/classify-changes.mjs", import.meta.url),
);
const WORKFLOW = fileURLToPath(
  new URL("../.github/workflows/ci.yml", import.meta.url),
);

// Hermetic: ignore the developer's global/system git config (diff.renames,
// core.quotepath, signing hooks) so the fixture behaves like CI, and drop any
// repository pointers inherited from a git process running the suite (a hook,
// `git rebase --exec`), which would aim the fixture commands at the real repo.
const GIT_ENV: NodeJS.ProcessEnv = (() => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_AUTHOR_NAME: "fixture",
    GIT_AUTHOR_EMAIL: "fixture@example.invalid",
    GIT_COMMITTER_NAME: "fixture",
    GIT_COMMITTER_EMAIL: "fixture@example.invalid",
  };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_COMMON_DIR",
    "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES",
    "GIT_PREFIX",
  ]) {
    delete env[key];
  }
  return env;
})();

const fixtures: string[] = [];

afterAll(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, {
    cwd,
    env: GIT_ENV,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout;
}

function write(dir: string, relative: string, contents: string): void {
  const target = path.join(dir, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

/** A repo with one commit containing `files`. */
function createRepo(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "classify-fixture-"));
  fixtures.push(dir);
  git(dir, ["init", "-q", "-b", "main"]);
  for (const [relative, contents] of Object.entries(files)) {
    write(dir, relative, contents);
  }
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-qm", "base"]);
  return dir;
}

/** `git mv`, creating the destination directory first. */
function move(dir: string, from: string, to: string): void {
  mkdirSync(path.dirname(path.join(dir, to)), { recursive: true });
  git(dir, ["mv", from, to]);
}

/** Distinct enough content that rename detection has something to match on. */
function body(marker: string): string {
  return Array.from(
    { length: 40 },
    (_, index) => `export const ${marker}${index} = ${index};`,
  ).join("\n");
}

type Flags = {
  docs: boolean;
  ops: boolean;
  app: boolean;
  dependencies: boolean;
  unknown: string[];
};

function runClassifier(input: Buffer): { flags: Flags; stderr: string } {
  const result = spawnSync(process.execPath, [CLASSIFIER], { input });
  if (result.status !== 0) {
    throw new Error(`classifier exited ${result.status}: ${result.stderr}`);
  }
  return {
    flags: JSON.parse(result.stdout.toString("utf8")) as Flags,
    stderr: result.stderr.toString("utf8"),
  };
}

/** The exact CI pipeline: real git output piped into the real script. */
function classifyRange(dir: string, range: string): Flags {
  const diff = spawnSync("git", [...GIT_DIFF_ARGS, range], {
    cwd: dir,
    env: GIT_ENV,
    maxBuffer: 1 << 26,
  });
  if (diff.status !== 0) {
    throw new Error(`git diff failed: ${diff.stderr.toString("utf8")}`);
  }
  return runClassifier(diff.stdout).flags;
}

/** The pre-fix pipeline, kept as a control: `--name-only` loses rename sources. */
function classifyRangeNameOnly(dir: string, range: string): Flags {
  const diff = git(dir, ["diff", "--name-only", range]);
  return classifyChanges(diff.split("\n"));
}

describe("change classifier against real git renames", () => {
  it("keeps the app gates on when app code is renamed into docs/", () => {
    const dir = createRepo({
      "app/calculator.ts": body("a"),
      "docs/readme.md": "# docs\n",
    });
    move(dir, "app/calculator.ts", "docs/calculator.md");
    git(dir, ["commit", "-qm", "move app code into docs"]);

    // Control: this is exactly what the pre-fix pipeline saw.
    expect(classifyRangeNameOnly(dir, "HEAD~1...HEAD")).toMatchObject({
      app: false,
      docs: true,
    });

    expect(classifyRange(dir, "HEAD~1...HEAD")).toMatchObject({
      app: true,
      docs: true,
    });
  });

  it("keeps the app gates on when a doc is renamed into app/", () => {
    const dir = createRepo({
      "docs/calculator.md": body("d"),
      "app/page.tsx": "export default function Page() {}\n",
    });
    move(dir, "docs/calculator.md", "app/calculator.ts");
    git(dir, ["commit", "-qm", "move doc into app"]);

    expect(classifyRange(dir, "HEAD~1...HEAD")).toMatchObject({
      app: true,
      docs: true,
    });
  });

  it("unions the classes of a cross-module rename", () => {
    const dir = createRepo({ "lib/site.ts": body("s") });
    move(dir, "lib/site.ts", "ops/site.ts");
    git(dir, ["commit", "-qm", "move lib module into ops"]);

    expect(classifyRange(dir, "HEAD~1...HEAD")).toMatchObject({
      app: true,
      ops: true,
      docs: false,
    });
  });

  it("keeps the app gates on for a rename inside the app classes", () => {
    const dir = createRepo({ "components/Old.tsx": body("c") });
    move(dir, "components/Old.tsx", "app/kalkulyator/new.tsx");
    git(dir, ["commit", "-qm", "relocate component"]);

    expect(classifyRange(dir, "HEAD~1...HEAD")).toMatchObject({
      app: true,
      docs: false,
      ops: false,
    });
  });

  it("keeps the app gates on when app code is deleted outright", () => {
    const dir = createRepo({
      "app/gone.ts": body("g"),
      "docs/readme.md": "# docs\n",
    });
    git(dir, ["rm", "-q", "app/gone.ts"]);
    git(dir, ["commit", "-qm", "delete app module"]);

    expect(classifyRange(dir, "HEAD~1...HEAD")).toMatchObject({ app: true });
  });

  it("keeps the app gates on for a rewrite below the rename threshold", () => {
    const dir = createRepo({ "app/calculator.ts": body("a") });
    git(dir, ["rm", "-q", "app/calculator.ts"]);
    write(dir, "docs/calculator.md", "# nothing in common with the source\n");
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-qm", "rewrite while moving"]);

    // Below --find-renames' similarity threshold git emits D + A, so both
    // endpoints are reported anyway. The threshold is not an escape hatch.
    expect(classifyRange(dir, "HEAD~1...HEAD")).toMatchObject({
      app: true,
      docs: true,
    });
  });

  it("handles paths with spaces and non-ASCII characters verbatim", () => {
    const dir = createRepo({ "app/про бел/юникод.ts": body("u") });
    move(dir, "app/про бел/юникод.ts", "docs/юникод.md");
    git(dir, ["commit", "-qm", "move unicode module"]);

    const flags = classifyRange(dir, "HEAD~1...HEAD");
    expect(flags).toMatchObject({ app: true, docs: true });
    // -z suppresses core.quotepath escaping, so nothing lands in `unknown`.
    expect(flags.unknown).toEqual([]);
  });

  it("sees the rename through a merge commit on the branch tip", () => {
    const dir = createRepo({
      "app/calculator.ts": body("a"),
      "docs/readme.md": "# docs\n",
    });
    git(dir, ["checkout", "-q", "-b", "feature"]);
    move(dir, "app/calculator.ts", "docs/calculator.md");
    git(dir, ["commit", "-qm", "move app code into docs"]);
    git(dir, ["checkout", "-q", "main"]);
    write(dir, "docs/readme.md", "# docs\n\nmoved on\n");
    git(dir, ["commit", "-qam", "main moves on"]);
    git(dir, ["checkout", "-q", "feature"]);
    git(dir, ["merge", "-q", "--no-ff", "main", "-m", "merge main"]);

    // `A...B` diffs the merge base against B, so a merge tip is still a plain
    // two-tree diff and rename detection survives it.
    expect(classifyRange(dir, "main...HEAD")).toMatchObject({
      app: true,
      docs: true,
    });
  });

  it("classifies a docs-only change as docs, with the app gates off", () => {
    const dir = createRepo({ "docs/readme.md": "# docs\n" });
    write(dir, "docs/readme.md", "# docs\n\nmore text\n");
    write(dir, "README.md", "# root\n");
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-qm", "docs only"]);

    expect(classifyRange(dir, "HEAD~1...HEAD")).toMatchObject({
      docs: true,
      app: false,
      ops: false,
      dependencies: false,
    });
  });

  it("runs the full pipeline for an unknown path", () => {
    const dir = createRepo({ "docs/readme.md": "# docs\n" });
    write(dir, "mystery/new-dir/file.bin", "binary-ish\n");
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-qm", "unknown path"]);

    const flags = classifyRange(dir, "HEAD~1...HEAD");
    expect(flags).toMatchObject({ app: true, ops: true });
    expect(flags.unknown).toEqual(["mystery/new-dir/file.bin"]);
  });

  it("runs the full pipeline for an empty diff", () => {
    const dir = createRepo({ "docs/readme.md": "# docs\n" });
    git(dir, ["commit", "-q", "--allow-empty", "-m", "no changes"]);

    const diff = spawnSync("git", [...GIT_DIFF_ARGS, "HEAD~1...HEAD"], {
      cwd: dir,
      env: GIT_ENV,
    });
    expect(diff.stdout.length).toBe(0);

    const { flags, stderr } = runClassifier(diff.stdout);
    expect(flags).toMatchObject({
      docs: true,
      ops: true,
      app: true,
      dependencies: true,
    });
    expect(stderr).toMatch(/empty change list/);
  });
});

describe("ci workflow wiring", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");

  it("feeds the classifier the rename-aware diff", () => {
    const invocation = workflow
      .split("\n")
      .find(
        (line) =>
          line.includes("git diff") &&
          line.includes("scripts/classify-changes.mjs"),
      );
    expect(invocation, "classify step not found in ci.yml").toBeDefined();
    for (const flag of GIT_DIFF_ARGS.slice(1)) {
      expect(invocation).toContain(flag);
    }
    expect(invocation).not.toContain("--name-only");
  });
});
