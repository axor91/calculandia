import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  verifyArtifactManifest,
  verifyArtifactReadOnly,
} from "./artifact-integrity.mjs";
import { assertCleanReleaseId } from "./release-id.mjs";

const root = process.cwd();
const artifact = path.join(root, ".next", "standalone");
const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const status = execFileSync(
  "git",
  ["status", "--porcelain", "--untracked-files=normal"],
  { encoding: "utf8" },
).trim();

if (status) {
  throw new Error("Production release verification requires a clean worktree");
}

const buildId = (
  await readFile(path.join(artifact, ".next", "BUILD_ID"), "utf8")
).trim();
assertCleanReleaseId(buildId, sha);
await verifyArtifactManifest(artifact);
await verifyArtifactReadOnly(artifact);

console.log(`Production release artifact verified for ${sha}`);
