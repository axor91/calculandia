// Classifies a change set into pipeline classes and prints a JSON flags object.
//
// stdin format: the raw output of
//   git diff --name-status -z --find-renames <range>
// i.e. NUL-separated fields, one record per change:
//   "M\0path\0"                 for A/B/D/M/T/U/X
//   "R100\0old-path\0new-path\0" for R/C (two endpoints)
//
// Why not `git diff --name-only`: for a real rename it prints ONLY the
// destination path, so `R100 app/calculator.ts -> docs/calculator.md` looked
// like a docs-only change and the app gates (unit/type/build) were switched
// off while application code was being deleted. Every endpoint of every record
// is classified and the classes are unioned — strongest profile wins. Adding a
// path can only turn flags on, never off.
//
// `-z` additionally disables path quoting, so non-ASCII and whitespace paths
// arrive verbatim instead of as C-quoted `"docs/\321\216.md"` strings.
//
// Copy detection is deliberately NOT requested: plain `--find-copies` only
// pairs a copy with a source that is itself modified in the same diff (so the
// source class is already counted), and `--find-copies-harder` is quadratic.
// `C` records are still parsed in case a repo config enables them.
//
// Fail-safe: an unclassified path, a malformed record, non-NUL (legacy
// `--name-only`) input, or an empty change set all enable the full pipeline.

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Canonical git invocation. The workflow must stay in sync with this list;
// tests/classifyChanges.test.ts asserts that it does.
export const GIT_DIFF_ARGS = ["diff", "--name-status", "-z", "--find-renames"];

// Statuses carrying two path fields (source + destination).
const TWO_PATH_STATUSES = new Set(["R", "C"]);
// Statuses carrying a single path field.
// A added, B broken pairing, D deleted, M modified,
// T type changed, U unmerged, X "unknown" (git bug marker).
const ONE_PATH_STATUSES = new Set(["A", "B", "D", "M", "T", "U", "X"]);

const RULES = [
  {
    test: (p) => p === "package.json" || p === "package-lock.json",
    apply: ["app", "dependencies"],
  },
  {
    test: (p) => p.startsWith("docs/") && p.endsWith(".md"),
    apply: ["docs"],
  },
  { test: (p) => !p.includes("/") && p.endsWith(".md"), apply: ["docs"] },
  { test: (p) => p.startsWith("ops/"), apply: ["ops"] },
  { test: (p) => p.startsWith(".github/"), apply: ["ops"] },
  { test: (p) => p.startsWith("scripts/"), apply: ["ops"] },
  { test: (p) => p.startsWith("app/"), apply: ["app"] },
  { test: (p) => p.startsWith("components/"), apply: ["app"] },
  { test: (p) => p.startsWith("catalog/"), apply: ["app"] },
  { test: (p) => p.startsWith("calculations/"), apply: ["app"] },
  { test: (p) => p.startsWith("lib/"), apply: ["app"] },
  { test: (p) => p.startsWith("logic/"), apply: ["app"] },
  { test: (p) => p.startsWith("public/"), apply: ["app"] },
  { test: (p) => p.startsWith("tests/"), apply: ["app"] },
  {
    test: (p) =>
      [
        "next.config.mjs",
        "next.config.js",
        "next.config.ts",
        "tsconfig.json",
        "playwright.config.ts",
        "vitest.config.ts",
        "vitest.config.mts",
        "postcss.config.mjs",
        "tailwind.config.ts",
        "eslint.config.mjs",
        ".lighthouserc.json",
        ".lighthouserc.nightly.json",
        ".prettierrc",
        ".prettierignore",
        ".gitignore",
        ".nvmrc",
        ".env.example",
      ].includes(p),
    apply: ["app"],
  },
];

function emptyFlags() {
  return {
    docs: false,
    ops: false,
    app: false,
    dependencies: false,
    unknown: [],
  };
}

/** Every gate on: the fail-safe profile. */
export function fullPipelineFlags() {
  return {
    docs: true,
    ops: true,
    app: true,
    dependencies: true,
    unknown: [],
  };
}

/** Classes a single path belongs to, or null when nothing matches. */
export function classifyPath(path) {
  for (const rule of RULES) {
    if (rule.test(path)) return rule.apply;
  }
  return null;
}

function applyPath(flags, path) {
  if (!path) return;
  const applied = classifyPath(path);
  if (applied) {
    for (const flag of applied) flags[flag] = true;
    return;
  }
  if (!flags.unknown.includes(path)) flags.unknown.push(path);
  // Fail-safe: an unclassified path runs the full pipeline.
  flags.app = true;
  flags.ops = true;
}

/**
 * Classifies a plain list of paths. Kept for direct unit testing of the rule
 * table; it cannot see rename sources and must not be fed to the CI gate.
 */
export function classifyChanges(paths) {
  const flags = emptyFlags();
  for (const path of paths) {
    const trimmed = path.trim();
    if (!trimmed) continue;
    applyPath(flags, trimmed);
  }
  return flags;
}

/**
 * Parses `git diff --name-status -z` output into
 * `{ status, letter, paths: string[] }` records.
 * Throws on anything it cannot account for — the caller fails safe.
 */
export function parseNameStatusZ(input) {
  const fields = input.split("\0");
  // A complete stream ends with NUL, leaving one trailing empty field.
  if (fields.length > 0 && fields[fields.length - 1] === "") fields.pop();

  const records = [];
  let index = 0;
  while (index < fields.length) {
    const status = fields[index];
    if (!status) {
      throw new Error(`empty status field at position ${index}`);
    }
    const letter = status[0].toUpperCase();
    let arity;
    if (TWO_PATH_STATUSES.has(letter)) arity = 2;
    else if (ONE_PATH_STATUSES.has(letter)) arity = 1;
    else throw new Error(`unrecognised status ${JSON.stringify(status)}`);

    const paths = fields.slice(index + 1, index + 1 + arity);
    if (paths.length !== arity || paths.some((path) => path === "")) {
      throw new Error(
        `truncated record for status ${JSON.stringify(status)} at position ${index}`,
      );
    }
    records.push({ status, letter, paths });
    index += 1 + arity;
  }
  return records;
}

/** Union of the classes of every endpoint of every record. */
export function classifyChangeRecords(records) {
  const flags = emptyFlags();
  for (const record of records) {
    for (const path of record.paths) applyPath(flags, path);
  }
  return flags;
}

/**
 * Full stdin -> flags pipeline with every fail-safe applied.
 * Returns `{ flags, warning }`; `warning` is non-null whenever the fail-safe
 * profile was substituted for a real classification.
 */
export function classifyDiffInput(input) {
  if (input.trim() === "") {
    return {
      flags: fullPipelineFlags(),
      warning: "empty change list; forcing full pipeline",
    };
  }
  if (!input.includes("\0")) {
    return {
      flags: fullPipelineFlags(),
      warning:
        "change list is not NUL-separated (expected `git " +
        GIT_DIFF_ARGS.join(" ") +
        "`); forcing full pipeline",
    };
  }
  try {
    return {
      flags: classifyChangeRecords(parseNameStatusZ(input)),
      warning: null,
    };
  } catch (error) {
    return {
      flags: fullPipelineFlags(),
      warning: `unparseable change list (${error.message}); forcing full pipeline`,
    };
  }
}

function invokedDirectly() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return pathToFileURL(realpathSync(entry)).href === import.meta.url;
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  // Bytes, not text: `-z` paths are raw and may not be valid UTF-8. Anything
  // undecodable becomes U+FFFD, fails to match a rule and trips the fail-safe.
  const input = Buffer.concat(chunks).toString("utf8");
  const { flags, warning } = classifyDiffInput(input);
  if (warning) console.error(`classify-changes: ${warning}`);
  process.stdout.write(JSON.stringify(flags));
}
