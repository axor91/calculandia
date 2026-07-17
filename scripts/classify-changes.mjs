// Classifies a changed-file list into pipeline classes. Reads newline-separated
// paths from stdin (git diff --name-only) and prints a JSON flags object.
// Fail-safe: any path that matches no known class enables the full pipeline.

export function classifyChanges(paths) {
  const flags = {
    docs: false,
    ops: false,
    app: false,
    dependencies: false,
    unknown: [],
  };

  const rules = [
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

  for (const path of paths) {
    const trimmed = path.trim();
    if (!trimmed) continue;
    let matched = false;
    for (const rule of rules) {
      if (rule.test(trimmed)) {
        for (const flag of rule.apply) flags[flag] = true;
        matched = true;
        break;
      }
    }
    if (!matched) {
      flags.unknown.push(trimmed);
      // Fail-safe: an unclassified path runs the full pipeline.
      flags.app = true;
      flags.ops = true;
    }
  }

  return flags;
}

const invokedDirectly =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());

if (invokedDirectly) {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) input += chunk;
  const paths = input.split("\n").filter(Boolean);
  if (paths.length === 0) {
    // An empty diff should never silently skip everything.
    console.error("classify-changes: empty change list; forcing full pipeline");
    process.stdout.write(
      JSON.stringify({
        docs: true,
        ops: true,
        app: true,
        dependencies: true,
        unknown: [],
      }),
    );
    process.exit(0);
  }
  process.stdout.write(JSON.stringify(classifyChanges(paths)));
}
