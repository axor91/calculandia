// Verifies that every relative Markdown link in docs/ and the root README
// points at an existing file. External links are not fetched: this check must
// stay fast and deterministic.

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(full)));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

const files = [
  path.join(root, "README.md"),
  ...(await markdownFiles(path.join(root, "docs"))),
];
const linkPattern = /\[[^\]]*\]\(([^)\s]+)\)/g;
let failures = 0;

for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const withoutAnchor = target.split("#")[0];
    if (!withoutAnchor) continue;
    const resolved = path.resolve(path.dirname(file), decodeURI(withoutAnchor));
    try {
      await stat(resolved);
    } catch {
      console.error(`${path.relative(root, file)}: broken link -> ${target}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`Docs link check failed: ${failures} broken link(s)`);
  process.exit(1);
}
console.log(`Docs link check passed for ${files.length} files`);
