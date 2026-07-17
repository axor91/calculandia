#!/usr/bin/env bash
# SSH forced-command gate for the Calculandia deploy key. Installed once by a
# human as /usr/local/sbin/calculandia-ssh-gate and referenced from
# authorized_keys as:
#   restrict,command="/usr/local/sbin/calculandia-ssh-gate" ssh-ed25519 AAAA...
# The gate accepts only typed commands; the client-supplied command line is
# never executed. This bootstrap file is deliberately NOT auto-updated by
# deploys: changing it requires a human on the server.
set -Eeuo pipefail

command_line=${SSH_ORIGINAL_COMMAND:-}
logger -t calculandia-ssh-gate -- "request: ${command_line}"

read -r verb arg1 arg2 extra <<<"$command_line" || true
if [[ -n ${extra:-} ]]; then
  echo "Unexpected arguments" >&2
  exit 1
fi

case $verb in
  deploy)
    [[ ${arg1:-} =~ ^[0-9a-f]{40}$ ]] || { echo "deploy: bad sha" >&2; exit 1; }
    [[ ${arg2:-} =~ ^[0-9]{1,20}$ ]] || { echo "deploy: bad run id" >&2; exit 1; }
    exec /usr/local/sbin/calculandia-deploy-release "$arg1" "$arg2"
    ;;
  status)
    [[ -z ${arg1:-} ]] || { echo "status takes no arguments" >&2; exit 1; }
    readlink -f /var/www/calculandia/current
    cat /var/lib/calculandia-monitor/health.json 2>/dev/null || echo "no marker"
    ;;
  rollback)
    [[ ${arg1:-} =~ ^[0-9a-f]{40}$ ]] || { echo "rollback: bad sha" >&2; exit 1; }
    [[ -z ${arg2:-} ]] || { echo "rollback takes one argument" >&2; exit 1; }
    exec /usr/local/sbin/calculandia-rollback "$arg1"
    ;;
  *)
    echo "Unknown command" >&2
    exit 1
    ;;
esac
