# Production design и runbook

- Статус: **Release candidate approved; valid-TLS holding active; public launch blocked by legal/operator input**
- Target: `calculandia.ru` / `203.0.113.20`

## 1. Подтверждено

- SSH alias `kappers-prod` работает с root access.
- nginx активен и управляет FastPanel sites.
- Глобальный Node `v20.20.2`, PM2 7 используются существующими приложениями. Node 20 уже EOL и не выбирается для Calculandia.
- PostgreSQL и Redis существуют на сервере, но Calculandia launch их не использует.
- `127.0.0.1:3212` занят healthy Calculandia process; candidate port `3213` после проверки освобождён.
- Домен имеет отдельный holding vhost с валидным TLS и отвечает `503 + noindex`, пока production proxy не утверждён.
- Node `22.22.2` установлен side-by-side с проверкой официального SHA-256; созданы непривилегированный user `calculandia` и изолированные release/state directories.
- В репозитории зафиксированы проверяемые nginx/PM2/logrotate templates и fail-closed activate/rollback scripts в `ops/`.

Наличие backup/monitoring внешних систем для Calculandia до deploy не обнаружено; состояние других сайтов не является доказательством готовности Calculandia.

## 2. Layout

```text
/var/www/calculandia/
  releases/{sha}/
    ARTIFACT.sha256
    server.js
    .next/
    public/
    package.json
  shared/
    logs/
  current -> releases/{sha}

/var/lib/calculandia/.pm2/
```

`/var/www/calculandia`, releases и `current` принадлежат `root:root`. Release directories имеют mode `0555`, regular files `0444`; отдельный system user `calculandia` не входит в root/web-admin groups и не имеет write access к release tree. Его writable state ограничен `/var/lib/calculandia/.pm2` и выделенным log directory. Последние три healthy release сохраняются.

`ARTIFACT.sha256` покрывает каждый файл кроме самого manifest. `.next/BUILD_ID` создаётся из clean full Git SHA и сверяется с manifest/release directory; suffix `-dirty` допустим только для локального review и блокирует production transfer.

Calculandia build/runtime используют Node `22.22.2` из `/opt/nodejs/node-v22.22.2-linux-x64`. Перед установкой официальный tarball сверяется с published `SHASUMS256.txt`. Глобальные `node/npm` не заменяются, чтобы не затронуть другие сайты. Local/CI и production major/minor совпадают; patch upgrade выполняется отдельным dependency/runtime maintenance commit.

## 3. Process

- bind: `127.0.0.1:3212`;
- PM2 name: `calculandia-web`;
- OS user: `calculandia`, shell disabled; `PM2_HOME=/var/lib/calculandia/.pm2`;
- boot persistence: dedicated hardened `calculandia-pm2.service`, не общий root PM2 daemon;
- interpreter: `/opt/nodejs/node-v22.22.2-linux-x64/bin/node`;
- initial instances: 1;
- memory restart threshold задаётся после измерения, initial 512 MiB;
- graceful reload после healthcheck нового artifact;
- stdout/stderr проходят PM2 log rotation, secrets/input values не логируются.

## 4. nginx

- port 80: ACME challenge и 301 на `https://calculandia.ru$request_uri`;
- `www`: 301 на non-www;
- canonical HTTPS server proxy на `127.0.0.1:3212`;
- proxy headers Host/X-Forwarded-Proto; nginx задаёт `X-Real-IP $remote_addr` и `X-Forwarded-For $proxy_add_x_forwarded_for`, приложение использует последний trusted-proxy address и никогда его не логирует;
- hashed `_next/static` — immutable one year;
- HTML — no immutable, controlled revalidation;
- общий request body limit ≤ 1 MiB; для `POST /api/client-errors` — отдельные nginx limit 1 KiB и per-IP rate limit; приложение требует same-origin JSON и повторно применяет 10/min/client + 300/min global;
- connect/read/send timeouts;
- application является единственным источником CSP/Referrer/Permissions/X-Content-Type headers; nginx добавляет только transport-specific HSTS после проверки HTTPS;
- custom 502 не маскируется как 200.

TLS: ACME/Let's Encrypt с автоматическим renew и проверкой `nginx -t`. Сертификат покрывает apex и `www`, даже если `www` только redirect.

До legal/operator approval точный vhost может находиться только в holding-state: валидный TLS, `503 + Retry-After + X-Robots-Tag: noindex`; приложение при этом доступно лишь на loopback. Parking `200` не используется как ложный сигнал готовности.

## 5. Deployment sequence

1. Local/CI release gates green.
2. Создать standalone artifact из clean commit; build записывает `.next/BUILD_ID = SHA`, streaming scanner проверяет все файлы без size exception, затем создаётся и проверяется `ARTIFACT.sha256`.
3. Передать в новый `/releases/{sha}` без изменения `current`; повторно проверить manifest и равенство BUILD_ID/directory SHA.
4. Установить `root:root`, directories `0555`, files `0444`; `sudo -u calculandia test ! -w release` и пробный create/modify обязаны завершиться отказом.
5. Запустить candidate standalone artifact на `127.0.0.1:3213` отдельным временным process именно от `calculandia` с Node 22.
6. `curl http://127.0.0.1:3213/healthz` ожидает 200 и immutable `version = candidate SHA`, даже если runtime env содержит другое значение; затем проверяются representative HTML и static assets именно на `3213`.
7. Гарантированно остановить temporary candidate process и подтвердить освобождение `3213`, включая failure path через shell trap.
8. Atomic `ln -sfn releases/{sha} current`.
9. PM2 reload/start от `calculandia` с явными `PM2_HOME` и Node 22 interpreter; release identity через env не передаётся.
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

Version читается из read-only `.next/BUILD_ID`; `APP_RELEASE` и другие runtime env не могут его подменить. Отсутствующий/невалидный BUILD_ID даёт 503. Endpoint не раскрывает env, paths, dependency versions или host details.

Minimum monitoring:

- external HTTPS/health/sitemap check из отдельной GitHub infrastructure каждые 30 минут и вручную при deploy;
- certificate expiry alert;
- PM2 process status/restarts;
- nginx 5xx rate;
- disk/memory alerts;
- sanitized structured server/client-boundary error logs без пользовательских значений.

30-минутный interval удерживает scheduled private-repository job в пределах базовой GitHub Actions quota; переход на 1–5 минут требует отдельного внешнего provider или утверждённого бюджета. PM2 обеспечивает немедленный local restart, а deploy выполняет синхронный external smoke. Scheduled job активируется только repository variable `PRODUCTION_MONITOR_ENABLED=true` и требует точного `PRODUCTION_RELEASE_SHA`; до launch он intentionally skipped. Перед launch вручную запускается failure simulation и подтверждается красный workflow; затем success run на production. Неактивный remote monitor является release blocker.

## 8. RTO/RPO/SLO

- Availability target launch: 99.9% monthly, после появления данных пересматривается.
- RTO application rollback: 10 минут.
- RPO public content: 0 относительно последнего Git/release artifact.
- Mutable user data: отсутствуют.
- Field performance SLO вводится после RUM; lab budgets находятся в UI spec.

## 9. Git repository и release provenance

Создан private repository `github.com/axor91/calculandia`, remote `origin` настроен, baseline и release candidate опубликованы в `main`. До production release остаются:

- успешный обязательный CI workflow на финальный policy/ops commit;
- проверка доступности branch protection для текущего GitHub plan;
- сохранение production SHA, идентичного remote commit, `.next/BUILD_ID` и release directory.

Deploy напрямую из dirty tree или commit, отсутствующего в `origin/main`, запрещён.
