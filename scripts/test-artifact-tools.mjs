import { open, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";
import {
  scanFileForPatterns,
  verifyArtifactManifest,
  writeArtifactManifest,
} from "./artifact-integrity.mjs";

const directory = await mkdtemp(
  path.join(os.tmpdir(), "calculandia-artifact-test-"),
);
const largeFile = path.join(directory, "large-fixture.bin");
const marker = Buffer.from("DATABASE_URL");

try {
  const handle = await open(largeFile, "w");
  try {
    await handle.truncate(26 * 1024 * 1024);
    await handle.write(marker, 0, marker.length, 65_530);
  } finally {
    await handle.close();
  }

  const match = await scanFileForPatterns(largeFile, [
    { label: "large-file marker", value: marker },
  ]);
  if (match?.label !== "large-file marker") {
    throw new Error(
      "Streaming scanner missed a marker in a file larger than 25 MiB",
    );
  }

  await writeArtifactManifest(directory);
  await verifyArtifactManifest(directory);

  const handleForTamper = await open(largeFile, "r+");
  try {
    await handleForTamper.write(Buffer.from("tamper"), 0, 6, 0);
  } finally {
    await handleForTamper.close();
  }

  let tamperDetected = false;
  try {
    await verifyArtifactManifest(directory);
  } catch {
    tamperDetected = true;
  }
  if (!tamperDetected)
    throw new Error("Artifact manifest did not detect tampering");

  console.log(
    "Artifact tool regression tests passed, including >25 MiB stream scan",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
