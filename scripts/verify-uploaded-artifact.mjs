import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { artifactTree, verifyArtifactManifest } from "./artifact-integrity.mjs";

const [artifactArgument, expectedBuildId] = process.argv.slice(2);

if (!artifactArgument || !/^[0-9a-f]{40}$/.test(expectedBuildId ?? "")) {
  throw new Error(
    "Usage: verify-uploaded-artifact.mjs <artifact-directory> <40-character-git-sha>",
  );
}

const artifact = path.resolve(process.cwd(), artifactArgument);
const serverFile = path.join(artifact, "server.js");
const buildIdFile = path.join(artifact, ".next", "BUILD_ID");
const staticDirectory = path.join(artifact, ".next", "static");

if (!(await stat(serverFile)).isFile()) {
  throw new Error("Downloaded artifact server.js is missing");
}
if (!(await stat(staticDirectory)).isDirectory()) {
  throw new Error("Downloaded artifact .next/static directory is missing");
}

const buildId = (await readFile(buildIdFile, "utf8")).trim();
if (buildId !== expectedBuildId) {
  throw new Error(
    `Downloaded artifact BUILD_ID mismatch: expected ${expectedBuildId}, received ${buildId}`,
  );
}

await verifyArtifactManifest(artifact);

const { files } = await artifactTree(artifact);
const staticPrefix = `${staticDirectory}${path.sep}`;
const staticFiles = files.filter((file) => file.startsWith(staticPrefix));
if (staticFiles.length === 0) {
  throw new Error("Downloaded artifact .next/static directory is empty");
}

console.log(
  `Downloaded artifact verified after upload: ${files.length} files, ${staticFiles.length} static assets, build ${buildId}, SHA-256 manifest valid`,
);
