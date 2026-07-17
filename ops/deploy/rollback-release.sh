#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "rollback-release must run as root" >&2
  exit 1
fi

if [[ ${CALCULANDIA_LOCK_HELD:-0} != 1 ]]; then
  exec 9>/run/lock/calculandia-release.lock
  flock -n 9 || { echo "Another Calculandia release operation is running" >&2; exit 1; }
fi

sha=${1:-}
if [[ ! $sha =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <40-character-git-sha>" >&2
  exit 1
fi

app_root=/var/www/calculandia
release="$app_root/releases/$sha"
node=/opt/nodejs/node-v22.22.2-linux-x64/bin/node
pm2=/usr/lib/node_modules/pm2/bin/pm2
release_guard=/usr/local/sbin/calculandia-verify-release

[[ -d $release ]] || { echo "Release not found: $release" >&2; exit 1; }
[[ -x $release_guard ]] || { echo "Release guard not found: $release_guard" >&2; exit 1; }
env -i PATH=/usr/sbin:/usr/bin:/sbin:/bin "$release_guard" "$sha"

pm2_run() {
  (
    cd /var/lib/calculandia
    runuser -u calculandia -- env -i \
      HOME=/var/lib/calculandia \
      USER=calculandia \
      LOGNAME=calculandia \
      PATH=/opt/nodejs/node-v22.22.2-linux-x64/bin:/usr/local/bin:/usr/bin:/bin \
      PM2_HOME=/var/lib/calculandia/.pm2 \
      "$node" "$pm2" "$@"
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

previous=
if [[ -L $app_root/current ]]; then
  previous=$(readlink -f "$app_root/current" || true)
fi

restore_previous() {
  if [[ -n $previous && -d $previous ]]; then
    local previous_sha
    previous_sha=$(basename "$previous")
    local fallback="$app_root/.rollback-recovery-$sha"
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

temporary_link="$app_root/.rollback-$sha"
rm -f "$temporary_link"
ln -s "releases/$sha" "$temporary_link"
mv -Tf "$temporary_link" "$app_root/current"

if ! pm2_run restart calculandia-web --update-env; then
  echo "Rollback restart failed; restoring original release" >&2
  restore_previous || exit 2
  exit 1
fi

if wait_for_release "$sha"; then
  if ! pm2_run save; then
    echo "Rollback target is healthy but PM2 save failed; restoring original release" >&2
    restore_previous || exit 2
    exit 1
  fi
  echo "Rolled back to healthy release $sha"
  exit 0
fi

echo "Rollback identity check failed; restoring original release" >&2
restore_previous || exit 2
exit 1
