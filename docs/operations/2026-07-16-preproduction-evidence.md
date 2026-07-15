# Pre-production evidence

- Дата: 2026-07-16
- Первый healthy release: `bdd7c4ce7ca1643c98e734ca20e8273fca423292`
- Текущий internal release: `0ab55a64a2ca82648fe5ffc205143e71e9f9a70c`
- Remote: private `github.com/axor91/calculandia`, ветка `main`
- CI: [application run 29456296520](https://github.com/axor91/calculandia/actions/runs/29456296520) и [operations run 29457751989](https://github.com/axor91/calculandia/actions/runs/29457751989) — **success**
- Public state: **holding**, не production launch

## 1. Release provenance

- local HEAD, `origin/main`, clean `.next/BUILD_ID` и server release directory совпали по full SHA;
- local и remote CI прошли format, lint, typecheck, 447 unit/property tests, artifact-tool regressions, production audit, build, standalone smoke, 75 passed / 6 intentional skipped Playwright cases, шесть Lighthouse runs и `release:verify`;
- standalone artifact: 2,226 файлов, 52 static assets, полный `ARTIFACT.sha256`, отсутствуют writable mode bits и три распознанных local secret values;
- server повторно выполнил `sha256sum --check`; release directory `0555 root:root`, файлы `0444 root:root`.
- `main` защищён: required status `verify`, strict/linear history, force-push и deletion запрещены.

## 2. Candidate и process isolation

1. Artifact запущен от `calculandia` на `127.0.0.1:3213` до изменения `current`.
2. Проверены `/healthz`, canonical homepage, representative calculator и static asset.
3. Candidate остановлен, порт `3213` освобождён.
4. Первый activation attempt завершился fail-closed: PM2 CLI наследовал недоступный root working directory и получил `EACCES`; `current` не был оставлен, public state не менялся.
5. Script исправлен: PM2 команды выполняются из `/var/lib/calculandia`; повторный candidate/activation прошёл.
6. Active process слушает только `127.0.0.1:3212`, OS user/group — `calculandia`, health version совпадает с SHA.
7. Negative write probe от runtime user завершился отказом; release не изменён.

Finding первого запуска зафиксирован, а не скрыт: он не затронул другие PM2 applications и обнаружен до публичного proxy switch.

## 3. Rollback/forward drill

1. После активации `0ab55a6` выполнено переключение на предыдущий healthy `bdd7c4c`.
2. Первый drill обнаружил слишком ранний single-shot healthcheck: PM2 и symlink переключились правильно, но `curl` попал в короткое startup window. Public holding не менялся.
3. Rollback verifier заменён bounded retry с exact SHA; повторный drill прошёл.
4. Measured rollback до healthy exact identity: `1,490 ms`.
5. Повторная candidate/forward activation `0ab55a6`: `5,865 ms`.
6. Финальные `current`, PM2 dump и `/healthz` указывают на `0ab55a64a2ca82648fe5ffc205143e71e9f9a70c`; public holding сохранил `503`.

Оба времени значительно ниже RTO 10 минут. Mutable data/migration boundary отсутствует.

## 4. Boot persistence

- отдельный `calculandia-pm2.service` включён в systemd;
- `User/Group=calculandia`, `ProtectSystem=strict`, `NoNewPrivileges=yes`, writable path ограничен `/var/lib/calculandia`;
- PM2 daemon был штатно остановлен после `pm2 save`, затем восстановлен через `systemctl start calculandia-pm2`;
- process и `/healthz` восстановились с тем же release SHA.

## 5. nginx и TLS

- custom http-context config, log format без query/referrer/user-agent, rate-limit zone и production template прошли `nginx -t`;
- Let's Encrypt certificate выдан для `calculandia.ru` и `www.calculandia.ru`, срок действия: 2026-07-15 — 2026-10-13;
- `certbot.timer` enabled/active; simulated renewal завершился success;
- exact production proxy template с существующим сертификатом прошёл syntax check, но не был reloaded;
- active holding vhost: HTTP `301` на canonical HTTPS; HTTPS `503`, `X-Robots-Tag: noindex, nofollow, noarchive`, `Retry-After: 3600`; сертификат валиден;
- loopback application остаётся недоступным из Internet до legal/operator approval.

## 6. Незакрытые Production Gate evidence

1. Operator identity/address/privacy contact и уведомление Роскомнадзора либо подтверждённое действующее исключение.
2. Финальный policy commit, green CI и immutable deployment этого же SHA.
3. Переключение holding → production, external canonical/redirect/header/schema/source smoke.
4. GitHub variables `PRODUCTION_RELEASE_SHA` и `PRODUCTION_MONITOR_ENABLED=true`.
5. Manual monitor failure simulation, затем successful run.

Scheduled monitor до launch намеренно пропускается по repository variable, чтобы holding `503` не создавал ложные incident alerts и не расходовал private Actions quota.
