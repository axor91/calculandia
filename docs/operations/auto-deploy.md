# Автодеплой (Phase 2 ревизии деплоя)

- Статус: **Degraded** (с 2026-07-22, переезд сервера) — цепочка до сервера доходит, серверная транзакция не выполняется
- Блокер: `/etc/calculandia/github-token` на 5.188.30.214 отсутствует (при переезде не перенесён) → `calculandia-deploy-release` падает на первом шаге. Нужен fine-grained PAT (repo `axor91/calculandia`, **Actions: read-only**) от владельца, дальше см. «Провижининг» п. 3.
- Что уже восстановлено 2026-08-01: секрет `DEPLOY_KNOWN_HOSTS` перевыпущен на host-ключи нового сервера (ECDSA+RSA, fingerprints сверены с `/etc/ssh/ssh_host_*_key.pub` на самом хосте — до этого workflow падал с `No ECDSA host key is known`); из main с sha256-сверкой установлены `/etc/calculandia/ecosystem.config.cjs`, `/etc/calculandia/nginx/production.conf`, `/etc/calculandia/nginx/holding.conf` (весь каталог `/etc/calculandia` отсутствовал; PM2 жил на перенесённом `dump.pm2`).
- Ручной деплой релиза `640823d` (2026-08-01) выполнен по [ручному fallback](#ручной-fallback): артефакт из green `release`-рана → guard → `calculandia-activate` → `calculandia-publish` (external smoke 41 URL).

- Цепочка (целевая): merge в `main` → workflow `release` (артефакт + браузерная матрица) → workflow `deploy` (`workflow_run`, только completed+success push в main) → SSH forced-command → серверная транзакция → независимая внешняя верификация → автообновление monitor-переменных.

## Серверная сторона

| Компонент                    | Путь                                             | Обновление                                      |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| SSH-gate (bootstrap)         | `/usr/local/sbin/calculandia-ssh-gate`           | **только вручную** — намеренно не автодеплоится |
| Orchestrator                 | `/usr/local/sbin/calculandia-deploy-release`     | из green main c hash-сверкой                    |
| GitHub token (Actions: read) | `/etc/calculandia/github-token` (root:root 0600) | вручную владельцем                              |

`authorized_keys` (root) содержит ровно одну deploy-строку:

```text
restrict,command="/usr/local/sbin/calculandia-ssh-gate" ssh-ed25519 <публичный ключ> calculandia-deploy@github-actions
```

`restrict` отключает PTY/forwarding/rc; команда клиента игнорируется и доступна gate только как `SSH_ORIGINAL_COMMAND`. Gate принимает строго типизированные команды: `deploy <sha> <run-id>`, `status`, `rollback <sha>` — всё остальное отвергается.

## Транзакция `calculandia-deploy-release <sha> <run-id>`

Один `flock` на весь цикл (внутренние activate/publish переиспользуют удержанный lock через `CALCULANDIA_LOCK_HELD=1`):

1. Верификация run через GitHub API read-only токеном: repository, `event=push`, `head_branch=main`, `head_sha=<sha>`, workflow `release`, `completed`+`success`.
2. Поиск непросроченного артефакта `calculandia-<sha>` в этом run, границы размера.
3. Скачивание в bounded staging; отказ на absolute/`..`-пути, symlink/special files, timeout распаковки; сверка `BUILD_ID`.
4. Immutable-установка `releases/<sha>` (root:root 0555/0444) + полный server guard (`calculandia-verify-release`). Существующий каталог релиза принимается только если guard проходит (идемпотентный retry).
5. `calculandia-activate` (candidate-порт, clean-env PM2, bounded exact health, транзакционный откат).
6. `calculandia-publish` (ожидание активации production-конфига после graceful reload, полный external smoke 41 URL, автооткат на holding).
7. Свежий host-check → в stdout `DEPLOY_OK sha=… pm2Restarts=…`.

## GitHub-сторона

- Environment `production`: deploy-ключ (`DEPLOY_SSH_KEY`), pinned host key (`DEPLOY_KNOWN_HOSTS`), опционально `VARS_TOKEN` (fine-grained PAT, Variables: write) для автообновления `PRODUCTION_RELEASE_SHA` и `PRODUCTION_PM2_RESTART_BASELINE`. Без `VARS_TOKEN` шаг явно напоминает обновить переменные вручную.
- `concurrency: production-deploy`, `cancel-in-progress: false` — деплой не убивается посередине; серверный flock — второй барьер.
- Build/test jobs секретов деплоя не видят: ключ существует только в environment job `deploy`.
- После серверного `DEPLOY_OK` runner независимо проверяет снаружи `/healthz` (exact SHA), `/host-healthz` (freshness ≤660 c) и главную страницу.

## Ручной fallback

Автодеплой не отменяет ручной путь (см. [`production-design.md`](production-design.md) §5): все скрипты остаются пригодными для запуска руками по SSH. Мгновенный откат: `ssh root@5.188.30.214` (обычным админским ключом) → `calculandia-rollback <предыдущий sha>`, либо через deploy-ключ: `ssh root@5.188.30.214 rollback <sha>`.

## Провижининг (выполняется один раз)

1. Установить gate и orchestrator на сервер из green main с per-file SHA-256 сверкой; `chmod 0755`, owner root.
2. Добавить deploy-строку в `authorized_keys` root.
3. Создать fine-grained PAT (repo `axor91/calculandia`, permission **Actions: read-only**) → `/etc/calculandia/github-token` (0600 root).
4. Создать Environment `production` (branch policy: только `main`) и секреты `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `VARS_TOKEN`.
5. Прогнать `ssh -i <deploy-key> root@5.188.30.214 status` и негативные проверки (мусорная команда → отказ; чужой run-id → отказ).
