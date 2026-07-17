# Pre-production evidence

- Дата: 2026-07-16
- Первый healthy release: `bdd7c4ce7ca1643c98e734ca20e8273fca423292`
- Текущий internal release: `0877adaefbf4c492192a79c12cf072053083a155` (предыдущие healthy: `0ab55a6`, `bdd7c4c` сохранены для rollback)
- Remote: private `github.com/axor91/calculandia`, ветка `main`
- CI: [application run 29456296520](https://github.com/axor91/calculandia/actions/runs/29456296520), [operations run 29457751989](https://github.com/axor91/calculandia/actions/runs/29457751989) и [restricted-log run 29458837978](https://github.com/axor91/calculandia/actions/runs/29458837978) — **success**
- Artifact round-trip correction: `4966680`, [run 29459407641](https://github.com/axor91/calculandia/actions/runs/29459407641) — **failed before upload/download** на WebKit hydration readiness race
- Release hardening: PR #1 (`1d094e9`, [run 29460822088](https://github.com/axor91/calculandia/actions/runs/29460822088)) — **success**, merged как `0877ada`; exact-main [run 29472020743](https://github.com/axor91/calculandia/actions/runs/29472020743) — **success**; artifact обоих runs независимо скачан и сверён (2,229 файлов, 287 hidden `.next`, exact `BUILD_ID`, полный SHA-256 manifest)
- Host monitor corrections: PR #2 `84b3910` (RestrictSUIDSGID ломал runuser) и PR #3 `7273832` (явный `User=` + `NoNewPrivileges` + seccomp-опция очищают CAP_SETUID в systemd 255) — оба merged с green required CI; live-подтверждение: 4 последовательных 5-минутных таймерных цикла healthy, exact-SHA marker, `pm2Restarts` = baseline 2
- Live drills новым комплектом: forward `0877ada`, rollback `0ab55a6` за 2.95 s, forward обратно за 7.20 s; clean-env PM2 (SSH-переменные удалены из process и dump); certbot simulated renewal с рабочим deploy-hook; активный vhost байт-в-байт равен holding
- Public state: **holding**, не production launch

## 1. Release provenance

- local HEAD, `origin/main`, clean `.next/BUILD_ID` и server release directory совпали по full SHA;
- local и remote CI прошли format, lint, typecheck, 447 unit/property tests, artifact-tool regressions, production audit, build, standalone smoke, 75 passed / 6 intentional skipped Playwright cases, шесть Lighthouse runs и `release:verify`;
- standalone artifact: 2,226 файлов, 52 static assets, полный `ARTIFACT.sha256`, отсутствуют writable mode bits и три распознанных local secret values;
- server повторно выполнил `sha256sum --check`; release directory `0555 root:root`, файлы `0444 root:root`.
- `main` защищён: required status `verify`, strict/linear history, force-push и deletion запрещены.

### 1.1 GitHub artifact round-trip finding

После первоначального утверждения RC скачивание artifact из successful run `29458837978` выявило, что `actions/upload-artifact` с default `include-hidden-files: false` исключал вложенный `.next`. Локальный и server artifacts не затронуты: они передавались из полного проверенного standalone tree и повторно сверялись по manifest на сервере. Однако скачанная из GitHub копия содержала 1,946 файлов вместо полного набора и не имела `.next/BUILD_ID`, поэтому не считалась deployable provenance evidence.

Первичная коррекция в `4966680`:

- official GitHub actions обновлены до актуальных major versions и закреплены полными commit SHA;
- upload явно включает hidden files после полного secret/manifest scan;
- тот же job скачивает artifact обратно;
- отдельный verifier требует `server.js`, `.next/BUILD_ID`, непустой `.next/static`, exact commit SHA и совпадение полного `ARTIFACT.sha256`;
- локальная negative-проверка подтвердила, что прежняя 1,946-файловая копия отвергается, а полный 2,226-файловый artifact принимается.

Remote run `29459407641` корректно не дошёл до upload/download: WebKit один раз принял изменение поля до завершения calculator hydration, и результат не обновился. Это классифицировано как product readiness race, а не скрыто retry. PR #1 делает SSR calculator subtree `inert + aria-busy` до завершения hydration, публикует явный readiness marker и ждёт его в E2E. Исправленный сценарий прошёл 10 последовательных WebKit повторов и полный локальный matrix 75 passed / 6 intentional skips.

Повторный platform audit также обнаружил транзакционные и operational P1: непроверенный fallback activation, rollback без восстановления original release при failure, неполный server inventory/ownership guard, наследование SSH environment в PM2, отсутствие атомарного public switch, cert deploy hook, host resource/restart/5xx monitoring и CI-проверок ops templates. Все исправления вошли в PR #1 (merged `0877ada`) и **развёрнуты live**: ops bundle установлен с per-file SHA-256 сверкой против green main, guard прошёл по всем трём server releases, hardened PM2 unit перезапущен, drills выполнены под holding.

Host monitor потребовал двух дополнительных исправлений, найденных только живым запуском (оба — несовместимость systemd-hardening с намеренным `runuser` privilege drop): `RestrictSUIDSGID=true` (PR #2) и явный `User=root`+`NoNewPrivileges`+seccomp-опция, при которых systemd 255 очищает CAP_SETUID из effective set (PR #3; корень доказан бисекцией transient-юнитов, strace и `/proc/self/status`). Оба раза сервис падал fail-closed без ложного healthy marker. После установки из green main таймер подтверждён четырьмя последовательными циклами.

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

## 4. Bounded-concurrency smoke

После forward activation выполнено 500 loopback requests с concurrency 20:

| Route                  | Requests | HTTP 200 | Average |  Maximum |
| ---------------------- | -------: | -------: | ------: | -------: |
| `/`                    |      200 |      200 | 79.2 ms | 153.2 ms |
| `/kalkulyator/ipoteka` |      200 |      200 | 29.2 ms |  94.9 ms |
| `/healthz`             |      100 |      100 | 61.3 ms | 100.8 ms |

Systemd cgroup memory peak после burst — 113,610,752 bytes, ниже restart threshold 512 MiB. Process остался active, health SHA не изменился; повторная проверка manifest и writable bits прошла.

## 5. Boot persistence

- отдельный `calculandia-pm2.service` включён в systemd;
- `User/Group=calculandia`, `ProtectSystem=strict`, `NoNewPrivileges=yes`, `UMask=0027`, writable path ограничен `/var/lib/calculandia`;
- PM2 daemon был штатно остановлен после `pm2 save`, затем восстановлен через `systemctl start calculandia-pm2`;
- process и `/healthz` восстановились с тем же release SHA.
- nginx/application/candidate logs имеют mode `0640`; candidate script создаёт файл с конечными owner/mode до старта process.

## 6. nginx и TLS

- custom http-context config, log format без query/referrer/user-agent, rate-limit zone и production template прошли `nginx -t`;
- Let's Encrypt certificate выдан для `calculandia.ru` и `www.calculandia.ru`, срок действия: 2026-07-15 — 2026-10-13;
- `certbot.timer` enabled/active; simulated renewal завершился success;
- exact production proxy template с существующим сертификатом прошёл syntax check, но не был reloaded;
- active holding vhost: HTTP `301` на canonical HTTPS; HTTPS `503`, `X-Robots-Tag: noindex, nofollow, noarchive`, `Retry-After: 3600`; сертификат валиден;
- loopback application остаётся недоступным из Internet до legal/operator approval.

## 7. Незакрытые Production Gate evidence

1. Operator identity/address/privacy contact и уведомление Роскомнадзора либо подтверждённое действующее исключение.
2. Финальный policy commit, green CI и immutable deployment этого же SHA.
3. Переключение holding → production, external canonical/redirect/header/schema/source smoke.
4. GitHub variables `PRODUCTION_RELEASE_SHA` и `PRODUCTION_MONITOR_ENABLED=true`.
5. Manual monitor failure simulation, затем successful run.

Scheduled monitor до launch намеренно пропускается по repository variable, чтобы holding `503` не создавал ложные incident alerts и не расходовал private Actions quota.
