#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "publish-release must run as root" >&2
  exit 1
fi

if [[ ${CALCULANDIA_LOCK_HELD:-0} != 1 ]]; then
  exec 9>"${CALCULANDIA_LOCK_FILE:-/run/lock/calculandia-release.lock}"
  flock -n 9 || { echo "Another Calculandia release operation is running" >&2; exit 1; }
fi

sha=${1:-}
if [[ ! $sha =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <40-character-git-sha>" >&2
  exit 1
fi

app_root=/var/www/calculandia
active_config=/etc/nginx/sites-enabled/calculandia.conf
holding_config=/etc/calculandia/nginx/holding.conf
production_config=/etc/calculandia/nginx/production.conf
external_smoke=/usr/local/sbin/calculandia-external-smoke
host_check=/usr/local/sbin/calculandia-host-check

[[ $(basename "$(readlink -f "$app_root/current")") == "$sha" ]] || {
  echo "Current release does not match requested production SHA" >&2
  exit 1
}
health=$(curl --silent --show-error --max-time 3 http://127.0.0.1:3212/healthz)
[[ $health == *'"status":"ok"'* && $health == *"\"version\":\"$sha\""* ]] || {
  echo "Current loopback health does not match requested production SHA" >&2
  exit 1
}
for required in "$holding_config" "$production_config" "$external_smoke" "$host_check"; do
  [[ -f $required ]] || { echo "Required production file is missing: $required" >&2; exit 1; }
done
[[ -x $external_smoke ]]
[[ -x $host_check ]]

activate_config() {
  local source=$1
  local temporary="$active_config.new"
  install -o root -g root -m 0644 "$source" "$temporary"
  mv -Tf "$temporary" "$active_config"
  if ! nginx -t; then
    echo "nginx syntax check failed for $source" >&2
    return 1
  fi
  if ! systemctl reload nginx; then
    echo "nginx reload failed for $source" >&2
    return 1
  fi
}

fail_closed=true
restore_holding() {
  if [[ $fail_closed == true ]]; then
    echo "Production publish did not complete; restoring holding" >&2
    activate_config "$holding_config" || echo "CRITICAL: automatic holding restore failed" >&2
  fi
}
trap restore_holding EXIT

"$host_check"
activate_config "$production_config"

# systemctl reload is graceful: for a short window an old worker holding the
# previous (holding, 503) config can still serve new connections. Wait until
# the production config is externally active before the strict smoke, bounded
# so a genuinely broken switch still fails closed.
config_active=false
for _ in $(seq 1 30); do
  code=$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 3 https://calculandia.ru/ || true)
  if [[ $code == 200 ]]; then
    config_active=true
    break
  fi
  sleep 1
done
[[ $config_active == true ]] || {
  echo "Production config did not become externally active within 30 s" >&2
  exit 1
}

"$external_smoke" "$sha"

fail_closed=false
trap - EXIT
echo "Published and externally verified production release $sha"
