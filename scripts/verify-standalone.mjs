import { execFileSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  artifactTree,
  scanFileForPatterns,
  verifyArtifactManifest,
  verifyArtifactReadOnly,
} from "./artifact-integrity.mjs";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const forbiddenMarkers = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "ADMIN_PASS",
  "ADMIN_USER",
  "CSP_EXTRA_CONNECT",
];

function expectedBuildId() {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const status = execFileSync(
    "git",
    ["status", "--porcelain", "--untracked-files=normal"],
    { encoding: "utf8" },
  ).trim();
  return status ? `${sha}-dirty` : sha;
}

async function readLocalSecretValues() {
  const values = [];
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !entry.name.startsWith(".env") ||
      entry.name === ".env.example"
    ) {
      continue;
    }

    const content = await readFile(path.join(root, entry.name), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(
        /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/,
      );
      if (!match || match[1].startsWith("NEXT_PUBLIC_")) continue;

      let value = match[2].trim();
      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'")))
      ) {
        value = value.slice(1, -1);
      }

      if (value.length >= 8 && !value.startsWith("${")) {
        values.push({ key: match[1], value: Buffer.from(value) });
      }
    }
  }

  return values;
}

const serverFile = path.join(standaloneDir, "server.js");
const staticDir = path.join(standaloneDir, ".next", "static");
const standaloneBuildIdFile = path.join(standaloneDir, ".next", "BUILD_ID");
const rootBuildIdFile = path.join(root, ".next", "BUILD_ID");

if (!(await stat(serverFile)).isFile())
  throw new Error("Standalone server.js is missing");
if (!(await stat(staticDir)).isDirectory()) {
  throw new Error("Standalone static directory is missing");
}

const { files } = await artifactTree(standaloneDir);
const localSecretValues = await readLocalSecretValues();
const staticFiles = files.filter((file) =>
  file.startsWith(`${staticDir}${path.sep}`),
);
if (staticFiles.length === 0)
  throw new Error("Standalone static directory is empty");

const [standaloneBuildId, rootBuildId] = await Promise.all([
  readFile(standaloneBuildIdFile, "utf8"),
  readFile(rootBuildIdFile, "utf8"),
]);
const normalizedBuildId = standaloneBuildId.trim();
if (
  normalizedBuildId !== rootBuildId.trim() ||
  normalizedBuildId !== expectedBuildId()
) {
  throw new Error("Artifact BUILD_ID is not bound to the current Git worktree");
}

await verifyArtifactManifest(standaloneDir);
await verifyArtifactReadOnly(standaloneDir);

const patterns = [
  ...forbiddenMarkers.map((marker) => ({
    label: `forbidden marker ${marker}`,
    value: Buffer.from(marker),
  })),
  ...localSecretValues.map((secret) => ({
    label: `value of ${secret.key}`,
    value: secret.value,
  })),
];

for (const file of files) {
  const basename = path.basename(file);
  if (basename === ".env" || basename.startsWith(".env.")) {
    throw new Error(`Environment file leaked into artifact: ${file}`);
  }

  const match = await scanFileForPatterns(file, patterns);
  if (match) {
    throw new Error(`${match.label} found in ${path.relative(root, file)}`);
  }
}

console.log(
  `Standalone artifact verified: ${files.length} files, ${staticFiles.length} static assets, build ${normalizedBuildId}, SHA-256 manifest valid, read-only modes, ${localSecretValues.length} local secret values absent`,
);
