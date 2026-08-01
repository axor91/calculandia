# Production design и runbook

- Статус: **RC `0877ada` установлен и healthy (loopback); hardening PR #1–#3 merged и доказаны live; valid-TLS holding active; public launch blocked by legal/operator input**
- Target: `calculandia.ru` / `203.0.113.10`

## 1. Подтверждено

- SSH alias `kappers-prod` работает с root access.
- nginx активен и управляет FastPanel sites.
- Глобальный Node `v20.20.2`, PM2 7 используются существующими приложениями. Node 20 уже EOL и не выбирается для Calculandia.
- PostgreSQL и Redis существуют на сервере, но Calculandia launch их не использует.
- `127.0.0.1:3212` занят healthy Calculandia process; candidate port `3213` после проверки освобождён.
- Домен имеет отдельный holding vhost с валидным TLS и отвечает `503 + noindex`, пока production proxy не утверждён.
- Node `22.22.2` установлен side-by-side с проверкой официального SHA-256; созданы непривилегированный user `calculandia` и изолированные release/state directories.
- В репозитории зафиксированы проверяемые nginx/PM2/logrotate templates и fail-closed activate/rollback scripts в `ops/`.

Повторный audit выявил transactional/inventory/monitoring gaps в прежних scripts. Исправления merged в PR #1 (`0877ada`), установлены на сервер из green main с per-file SHA-256 сверкой и доказаны live drill'ами. Host monitor дополнительно исправлен PR #2/#3 (несовместимости systemd-hardening с runuser privilege drop) и работает на 5-минутном таймере; см. [`2026-07-16-preproduction-evidence.md`](2026-07-16-preproduction-evidence.md).

Mutable launch data отсутствуют, поэтому отдельный application backup не требуется; Git и immutable releases обеспечивают RPO 0 для публичного контента. External GitHub monitor существовал до 2026-08-01 и удалён (см. §7). Состояние других сайтов не используется как доказательство готовности Calculandia.

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
/var/lib/calculandia-monitor/health.json
```

`/var/www/calculandia`, releases и `current` принадлежат `root:root`. Release directories имеют mode `0555`, regular files `0444`; отдельный system user `calculandia` не входит в root/web-admin groups и не имеет write access к release tree. Его writable state ограничен `/var/lib/calculandia/.pm2` и выделенным log directory. Последние три healthy release сохраняются.

`ARTIFACT.sha256` покрывает каждый файл кроме корневого manifest. `.next/BUILD_ID` создаётся из clean full Git SHA и сверяется с manifest/release directory; suffix `-dirty` допустим только для локального review и блокирует production transfer. Server guard дополнительно требует exact inventory без extra/symlink/special/CRLF/environment files, `root:root`, отсутствие write bits, обязательные server/static files и непустой static tree.

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
- candidate и PM2 CLI запускаются через `env -i`; SSH/deploy environment не наследуется приложением.

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

## 4a. CI pipeline (с 2026-07-17)

- **PR-гейт** `production-gate`: job `classify` относит diff к классам docs/ops/app/dependencies (неизвестный путь fail-safe запускает полный набор; классификатор покрыт unit-тестами). По классам выполняются `docs-contract` (всегда: формат docs, целостность внутренних ссылок), `quality`, `build-smoke` (build, standalone smoke, gzip bundle-budget, Chromium E2E), `ops-check`, `dependency-audit`. Единственный required-контекст branch protection — `verify`: always-running агрегатор, который сверяет результат каждого job с классификацией (неожиданный skipped = fail). Playwright-браузеры кэшируются.
- **Release** (push в main, non-cancellable): `quality` + `artifact` (build, `release:verify`, upload/download round-trip c exact `BUILD_ID` и полным SHA-256 manifest) → параллельная матрица `e2e` Chromium/Firefox/WebKit, каждая по скачанному exact-артефакту → `release-gate` (агрегатор; будущая точка привязки автодеплоя).
- **Nightly**: Lighthouse 5 прогонов с медианной агрегацией и калиброванными бюджетами, отчёты сохраняются артефактами 30 дней; полный `npm audit`. Performance-регрессии не блокируют срочный deploy — они алертят.
- Бюджеты производительности на критическом пути: детерминированный gzip-размер First-Load JS (`scripts/test-bundle-budget.mjs`, baseline ~106.5 KiB, бюджет 125 KiB) вместо флейкующего TBT на shared runners.

## 5. Deployment sequence

Стандартный путь — автоматический: см. [`auto-deploy.md`](auto-deploy.md) (workflow `deploy` выполняет шаги 2–13 серверной транзакцией после green `release`). Последовательность ниже остаётся нормативной спецификацией и ручным fallback.

1. Local/CI release gates green (required `verify` на PR + `release-gate` на main).
2. Создать standalone artifact из clean commit; build записывает `.next/BUILD_ID = SHA`, streaming scanner проверяет все файлы без size exception, затем создаётся и проверяется `ARTIFACT.sha256`.
3. Передать в новый `/releases/{sha}` без изменения `current`; server guard повторно проверяет exact inventory, hashes, ownership, modes и равенство BUILD_ID/directory SHA.
4. Установить `root:root`, directories `0555`, files `0444`; `sudo -u calculandia test ! -w release` и пробный create/modify обязаны завершиться отказом.
5. Запустить candidate standalone artifact на `127.0.0.1:3213` отдельным временным process именно от `calculandia` с Node 22.
6. `curl http://127.0.0.1:3213/healthz` ожидает 200 и immutable `version = candidate SHA`, даже если runtime env содержит другое значение; затем проверяются representative HTML и static assets именно на `3213`.
7. Гарантированно остановить temporary candidate process и подтвердить освобождение `3213`, включая failure path через shell trap.
8. Общий nonblocking `flock` сериализует activate/rollback/publish; затем выполняется atomic symlink switch.
9. PM2 reload/start от `calculandia` с чистым environment, явными `PM2_HOME` и Node 22 interpreter; release identity через env не передаётся.
10. `curl http://127.0.0.1:3212/healthz` ожидает 200 и тот же candidate SHA. Любая command/health/save failure транзакционно восстанавливает previous symlink/process и bounded exact health; непроверенный fallback возвращает critical exit 2.
11. Host checker создаёт свежий exact-SHA marker; publish script атомарно ставит production config, выполняет `nginx -t`/reload и вооружает EXIT trap на known holding config.
12. External smoke проверяет host/runtime health, все 25 sitemap URL, отсутствие noindex, canonical, schema, redirects, headers, TLS, robots, assets, sources и `404`. Любая ошибка автоматически возвращает holding и reload.
13. Отдельный GitHub run подтверждает внешний контур; только после этого сохраняется evidence и release помечается public healthy.

## 6. Rollback

Trigger:

- healthcheck не 200;
- 5xx на home/representative calculator;
- missing static assets;
- canonical/TLS/security regression;
- формульная ошибка release-blocking severity.

Procedure:

1. Выбрать guard-verified previous healthy SHA.
2. Под общим lock запомнить original target и атомарно переключить `current`.
3. Выполнить clean-env PM2 restart и bounded exact health.
4. При restart/health/save failure атомарно восстановить original symlink, restart, exact health и PM2 dump; отсутствие подтверждённого recovery — critical exit 2.
5. Проверить local/external health and smoke; failed artifact не удалять до RCA.

Target rollback time: ≤10 минут. Поскольку mutable launch DB отсутствует, data rollback не нужен.

## 7. Health/monitoring

`/healthz` возвращает:

```json
{ "status": "ok", "version": "<git-sha>" }
```

Version читается из read-only `.next/BUILD_ID`; `APP_RELEASE` и другие runtime env не могут его подменить. Отсутствующий/невалидный BUILD_ID даёт 503. Endpoint не раскрывает env, paths, dependency versions или host details.

Local root timer каждые пять минут проверяет exact loopback release, systemd/PM2 online state, `unstable_restarts`, disk (<92%, warning с 88%), доступную память (≥256 MiB) и production nginx 5xx rate. Atomic `/host-healthz` marker содержит только status, release, epoch freshness и PM2 restart count; при ошибке marker удаляется. Deploy требует marker не старше 660 секунд и совпадения release.

### Scheduled remote monitor удалён (2026-08-01)

Workflow `production-monitor` (внешний HTTPS/health/sitemap/TLS-check каждые 30 минут) и переменные `PRODUCTION_MONITOR_ENABLED`, `PRODUCTION_RELEASE_SHA`, `PRODUCTION_PM2_RESTART_BASELINE` удалены по решению владельца: с 2026-07-20 монитор был выключен и не использовался, а его красные раны на деле сигнализировали о переполненном диске соседями, а не о состоянии Calculandia. Прежняя формулировка «неактивный remote monitor — release blocker» больше не действует.

Что осталось из наблюдаемости:

- локальный root timer + `/host-healthz` (питает deploy-гейт и доступен для ручной проверки);
- синхронная внешняя верификация при каждом deploy: `/healthz` с exact SHA, свежесть `/host-healthz`, главная страница, external smoke 41 URL с автооткатом на holding;
- PM2 process status/restarts и немедленный local restart;
- nginx 5xx rate, disk/memory пороги внутри host-check;
- sanitized structured server/client-boundary error logs без пользовательских значений.

Непокрытым остаётся **пассивный uptime-алертинг между деплоями**: если сайт ляжет в тихий период, никто не узнает до следующего деплоя или ручной проверки. Сознательный trade-off; при необходимости закрывается внешним uptime-провайдером, а не возвратом scheduled job. Certificate expiry также больше не проверяется автоматически — срок сертификата контролирует certbot-таймер на сервере.

## 8. RTO/RPO/SLO

- Availability target launch: 99.9% monthly, после появления данных пересматривается.
- RTO application rollback: 10 минут.
- RPO public content: 0 относительно последнего Git/release artifact.
- Mutable user data: отсутствуют.
- Field performance SLO вводится после RUM; lab budgets находятся в UI spec.

## 9. Git repository и release provenance

Создан private repository `github.com/axor91/calculandia`, remote `origin` настроен, baseline и previous release candidate опубликованы в `main`. Branch protection подтверждён: required `verify` применяется к admins, strict linear history, force-push и deletion запрещены. Repository требует action SHA pinning; CI dependencies закреплены полными commit SHA. Загруженный release artifact обязан пройти download round-trip с exact `BUILD_ID` и полным manifest; первое remote доказательство ожидается от PR #1/main revalidation. До production release остаются:

- успешный обязательный CI workflow на финальный policy/ops commit;
- сохранение production SHA, идентичного remote commit, `.next/BUILD_ID` и release directory.

Deploy напрямую из dirty tree или commit, отсутствующего в `origin/main`, запрещён.
