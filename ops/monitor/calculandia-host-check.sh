#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "calculandia-host-check must run as root" >&2
  exit 1
fi

app_root=/var/www/calculandia
monitor_dir=/var/lib/calculandia/monitor
health_file="$monitor_dir/health.json"
production_config=/etc/calculandia/nginx/production.conf
active_config=/etc/nginx/sites-enabled/calculandia.conf
node=/opt/nodejs/node-v22.22.2-linux-x64/bin/node
pm2=/usr/lib/node_modules/pm2/bin/pm2

install -d -o root -g www-data -m 0750 "$monitor_dir"

fail() {
  rm -f "$health_file"
  logger -p daemon.err -t calculandia-host-check -- "$1"
  echo "$1" >&2
  exit 1
}

systemctl is-active --quiet nginx || fail "nginx is not active"
systemctl is-active --quiet calculandia-pm2.service || fail "calculandia-pm2.service is not active"

current=$(readlink -f "$app_root/current" || true)
release=${current##*/}
[[ $release =~ ^[0-9a-f]{40}$ && -d $current ]] || fail "current release identity is invalid"

health=$(curl --silent --show-error --max-time 3 http://127.0.0.1:3212/healthz 2>/dev/null || true)
[[ $health == *'"status":"ok"'* && $health == *"\"version\":\"$release\""* ]] || fail "loopback health does not match current release"

pm2_json=$(runuser -u calculandia -- env -i \
  HOME=/var/lib/calculandia \
  USER=calculandia \
  LOGNAME=calculandia \
  PATH=/opt/nodejs/node-v22.22.2-linux-x64/bin:/usr/local/bin:/usr/bin:/bin \
  PM2_HOME=/var/lib/calculandia/.pm2 \
  "$node" "$pm2" jlist 2>/dev/null) || fail "PM2 process list is unavailable"

pm2_state=$(printf '%s' "$pm2_json" | "$node" -e '
let input="";
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const processes = JSON.parse(input);
  const app = processes.find(item => item.name === "calculandia-web");
  if (!app) process.exit(1);
  const env = app.pm2_env || {};
  const restarts = Number(env.restart_time);
  const unstable = Number(env.unstable_restarts || 0);
  if (env.status !== "online" || !Number.isSafeInteger(restarts) || restarts < 0 || !Number.isSafeInteger(unstable) || unstable < 0 || unstable > 0) process.exit(1);
  process.stdout.write(String(restarts));
});
') || fail "PM2 process state is invalid or unstable"

disk_used=$(df -P "$app_root" | awk 'NR==2 { gsub(/%/, "", $5); print $5 }')
[[ $disk_used =~ ^[0-9]+$ ]] || fail "disk usage could not be measured"
(( disk_used < 92 )) || fail "disk usage is ${disk_used}% (critical threshold 92%)"
if (( disk_used >= 88 )); then
  logger -p daemon.warning -t calculandia-host-check -- "disk usage warning: ${disk_used}% (critical threshold 92%)"
fi

memory_available_kib=$(awk '/^MemAvailable:/ { print $2 }' /proc/meminfo)
[[ $memory_available_kib =~ ^[0-9]+$ ]] || fail "available memory could not be measured"
(( memory_available_kib >= 262144 )) || fail "available memory is below 256 MiB"

if cmp --silent "$active_config" "$production_config"; then
  recent_log=$(mktemp)
  trap 'rm -f "$recent_log"' EXIT
  if [[ -f /var/log/calculandia/access.log ]]; then
    for offset in 0 1 2 3 4; do
      stamp=$(LC_ALL=C date -u -d "-$offset minute" '+%d/%b/%Y:%H:%M')
      grep -F "[$stamp:" /var/log/calculandia/access.log >>"$recent_log" || true
    done
  fi
  requests=$(wc -l <"$recent_log")
  server_errors=$(sed -nE 's/.*" ([0-9]{3}) [0-9]+ [0-9.]+$/\1/p' "$recent_log" | awk '$1 >= 500 && $1 <= 599 { count++ } END { print count + 0 }')
  if (( requests >= 20 && server_errors >= 5 && server_errors * 100 >= requests * 5 )); then
    fail "nginx 5xx rate is above 5% (${server_errors}/${requests} over five minutes)"
  fi
  rm -f "$recent_log"
  trap - EXIT
fi

checked_at=$(date +%s)
temporary=$(mktemp "$monitor_dir/.health.XXXXXX")
printf '{"status":"ok","release":"%s","checkedAt":%s,"pm2Restarts":%s}\n' \
  "$release" "$checked_at" "$pm2_state" >"$temporary"
chown root:www-data "$temporary"
chmod 0640 "$temporary"
mv -f "$temporary" "$health_file"

logger -p daemon.info -t calculandia-host-check -- "healthy release=$release restarts=$pm2_state disk=${disk_used}%"
echo "Calculandia host healthy: release=$release restarts=$pm2_state disk=${disk_used}%"
