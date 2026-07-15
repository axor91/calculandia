# P0 Platform Gate B — review log

- Дата: 2026-07-15
- Scope: dependency/runtime cleanup, removal of admin/DB/Sentry surface, canonical/health, standalone artifact, 404 behavior, security headers and error observability
- Статус: **APPROVED**

## Первый независимый review

Три reviewer-потока дали verdict **Rejected**. Ни одно замечание не было принято как «допустимое на потом».

| Severity | Finding                                                                           | Disposition                                                                                                                                 | Evidence                                                                                                 |
| -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Critical | Next standalone скопировал локальные `.env` с секретами                           | Build теперь всегда вызывает sanitize + fail-closed verifier; удаляются все `.env*`, затем весь artifact сканируется по запрещённым markers | `scripts/prepare-standalone.mjs`, `scripts/verify-standalone.mjs`; clean build: env files/markers = none |
| High     | Raw standalone не содержал static assets; `npm start` запускал неверный target    | Static/public копируются в artifact, `npm start` импортирует standalone server, smoke запускает именно artifact                             | `package.json`, `scripts/start-standalone.mjs`, standalone smoke                                         |
| High     | Unknown calculator и excluded equations отвечали soft-404 HTTP 200 с долгим cache | Фиксированный каталог использует явные static route files без dynamic fallback; negative HTTP smoke требует 404                             | `app/calculator/*/page.tsx`, smoke paths                                                                 |
| High     | Не было regression checks artifact/catalog/site origin                            | Добавлены artifact prepare/verify/smoke, unit tests catalog/site/health/schema и coverage thresholds                                        | 69 tests; coverage gate; `npm run check`                                                                 |
| High     | Production мог принять localhost origin; health молча показывал development       | Production origin fail-closed и строго canonical; production health без release возвращает 503                                              | `lib/site.ts`, `lib/health.ts`, tests                                                                    |
| High     | Нет структурированных server/client error logs                                    | Next request hook + bounded same-origin browser-boundary event; message/stack/input/query/fragment не принимаются                           | `instrumentation.ts`, `lib/server-log.ts`, `/api/client-errors`, schema/smoke                            |
| High     | Dynamic OG route создавал CPU/log-flood risk                                      | Route удалён, checked-in 1200×630 PNG отдаётся как static asset; parallel burst byte-identical                                              | `app/opengraph-image.png`, 12-request smoke                                                              |

## Evidence перед re-review

```text
Node 22.22.2 / npm 10.9.7
npm ci: reproducible install
lint: 0 errors, 0 warnings
typecheck: pass
tests: 72 passed
coverage: 77.59% statements / 81.41% lines
production dependency audit: 0 critical/high; documented build-only PostCSS moderate exception
Next production build: pass
standalone artifact: 2060 files / 28 static assets; Git-bound BUILD_ID; full SHA-256 manifest; read-only modes; 3 local secret values explicitly absent
standalone HTTP smoke: pass
artifact env files: none
artifact forbidden markers: none
git diff --check: pass
```

## Второй независимый review

Verdict: **Rejected** — реальный 404 при `dynamicParams = false` печатал внутренний `NoFallbackError` stack в stderr на каждый bot probe. Это признано High log-amplification issue.

Исправление: отказ от проблемного dynamic fallback-механизма Next.js. Фиксированный launch catalog публикуется явными статическими route-файлами с общим renderer; неизвестный slug не сопоставляется с route. Smoke выполняет десять разных unknown/excluded requests и падает при любом новом stderr, а не только при структурированном error event.

## Третий независимый review

Technical и quality reviewers дали **Approved**: все предыдущие blockers закрыты. Security reviewer дал **Rejected** с четырьмя новыми High: cross-site telemetry poisoning/quota starvation, подменяемый `APP_RELEASE`, не обеспеченные ownership/modes и fail-open scan файлов больше 25 MiB.

Disposition:

- telemetry теперь требует exact same-origin browser context и JSON; limits разделены на 10/min client bucket и 300/min global, trusted proxy address хэшируется и не логируется;
- health читает только `.next/BUILD_ID`, создаваемый из full Git SHA; forged runtime env игнорируется;
- artifact получает full SHA-256 manifest и read-only modes; production release root-owned, runtime user отдельный, negative write probe обязателен;
- verifier сканирует каждый файл потоково без size skip и отдельно сверяет фактические local secret values.

## Финальный verdict

**APPROVED.** Четвёртый сериализованный review завершён тремя независимыми verdict без Critical/High.

Финальный evidence:

- clean `npm ci && npm run check` и повторный build поверх read-only artifact прошли;
- 72 tests, coverage 77.59% statements / 81.41% lines;
- production audit: 0 Critical/High, build-only moderate exception документирован;
- BUILD_ID совпадает с Git worktree identity, forged runtime release env игнорируется;
- SHA-256 manifest покрывает все artifact files кроме самого manifest; env/secrets отсутствуют; writable paths и symlinks отсутствуют;
- scanner/tamper regression включает файл больше 25 MiB и pattern на границе chunks;
- adversarial telemetry: 80 cross-site/media rejects не расходуют quota, per-client/global limits и client isolation подтверждены, address/key не логируются;
- unknown calculator probes: 404/no-store, zero stderr, artifact не мутирует;
- все review processes остановлены, порты освобождены.

Gate C разрешён. Production ownership/user/nginx controls остаются обязательными evidence Gate F, а не считаются выполненными локальным design review.
