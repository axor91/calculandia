# Production completion audit

- Дата: 2026-07-16
- Scope: исходная цель полноценного production-релиза, а не только состояние реализованного кода
- Текущий verdict: **Technical Release Candidate approved (release engineering complete); Production Gate blocked by external operator/legal input**

## 1. Матрица требований и доказательств

| Требование исходной цели                          | Статус             | Авторитетное evidence                                                                                                                                                                                                                                                               |
| ------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Аудит исходного проекта                           | **Proven**         | Зафиксированный baseline `1701533`; воспроизводимые команды и findings в [`../audit/2026-07-15-production-readiness.md`](../audit/2026-07-15-production-readiness.md)                                                                                                               |
| Целевая архитектура и дорожная карта              | **Proven**         | Утверждённые gates, cut-line и ADR в [`../architecture/production-target-and-roadmap.md`](../architecture/production-target-and-roadmap.md) и `docs/decisions/`                                                                                                                     |
| Конкурентное исследование с визуальным просмотром | **Proven**         | Sampled inventory, screenshots и ограничения исследования в [`../research/2026-07-15-competitors-ux-seo.md`](../research/2026-07-15-competitors-ux-seo.md), [`../research/evidence-log.md`](../research/evidence-log.md)                                                            |
| Группировка и стартовый каталог                   | **Proven**         | Typed registry; 14 calculator pages, 4 category hubs, 25 sitemap URLs; catalog/SEO tests и production build                                                                                                                                                                         |
| Корректность калькуляторов                        | **Approved**       | 134 targeted tests, 5,000-case construction fuzz и независимый Gate D в [`2026-07-16-implementation-gates.md`](2026-07-16-implementation-gates.md)                                                                                                                                  |
| UX/UI, accessibility и адаптивность               | **Approved**       | 75 passed / 6 intentional skips Playwright, 51 extra viewport combinations, visual evidence/checksums и независимый UX gate                                                                                                                                                         |
| SEO/crawl/schema/redirects                        | **Approved**       | Canonical metadata, `WebApplication`, sitemap/robots, legacy `301`, `404 + noindex`; automated contracts и rendered-page review                                                                                                                                                     |
| Security/privacy-first technical controls         | **Approved**       | No runtime DB/accounts/analytics; same-origin allowlisted telemetry; full artifact secret scan; dependency gate/exception; threat model                                                                                                                                             |
| Reproducible release artifact                     | **Proven**         | Полная цепочка доказана: PR #1 run `29460822088` и exact-main run `29472020743` green; artifact обоих независимо скачан вне CI и сверён — 2,229 файлов, 287 hidden `.next`, exact `BUILD_ID`, полный SHA-256 manifest                                                               |
| Git/review/CI controls                            | **Proven**         | Private remote; required `verify` applies to admins; strict linear history; force-push/deletion disabled; Actions require full-SHA pinning; PR #1–#3 merged только через green required CI                                                                                          |
| Server deployment и rollback                      | **Proven**         | Immutable `0877ada` активен loopback-only; transactional activation/rollback, strict guard, clean-env PM2 установлены из green main с per-file SHA-256 сверкой; live drill `0877ada → 0ab55a6 → 0877ada` (2.95 s / 7.20 s); host monitor — 4 таймерных цикла healthy после PR #2/#3 |
| TLS и безопасное состояние домена                 | **Proven holding** | Valid apex/www Let's Encrypt, renewal simulation, HTTP canonical redirect, HTTPS `503 + noindex + Retry-After`; production proxy ещё не включён                                                                                                                                     |
| Публичный production и индексация                 | **Not achieved**   | Нельзя доказать до operator/privacy/notification approval, финального policy artifact, proxy switch, external smoke и active exact-SHA monitor                                                                                                                                      |

## 2. Повторный P0/P1 аудит

Completion-аудит не ограничился отсутствием падающих тестов. Из successful CI run `29458837978` была реально скачана опубликованная копия artifact. Она содержала 1,946 файлов и не содержала `.next/BUILD_ID`, тогда как полный локальный artifact содержит 2,226 файлов и 52 static assets. Причина — default hidden-file exclusion у upload action.

Классификация: **P1 release provenance**, потому что server release не повреждён, но GitHub artifact нельзя было использовать для воспроизводимого deploy. Finding исправляется обязательным round-trip; прежняя копия используется как negative evidence. Production Gate не может быть утверждён, пока новый remote round-trip не завершится success.

Повторный аудит затем выявил и поставил в revalidation:

1. WebKit hydration lost-interaction race.
2. Activation fallback без bounded exact-health доказательства и rollback, не восстанавливающий original release при restart/health failure.
3. Server guard, который проверял hashes перечисленных файлов, но не запрещал extra/symlink/wrong-owner/environment files.
4. PM2 environment, наследовавший `SSH_CLIENT`/`SSH_CONNECTION` deploy-сессии.
5. Отсутствие сериализации release operations и fail-closed executable holding → production switch.
6. External smoke без полного 25-URL/indexability/redirect/schema/asset/source/404/host-health контракта.
7. Пустой certbot deploy-hook и отсутствие PM2 restart/nginx 5xx/disk/memory monitoring с external freshness check.
8. Admin bypass required CI, отсутствие repository-wide action SHA policy и CI syntax/negative tests для ops.

Все перечисленные пункты закрыты: PR #1 merged (`0877ada`) через green required CI, artifact download proof получен независимо от CI, live install и recovery drill выполнены под holding. Живой запуск host monitor затем выявил ещё два P1 несовместимости systemd-hardening с runuser privilege drop — `RestrictSUIDSGID` (PR #2 `84b3910`) и явный `User=`+`NoNewPrivileges`+seccomp → потеря CAP_SETUID в systemd 255 (PR #3 `7273832`, корень доказан бисекцией/strace/CapEff). Оба исправления merged через green CI, unit установлен из main c hash-сверкой, таймер подтверждён четырьмя последовательными healthy-циклами; в обоих инцидентах сервис падал fail-closed без ложного marker. Известный CI-флейк Lighthouse TBT (206/257 мс при пороге 200 на неизменном коде приложения) закрыт причинно в Wave 2: dynamic-чанки калькуляторов разрезаны с категорийных на per-калькуляторные. Temporary moderate build-only exception `DEP-2026-001` действует до 2026-08-15 и не попадает в runtime request path.

## 3. Необходимые доказательства для смены verdict на Production Approved

1. Проверяемые имя/статус/адрес оператора, действующий privacy contact, hosting/mail roles и сроки обработки.
2. Номер/дата уведомления Роскомнадзора либо проверенное применимое исключение по действующей статье 22.
3. Полная публичная policy, совпадающая с фактическим data flow; clean commit, green remote CI и immutable artifact этого SHA.
4. Candidate/activation exact final SHA, nginx holding → production и external HTTPS smoke всех 25 sitemap URL, redirects, headers, schema, assets, sources и `404`.
5. `PRODUCTION_RELEASE_SHA=<final SHA>`, `PRODUCTION_MONITOR_ENABLED=true`, ожидаемо красная failure simulation и затем successful monitor run.
6. Публичный rollback/forward drill и финальная post-deploy evidence запись.

До выполнения всех шести пунктов слово «production» не используется как синоним внутреннего healthy process или валидного TLS holding.
