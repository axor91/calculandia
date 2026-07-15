#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "rollback-release must run as root" >&2
  exit 1
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

[[ -d $release ]] || { echo "Release not found: $release" >&2; exit 1; }
[[ $(tr -d '\r\n' < "$release/.next/BUILD_ID") == "$sha" ]] || {
  echo "BUILD_ID does not match release directory" >&2
  exit 1
}

temporary_link="$app_root/.rollback-$sha"
rm -f "$temporary_link"
ln -s "releases/$sha" "$temporary_link"
mv -Tf "$temporary_link" "$app_root/current"

pm2_run() {
  (
    cd /var/lib/calculandia
    runuser -u calculandia -- env \
      HOME=/var/lib/calculandia \
      PM2_HOME=/var/lib/calculandia/.pm2 \
      "$node" "$pm2" "$@"
  )
}

pm2_run restart calculandia-web --update-env
pm2_run save

for _ in $(seq 1 60); do
  health=$(curl --silent --show-error --max-time 2 \
    http://127.0.0.1:3212/healthz 2>/dev/null || true)
  if [[ $health == *'"status":"ok"'* && $health == *"\"version\":\"$sha\""* ]]; then
    echo "Rolled back to healthy release $sha"
    exit 0
  fi
  sleep 0.25
done

echo "Rollback identity check failed" >&2
exit 1
