# Production design и runbook

- Статус: **Approved design; команды уточняются по фактической конфигурации при deploy**
- Target: `calculandia.ru` / `5.188.28.98`

## 1. Подтверждено

- SSH alias `kappers-prod` работает с root access.
- nginx активен и управляет FastPanel sites.
- Глобальный Node `v20.20.2`, PM2 7 используются существующими приложениями. Node 20 уже EOL и не выбирается для Calculandia.
- PostgreSQL и Redis существуют на сервере, но Calculandia launch их не использует.
- Порт `3212` был свободен 2026-07-15.
- Домен пока не имеет отдельного FastPanel nginx site и отвечает parking/default page.

Наличие backup/monitoring внешних систем для Calculandia до deploy не обнаружено; состояние других сайтов не является доказательством готовности Calculandia.

## 2. Layout

```text
/var/www/calculandia/
  releases/{sha}/
    server.js
    .next/
    public/
    package.json
  shared/
    .env.production.local
    logs/
  current -> releases/{sha}
```

Runtime process запускается не из исходной рабочей копии. Artifact immutable; последние три healthy release сохраняются.

Calculandia build/runtime используют Node `22.22.2` из `/opt/nodejs/node-v22.22.2-linux-x64`. Перед установкой официальный tarball сверяется с published `SHASUMS256.txt`. Глобальные `node/npm` не заменяются, чтобы не затронуть другие сайты. Local/CI и production major/minor совпадают; patch upgrade выполняется отдельным dependency/runtime maintenance commit.

## 3. Process

- bind: `127.0.0.1:3212`;
- PM2 name: `calculandia-web`;
- interpreter: `/opt/nodejs/node-v22.22.2-linux-x64/bin/node`;
- initial instances: 1;
- memory restart threshold задаётся после измерения, initial 512 MiB;
- graceful reload после healthcheck нового artifact;
- stdout/stderr проходят PM2 log rotation, secrets/input values не логируются.

## 4. nginx

- port 80: ACME challenge и 301 на `https://calculandia.ru$request_uri`;
- `www`: 301 на non-www;
- canonical HTTPS server proxy на `127.0.0.1:3212`;
- proxy headers Host/X-Forwarded-Proto/X-Forwarded-For;
- hashed `_next/static` — immutable one year;
- HTML — no immutable, controlled revalidation;
- request body limit ≤ 1 MiB (публичных POST launch нет);
- connect/read/send timeouts;
- application является единственным источником CSP/Referrer/Permissions/X-Content-Type headers; nginx добавляет только transport-specific HSTS после проверки HTTPS;
- custom 502 не маскируется как 200.

TLS: ACME/Let's Encrypt с автоматическим renew и проверкой `nginx -t`. Сертификат покрывает apex и `www`, даже если `www` только redirect.

## 5. Deployment sequence

1. Local/CI release gates green.
2. Создать standalone artifact с release SHA/version.
3. Передать в новый `/releases/{sha}` без изменения `current`.
4. Проверить ownership/modes и env schema.
5. Запустить candidate standalone artifact на `127.0.0.1:3213` отдельным временным process с Node 22.
6. `curl http://127.0.0.1:3213/healthz` ожидает 200 и `version = candidate SHA`; затем проверяются representative HTML и static assets именно на `3213`.
7. Гарантированно остановить temporary candidate process и подтвердить освобождение `3213`, включая failure path через shell trap.
8. Atomic `ln -sfn releases/{sha} current`.
9. PM2 reload/start с явным Node 22 interpreter и `--update-env`.
10. `curl http://127.0.0.1:3212/healthz` ожидает 200 и тот же candidate SHA. Несовпадение немедленно запускает rollback.
11. `nginx -t`, reload только при config change.
12. External smoke HTTPS/canonical/headers/pages/assets и повторная проверка release SHA через публичный health endpoint.
13. Сохранить evidence и пометить release healthy.

## 6. Rollback

Trigger:

- healthcheck не 200;
- 5xx на home/representative calculator;
- missing static assets;
- canonical/TLS/security regression;
- формульная ошибка release-blocking severity.

Procedure:

1. Выбрать предыдущий healthy SHA.
2. Переключить `current` symlink.
3. `pm2 reload calculandia-web --update-env`.
4. Проверить local/external health and smoke.
5. Не удалять failed artifact до RCA.

Target rollback time: ≤10 минут. Поскольку mutable launch DB отсутствует, data rollback не нужен.

## 7. Health/monitoring

`/healthz` возвращает:

```json
{ "status": "ok", "version": "<git-sha>" }
```

Он не раскрывает env, paths, dependency versions или host details.

Minimum monitoring:

- external HTTPS uptime каждые 1–5 минут;
- certificate expiry alert;
- PM2 process status/restarts;
- nginx 5xx rate;
- disk/memory alerts;
- optional sanitized error telemetry.

Перед launch выполняется test alert через внешний uptime provider. Отсутствие внешнего monitor является release blocker; локальная cron-проверка не считается эквивалентом.

## 8. RTO/RPO/SLO

- Availability target launch: 99.9% monthly, после появления данных пересматривается.
- RTO application rollback: 10 минут.
- RPO public content: 0 относительно последнего Git/release artifact.
- Mutable user data: отсутствуют.
- Field performance SLO вводится после RUM; lab budgets находятся в UI spec.

## 9. Git remote blocker

Baseline repository не имеет remote. Локальная commit history и SSH deploy не зависят от remote, но требуемый push невозможен до:

- выбора Git hosting/owner;
- определения private/public visibility;
- добавления remote;
- проверки branch protection/CI secrets.

Автоматическое создание репозитория допустимо только в явно определённом аккаунте; произвольный выбор владельца не является безопасным deploy-решением.
