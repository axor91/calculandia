import { execFileSync, spawnSync } from "node:child_process";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  makeArtifactReadOnly,
  writeArtifactManifest,
} from "./artifact-integrity.mjs";

const projectRoot = process.cwd();
const guard = path.join(projectRoot, "ops/deploy/verify-release.sh");
const sha = "a".repeat(40);
const currentUser = os.userInfo().username;
const currentGroup = execFileSync("id", ["-gn"], { encoding: "utf8" }).trim();

function runGuard(appRoot, expectedSuccess) {
  const result = spawnSync("bash", [guard, sha], {
    encoding: "utf8",
    env: {
      ...process.env,
      CALCULANDIA_GUARD_TEST_MODE: "1",
      CALCULANDIA_APP_ROOT: appRoot,
      CALCULANDIA_RELEASE_USER: currentUser,
      CALCULANDIA_RELEASE_GROUP: currentGroup,
    },
  });
  if (expectedSuccess && result.status !== 0) {
    throw new Error(`Release guard rejected a valid fixture: ${result.stderr}`);
  }
  if (!expectedSuccess && result.status === 0) {
    throw new Error("Release guard accepted an invalid fixture");
  }
}

async function fixture() {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), "calculandia-ops-"));
  const release = path.join(appRoot, "releases", sha);
  await mkdir(path.join(release, ".next", "static"), { recursive: true });
  await writeFile(path.join(release, "server.js"), "console.log('fixture');\n");
  await writeFile(path.join(release, ".next", "BUILD_ID"), `${sha}\n`);
  await writeFile(path.join(release, ".next", "static", "app.js"), "fixture\n");
  await writeArtifactManifest(release);
  await makeArtifactReadOnly(release);
  return { appRoot, release };
}

async function removeFixture(appRoot) {
  execFileSync("chmod", ["-R", "u+w", appRoot]);
  await rm(appRoot, { recursive: true, force: true });
}

async function invalidFixture(mutator) {
  const value = await fixture();
  try {
    await mutator(value.release);
    runGuard(value.appRoot, false);
  } finally {
    await removeFixture(value.appRoot);
  }
}

const valid = await fixture();
try {
  runGuard(valid.appRoot, true);
} finally {
  await removeFixture(valid.appRoot);
}

await invalidFixture(async (release) => {
  await chmod(release, 0o755);
  await writeFile(path.join(release, "extra.txt"), "not in manifest\n", {
    mode: 0o444,
  });
  await chmod(release, 0o555);
});

await invalidFixture(async (release) => {
  await chmod(release, 0o755);
  await symlink("server.js", path.join(release, "unexpected-link"));
  await chmod(release, 0o555);
});

await invalidFixture(async (release) => {
  await chmod(path.join(release, "server.js"), 0o644);
});

await invalidFixture(async (release) => {
  await chmod(release, 0o755);
  await writeFile(path.join(release, "line\nbreak"), "unsafe\n", {
    mode: 0o444,
  });
  await chmod(release, 0o555);
});

await invalidFixture(async (release) => {
  const nested = path.join(release, "nested");
  await chmod(release, 0o755);
  await mkdir(nested, { mode: 0o555 });
  await chmod(nested, 0o755);
  await writeFile(path.join(nested, "ARTIFACT.sha256"), "untracked\n", {
    mode: 0o444,
  });
  await chmod(nested, 0o555);
  await chmod(release, 0o555);
});

await invalidFixture(async (release) => {
  await chmod(release, 0o755);
  await writeFile(path.join(release, ".env.production"), "SECRET=unsafe\n", {
    mode: 0o444,
  });
  await chmod(release, 0o555);
});

const executableScripts = [
  "ops/deploy/activate-release.sh",
  "ops/deploy/external-smoke.sh",
  "ops/deploy/publish-release.sh",
  "ops/deploy/rollback-release.sh",
  "ops/deploy/verify-release.sh",
  "ops/deploy/deploy-release.sh",
  "ops/ssh/calculandia-ssh-gate.sh",
  "ops/monitor/calculandia-host-check.sh",
  "ops/certbot/20-calculandia-nginx-reload",
];
for (const script of executableScripts) {
  execFileSync("bash", ["-n", script], { cwd: projectRoot, stdio: "pipe" });
  const mode = Number.parseInt(
    execFileSync("stat", ["-c", "%a", script], {
      cwd: projectRoot,
      encoding: "utf8",
    }).trim(),
    8,
  );
  if ((mode & 0o111) === 0)
    throw new Error(`Ops script is not executable: ${script}`);
}
execFileSync(process.execPath, ["--check", "ops/pm2/ecosystem.config.cjs"], {
  cwd: projectRoot,
  stdio: "pipe",
});

const [hostCheckScript, hostCheckService] = await Promise.all([
  readFile(
    path.join(projectRoot, "ops/monitor/calculandia-host-check.sh"),
    "utf8",
  ),
  readFile(
    path.join(projectRoot, "ops/systemd/calculandia-host-check.service"),
    "utf8",
  ),
]);
if (
  /runuser\s+-u\s+calculandia/.test(hostCheckScript) &&
  /^RestrictSUIDSGID=(?:true|yes)$/m.test(hostCheckService)
) {
  throw new Error(
    "Host checker cannot combine runuser privilege drop with RestrictSUIDSGID",
  );
}
if (
  /runuser\s+-u\s+calculandia/.test(hostCheckScript) &&
  /^(?:User|Group)=/m.test(hostCheckService)
) {
  throw new Error(
    "Host checker cannot declare User=/Group=: explicit User= with " +
      "NoNewPrivileges plus a seccomp option clears CAP_SETUID and breaks runuser",
  );
}

const { readdir } = await import("node:fs/promises");
const workflowDir = path.join(projectRoot, ".github/workflows");
const workflowFiles = (await readdir(workflowDir)).filter((name) =>
  name.endsWith(".yml"),
);
let workflowsCombined = "";
for (const name of workflowFiles) {
  const contents = await readFile(path.join(workflowDir, name), "utf8");
  workflowsCombined += contents;
  const unpinned = contents.match(/uses:\s*[^@\s]+@(?![0-9a-f]{40}\b)\S+/g);
  if (unpinned) {
    throw new Error(
      `GitHub action is not full-SHA pinned in ${name}: ${unpinned.join(", ")}`,
    );
  }
}
const release = await readFile(path.join(workflowDir, "release.yml"), "utf8");
if (
  !release.includes("include-hidden-files: true") ||
  !release.includes("artifact:verify-uploaded")
) {
  throw new Error("Release artifact upload/download round-trip is incomplete");
}
if (!workflowsCombined.includes("cancel-in-progress: false")) {
  throw new Error("Release pipeline must not be cancellable mid-run");
}

console.log(
  "Ops tool tests passed: release guard negative fixtures, shell/PM2 syntax and full-SHA CI actions",
);
