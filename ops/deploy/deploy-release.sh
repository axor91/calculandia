#!/usr/bin/env bash
# Single-transaction deploy orchestrator: verifies the GitHub run, downloads
# the artifact, installs the immutable release and runs activate + publish
# while holding ONE release lock for the whole cycle. Reached only through
# the SSH forced-command gate (ops/ssh/calculandia-ssh-gate.sh).
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "deploy-release must run as root" >&2
  exit 1
fi

sha=${1:-}
run_id=${2:-}
[[ $sha =~ ^[0-9a-f]{40}$ ]] || { echo "Usage: $0 <40-char-sha> <run-id>" >&2; exit 1; }
[[ $run_id =~ ^[0-9]{1,20}$ ]] || { echo "run-id must be numeric" >&2; exit 1; }

app_root=/var/www/calculandia
token_file=/etc/calculandia/github-token
repo=axor91/calculandia
api=https://api.github.com
node=/opt/nodejs/node-v22.22.2-linux-x64/bin/node
max_artifact_bytes=$((200 * 1024 * 1024))

exec 9>"${CALCULANDIA_LOCK_FILE:-/run/lock/calculandia-release.lock}"
flock -w 30 9 || { echo "Another Calculandia release operation is running" >&2; exit 1; }
export CALCULANDIA_LOCK_HELD=1

[[ -f $token_file ]] || { echo "GitHub token file is missing: $token_file" >&2; exit 1; }
token=$(<"$token_file")

gh_api() {
  curl --fail --silent --show-error --max-time 30 \
    --header "Authorization: Bearer $token" \
    --header "Accept: application/vnd.github+json" \
    --header "X-GitHub-Api-Version: 2022-11-28" "$@"
}

# 1. The run must be the successful release workflow for exactly this SHA
#    pushed to main in our repository.
run_json=$(gh_api "$api/repos/$repo/actions/runs/$run_id")
printf '%s' "$run_json" | "$node" -e '
  let input = "";
  process.stdin.on("data", (c) => (input += c));
  process.stdin.on("end", () => {
    const run = JSON.parse(input);
    const sha = process.argv[1];
    const checks = [
      [run.repository?.full_name === "axor91/calculandia", "repository"],
      [run.event === "push", "event"],
      [run.head_branch === "main", "branch"],
      [run.head_sha === sha, "head_sha"],
      [run.name === "release", "workflow"],
      [run.status === "completed", "status"],
      [run.conclusion === "success", "conclusion"],
    ];
    for (const [ok, label] of checks) {
      if (!ok) {
        console.error(`run verification failed: ${label}`);
        process.exit(1);
      }
    }
  });
' "$sha"

# 2. Locate the non-expired artifact for this SHA inside that run.
artifact_json=$(gh_api "$api/repos/$repo/actions/runs/$run_id/artifacts?per_page=100")
artifact_id=$(printf '%s' "$artifact_json" | "$node" -e '
  let input = "";
  process.stdin.on("data", (c) => (input += c));
  process.stdin.on("end", () => {
    const sha = process.argv[1];
    const max = Number(process.argv[2]);
    const list = JSON.parse(input).artifacts ?? [];
    const artifact = list.find(
      (a) => a.name === `calculandia-${sha}` && a.expired === false,
    );
    if (!artifact) {
      console.error("artifact for SHA not found or expired");
      process.exit(1);
    }
    if (!(artifact.size_in_bytes > 0 && artifact.size_in_bytes <= max)) {
      console.error(`artifact size out of bounds: ${artifact.size_in_bytes}`);
      process.exit(1);
    }
    process.stdout.write(String(artifact.id));
  });
' "$sha" "$max_artifact_bytes")

target=$app_root/releases/$sha
staging=""
cleanup() {
  if [[ -n $staging ]]; then rm -rf "$staging"; fi
}
trap cleanup EXIT

if [[ -d $target ]]; then
  # Idempotent retry: an existing release directory is trusted only if the
  # full guard accepts it; otherwise stop for manual RCA.
  echo "Release directory already exists; re-verifying"
  /usr/local/sbin/calculandia-verify-release "$sha"
else
  staging=$(mktemp -d "$app_root/.staging.XXXXXX")
  chmod 0700 "$staging"
  echo "Downloading artifact $artifact_id"
  gh_api --max-time 300 --location \
    --output "$staging/artifact.zip" \
    "$api/repos/$repo/actions/artifacts/$artifact_id/zip"
  actual_bytes=$(stat -c %s "$staging/artifact.zip")
  if ! ((actual_bytes > 0 && actual_bytes <= max_artifact_bytes)); then
    echo "Downloaded artifact size out of bounds: $actual_bytes" >&2
    exit 1
  fi
  # Reject absolute paths and parent traversal before extraction.
  if /usr/bin/unzip -Z1 "$staging/artifact.zip" |
    grep -Eq '^/|(^|/)\.\.(/|$)'; then
    echo "Artifact archive contains unsafe entry paths" >&2
    exit 1
  fi
  mkdir "$staging/extract"
  timeout 120 /usr/bin/unzip -q "$staging/artifact.zip" -d "$staging/extract"
  if find "$staging/extract" \
    \( -type l -o -type b -o -type c -o -type p -o -type s \) \
    -print -quit | grep -q .; then
    echo "Artifact contains non-regular files" >&2
    exit 1
  fi
  build_id=$(cat "$staging/extract/.next/BUILD_ID")
  if [[ $build_id != "$sha" ]]; then
    echo "Artifact BUILD_ID mismatch: $build_id" >&2
    exit 1
  fi
  mv "$staging/extract" "$target"
  staging_zip_dir=$staging
  staging=""
  rm -rf "$staging_zip_dir"
  chown -R root:root "$target"
  find "$target" -type d -exec chmod 0555 {} +
  find "$target" -type f -exec chmod 0444 {} +
  /usr/local/sbin/calculandia-verify-release "$sha"
fi

/usr/local/sbin/calculandia-activate "$sha"
/usr/local/sbin/calculandia-publish "$sha"

marker=/var/lib/calculandia-monitor/health.json
/usr/local/sbin/calculandia-host-check >/dev/null
restarts=$(grep -oP '"pm2Restarts":\K[0-9]+' "$marker")

# GC only after a fully successful publish: keep the active release plus the
# three newest others; never touch the current symlink target.
current_target=$(readlink -f "$app_root/current")
kept=0
while IFS= read -r name; do
  dir=$app_root/releases/$name
  [[ $(readlink -f "$dir") == "$current_target" ]] && continue
  kept=$((kept + 1))
  if ((kept > 3)); then
    chmod -R u+w "$dir"
    rm -rf "$dir"
    echo "GC removed old release $name"
  fi
done < <(ls -1t "$app_root/releases")

echo "DEPLOY_OK sha=$sha pm2Restarts=$restarts"
