import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  makeArtifactReadOnly,
  writeArtifactManifest,
} from "./artifact-integrity.mjs";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const standaloneDir = path.join(nextDir, "standalone");

async function removeEnvironmentFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeEnvironmentFiles(target);
      continue;
    }
    if (entry.name === ".env" || entry.name.startsWith(".env.")) {
      await rm(target, { force: true });
    }
  }
}

await mkdir(path.join(standaloneDir, ".next"), { recursive: true });
await rm(path.join(standaloneDir, ".next", "static"), {
  recursive: true,
  force: true,
});
await cp(
  path.join(nextDir, "static"),
  path.join(standaloneDir, ".next", "static"),
  {
    recursive: true,
  },
);

const publicDir = path.join(root, "public");
try {
  await rm(path.join(standaloneDir, "public"), {
    recursive: true,
    force: true,
  });
  await cp(publicDir, path.join(standaloneDir, "public"), { recursive: true });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

await removeEnvironmentFiles(standaloneDir);
await writeArtifactManifest(standaloneDir);
await makeArtifactReadOnly(standaloneDir);
