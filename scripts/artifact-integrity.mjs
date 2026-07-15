import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { chmod, lstat, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const artifactManifestName = "ARTIFACT.sha256";

async function walk(directory, root, files, directories) {
  const metadata = await lstat(directory);
  if (metadata.isSymbolicLink()) {
    throw new Error(`Symbolic links are not allowed in artifact: ${directory}`);
  }
  if (!metadata.isDirectory()) {
    files.push(directory);
    return;
  }

  directories.push(directory);
  for (const entry of await readdir(directory)) {
    await walk(path.join(directory, entry), root, files, directories);
  }
}

export async function artifactTree(root) {
  const files = [];
  const directories = [];
  await walk(root, root, files, directories);
  files.sort();
  directories.sort();
  return { files, directories };
}

export async function sha256File(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

export async function scanFileForPatterns(file, patterns) {
  if (patterns.length === 0) return null;
  const maximumPatternLength = Math.max(
    ...patterns.map(({ value }) => value.length),
  );
  let tail = Buffer.alloc(0);

  for await (const chunk of createReadStream(file)) {
    const data = tail.length ? Buffer.concat([tail, chunk]) : chunk;
    for (const pattern of patterns) {
      if (data.includes(pattern.value)) return pattern;
    }
    tail = data.subarray(Math.max(0, data.length - maximumPatternLength + 1));
  }

  return null;
}

export async function buildArtifactManifest(root) {
  const { files } = await artifactTree(root);
  const lines = [];

  for (const file of files) {
    const relativePath = path.relative(root, file).split(path.sep).join("/");
    if (relativePath === artifactManifestName) continue;
    if (relativePath.includes("\n") || relativePath.includes("\r")) {
      throw new Error(`Unsafe artifact filename: ${relativePath}`);
    }
    lines.push(`${await sha256File(file)}  ${relativePath}`);
  }

  return `${lines.join("\n")}\n`;
}

export async function writeArtifactManifest(root) {
  const manifestPath = path.join(root, artifactManifestName);
  await writeFile(manifestPath, await buildArtifactManifest(root), {
    encoding: "utf8",
    mode: 0o444,
  });
}

export async function verifyArtifactManifest(root) {
  const manifestPath = path.join(root, artifactManifestName);
  const [actual, expected] = await Promise.all([
    readFile(manifestPath, "utf8"),
    buildArtifactManifest(root),
  ]);
  if (actual !== expected)
    throw new Error("Artifact SHA-256 manifest mismatch");
}

export async function makeArtifactReadOnly(root) {
  const { files, directories } = await artifactTree(root);
  for (const file of files) await chmod(file, 0o444);
  for (const directory of directories.sort((a, b) => b.length - a.length)) {
    await chmod(directory, 0o555);
  }
}

export async function verifyArtifactReadOnly(root) {
  const { files, directories } = await artifactTree(root);
  for (const target of [...directories, ...files]) {
    const metadata = await lstat(target);
    if ((metadata.mode & 0o222) !== 0) {
      throw new Error(`Artifact path is writable: ${target}`);
    }
  }
}
