# Pre-production evidence

- Дата: 2026-07-16
- Проверенный commit: `bdd7c4ce7ca1643c98e734ca20e8273fca423292`
- Remote: private `github.com/axor91/calculandia`, ветка `main`
- CI: [production-gate run 29456296520](https://github.com/axor91/calculandia/actions/runs/29456296520) — **success**
- Public state: **holding**, не production launch

## 1. Release provenance

- local HEAD, `origin/main`, clean `.next/BUILD_ID` и server release directory совпали по full SHA;
- local и remote CI прошли format, lint, typecheck, 447 unit/property tests, artifact-tool regressions, production audit, build, standalone smoke, 75 passed / 6 intentional skipped Playwright cases, шесть Lighthouse runs и `release:verify`;
- standalone artifact: 2,226 файлов, 52 static assets, полный `ARTIFACT.sha256`, отсутствуют writable mode bits и три распознанных local secret values;
- server повторно выполнил `sha256sum --check`; release directory `0555 root:root`, файлы `0444 root:root`.

## 2. Candidate и process isolation

1. Artifact запущен от `calculandia` на `127.0.0.1:3213` до изменения `current`.
2. Проверены `/healthz`, canonical homepage, representative calculator и static asset.
3. Candidate остановлен, порт `3213` освобождён.
4. Первый activation attempt завершился fail-closed: PM2 CLI наследовал недоступный root working directory и получил `EACCES`; `current` не был оставлен, public state не менялся.
5. Script исправлен: PM2 команды выполняются из `/var/lib/calculandia`; повторный candidate/activation прошёл.
6. Active process слушает только `127.0.0.1:3212`, OS user/group — `calculandia`, health version совпадает с SHA.
7. Negative write probe от runtime user завершился отказом; release не изменён.

Finding первого запуска зафиксирован, а не скрыт: он не затронул другие PM2 applications и обнаружен до публичного proxy switch.

## 3. Boot persistence

- отдельный `calculandia-pm2.service` включён в systemd;
- `User/Group=calculandia`, `ProtectSystem=strict`, `NoNewPrivileges=yes`, writable path ограничен `/var/lib/calculandia`;
- PM2 daemon был штатно остановлен после `pm2 save`, затем восстановлен через `systemctl start calculandia-pm2`;
- process и `/healthz` восстановились с тем же release SHA.

## 4. nginx и TLS

- custom http-context config, log format без query/referrer/user-agent, rate-limit zone и production template прошли `nginx -t`;
- Let's Encrypt certificate выдан для `calculandia.ru` и `www.calculandia.ru`, срок действия: 2026-07-15 — 2026-10-13;
- `certbot.timer` enabled/active; simulated renewal завершился success;
- exact production proxy template с существующим сертификатом прошёл syntax check, но не был reloaded;
- active holding vhost: HTTP `301` на canonical HTTPS; HTTPS `503`, `X-Robots-Tag: noindex, nofollow, noarchive`, `Retry-After: 3600`; сертификат валиден;
- loopback application остаётся недоступным из Internet до legal/operator approval.

## 5. Незакрытые Production Gate evidence

1. Operator identity/address/privacy contact и уведомление Роскомнадзора либо подтверждённое действующее исключение.
2. Финальный policy commit, green CI и immutable deployment этого же SHA.
3. Переключение holding → production, external canonical/redirect/header/schema/source smoke.
4. GitHub variables `PRODUCTION_RELEASE_SHA` и `PRODUCTION_MONITOR_ENABLED=true`.
5. Manual monitor failure simulation, затем successful run.
6. Rollback на предыдущий healthy release и повторная активация текущего SHA.

Scheduled monitor до launch намеренно пропускается по repository variable, чтобы holding `503` не создавал ложные incident alerts и не расходовал private Actions quota.
