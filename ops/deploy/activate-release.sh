#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "activate-release must run as root" >&2
  exit 1
fi

exec 9>/run/lock/calculandia-release.lock
flock -n 9 || { echo "Another Calculandia release operation is running" >&2; exit 1; }

sha=${1:-}
if [[ ! $sha =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <40-character-git-sha>" >&2
  exit 1
fi

app_root=/var/www/calculandia
release="$app_root/releases/$sha"
node=/opt/nodejs/node-v22.22.2-linux-x64/bin/node
pm2=/usr/lib/node_modules/pm2/bin/pm2
pm2_home=/var/lib/calculandia/.pm2
pm2_config=/etc/calculandia/ecosystem.config.cjs
release_guard=/usr/local/sbin/calculandia-verify-release
candidate_log="/var/lib/calculandia/logs/candidate-$sha.log"
candidate_pid=

cleanup_candidate() {
  if [[ -n ${candidate_pid:-} ]] && kill -0 "$candidate_pid" 2>/dev/null; then
    kill "$candidate_pid" 2>/dev/null || true
    wait "$candidate_pid" 2>/dev/null || true
  fi
}
trap cleanup_candidate EXIT

[[ -d $release ]] || { echo "Release not found: $release" >&2; exit 1; }
[[ -x $node ]] || { echo "Node runtime not found: $node" >&2; exit 1; }
[[ -f $pm2_config ]] || { echo "PM2 config not found: $pm2_config" >&2; exit 1; }
[[ -x $release_guard ]] || { echo "Release guard not found: $release_guard" >&2; exit 1; }
env -i PATH=/usr/sbin:/usr/bin:/sbin:/bin "$release_guard" "$sha"

if runuser -u calculandia -- test -w "$release"; then
  echo "Runtime user can write to release" >&2
  exit 1
fi

if ss -ltnH 'sport = :3213' | grep -q .; then
  echo "Candidate port 3213 is already in use" >&2
  exit 1
fi

install -o calculandia -g calculandia -m 0640 /dev/null "$candidate_log"
(
  cd "$release"
  exec runuser -u calculandia -- env -i \
    HOME=/var/lib/calculandia \
    USER=calculandia \
    LOGNAME=calculandia \
    PATH=/opt/nodejs/node-v22.22.2-linux-x64/bin:/usr/local/bin:/usr/bin:/bin \
    NODE_ENV=production \
    HOSTNAME=127.0.0.1 \
    PORT=3213 \
    NEXT_PUBLIC_SITE_URL=https://calculandia.ru \
    "$node" server.js
) >"$candidate_log" 2>&1 &
candidate_pid=$!

healthy=false
for _ in $(seq 1 80); do
  if ! kill -0 "$candidate_pid" 2>/dev/null; then
    echo "Candidate exited before becoming healthy" >&2
    tail -n 80 "$candidate_log" >&2 || true
    exit 1
  fi
  health=$(curl --silent --show-error --max-time 2 \
    http://127.0.0.1:3213/healthz 2>/dev/null || true)
  if [[ $health == *'"status":"ok"'* && $health == *"\"version\":\"$sha\""* ]]; then
    healthy=true
    break
  fi
  sleep 0.25
done
[[ $healthy == true ]] || { echo "Candidate healthcheck failed" >&2; exit 1; }

home=$(curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3213/)
grep -Fq 'href="https://calculandia.ru"' <<<"$home" || {
  echo "Canonical origin missing from candidate home" >&2
  exit 1
}
curl --fail --silent --show-error --output /dev/null --max-time 5 \
  http://127.0.0.1:3213/kalkulyator/procent-ot-chisla

asset=$(grep -oE '/_next/static/[^"? ]+' <<<"$home" | head -n 1 || true)
[[ -n $asset ]] || { echo "No static asset found in candidate HTML" >&2; exit 1; }
curl --fail --silent --show-error --output /dev/null --max-time 5 \
  "http://127.0.0.1:3213$asset"

cleanup_candidate
candidate_pid=
if ss -ltnH 'sport = :3213' | grep -q .; then
  echo "Candidate port remained occupied after shutdown" >&2
  exit 1
fi

previous=
if [[ -L $app_root/current ]]; then
  previous=$(readlink -f "$app_root/current" || true)
fi
temporary_link="$app_root/.current-$sha"
rm -f "$temporary_link"
ln -s "releases/$sha" "$temporary_link"
mv -Tf "$temporary_link" "$app_root/current"

pm2_command=(
  runuser -u calculandia -- env -i
  HOME=/var/lib/calculandia
  USER=calculandia
  LOGNAME=calculandia
  PATH=/opt/nodejs/node-v22.22.2-linux-x64/bin:/usr/local/bin:/usr/bin:/bin
  PM2_HOME="$pm2_home"
  "$node" "$pm2"
)

pm2_run() {
  (
    cd /var/lib/calculandia
    "${pm2_command[@]}" "$@"
  )
}

wait_for_release() {
  local expected_sha=$1
  local health
  for _ in $(seq 1 60); do
    health=$(curl --silent --show-error --max-time 2 \
      http://127.0.0.1:3212/healthz 2>/dev/null || true)
    if [[ $health == *'"status":"ok"'* && $health == *"\"version\":\"$expected_sha\""* ]]; then
      return 0
    fi
    sleep 0.25
  done
  return 1
}

restore_previous() {
  local failed_sha=$1
  if [[ -n $previous && -d $previous ]]; then
    local previous_sha
    previous_sha=$(basename "$previous")
    local fallback="$app_root/.rollback-$failed_sha"
    rm -f "$fallback"
    ln -s "releases/$previous_sha" "$fallback"
    mv -Tf "$fallback" "$app_root/current"
    if ! pm2_run restart calculandia-web --update-env; then
      echo "CRITICAL: failed to restart previous release $previous_sha" >&2
      return 1
    fi
    if ! wait_for_release "$previous_sha"; then
      echo "CRITICAL: previous release $previous_sha did not recover exact health" >&2
      return 1
    fi
    if ! pm2_run save; then
      echo "CRITICAL: failed to persist restored release $previous_sha" >&2
      return 1
    fi
    echo "Previous release $previous_sha restored and verified" >&2
    return 0
  fi

  rm -f "$app_root/current"
  pm2_run delete calculandia-web >/dev/null 2>&1 || true
  if ! pm2_run save; then
    echo "CRITICAL: failed to persist empty PM2 state" >&2
    return 1
  fi
  echo "No previous release existed; application process removed" >&2
}

if ! pm2_run startOrReload "$pm2_config" --only calculandia-web --update-env; then
  echo "Activation command failed; restoring previous release" >&2
  restore_previous "$sha" || exit 2
  exit 1
fi

if wait_for_release "$sha"; then
  if ! pm2_run save; then
    echo "Failed to persist activated release; restoring previous release" >&2
    restore_previous "$sha" || exit 2
    exit 1
  fi
  echo "Activated healthy release $sha"
  exit 0
fi

echo "Active process failed release identity check; rolling back" >&2
restore_previous "$sha" || exit 2
exit 1
