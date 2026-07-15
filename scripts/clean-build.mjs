import { chmod, lstat, readdir, rm } from "node:fs/promises";
import path from "node:path";

const nextDirectory = path.resolve(".next");

async function makeDirectoriesWritable(directory) {
  let metadata;
  try {
    metadata = await lstat(directory);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  if (metadata.isSymbolicLink() || !metadata.isDirectory()) return;
  await chmod(directory, 0o700);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      await makeDirectoriesWritable(path.join(directory, entry.name));
    }
  }
}

await makeDirectoriesWritable(nextDirectory);
await rm(nextDirectory, { recursive: true, force: true });
