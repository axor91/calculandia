# Документация Calculandia

Актуально на **16 июля 2026 года**.

## Статус

Baseline исходного проекта зафиксирован коммитом `170153337ef3507907e1d91c504b45374e0c03ef` (`chore: capture pre-production baseline`). Это намеренно сохранённое **known-broken** состояние, а не release candidate.

- Node во время аудита: `v22.22.2`.
- npm: `10.9.7`.
- SHA-256 исходного `package-lock.json`: `5e5dfa1f630b8540bdde43af8e2b6975a174d23594b317597d7b1e1692a6b778`.
- Documentation, P0 platform и calculator correctness gates: **Approved** после повторных независимых ревью.
- Release Candidate gate: в работе; clean commit/remote CI ещё не зафиксированы.
- Production gate: **не утверждён**; публичный запуск запрещён до operator/privacy approval, TLS/deploy/monitor/rollback evidence.

## Нормативные документы

1. [`audit/2026-07-15-production-readiness.md`](audit/2026-07-15-production-readiness.md) — подтверждённое состояние baseline и обнаруженные риски.
2. [`architecture/production-target-and-roadmap.md`](architecture/production-target-and-roadmap.md) — принятая целевая архитектура, этапы и измеримые gates.
3. [`product/launch-manifest.md`](product/launch-manifest.md) — точный список URL первого релиза и launch cut-line.
4. [`product/calculator-quality-standard.md`](product/calculator-quality-standard.md) — контракт ввода, формул, точности, источников и проверки.
5. [`product/search-page-and-ui-spec.md`](product/search-page-and-ui-spec.md) — поиск, page anatomy, состояния, responsive и accessibility.
6. [`research/2026-07-15-competitors-ux-seo.md`](research/2026-07-15-competitors-ux-seo.md) — выводы конкурентного исследования.
7. [`research/evidence-log.md`](research/evidence-log.md) — воспроизводимый журнал просмотренных URL и экранов.
8. [`operations/production-design.md`](operations/production-design.md) — принятый production topology, deploy, rollback и SLO.
9. [`security/threat-model-and-privacy.md`](security/threat-model-and-privacy.md) — trust boundaries, данные, угрозы и телеметрия.
10. [`implementation/status.md`](implementation/status.md) — текущие gates и внешние блокеры.
11. [`reviews/2026-07-15-documentation-gate.md`](reviews/2026-07-15-documentation-gate.md) — замечания независимого ревью и принятые решения.
12. [`security/dependency-exceptions.md`](security/dependency-exceptions.md) — ограниченные по сроку dependency exceptions и reachability.
13. [`reviews/2026-07-16-implementation-gates.md`](reviews/2026-07-16-implementation-gates.md) — findings и повторные ревью foundation, 14 калькуляторов, UX и release engineering.
14. [`research/2026-07-16-visual-implementation-review.md`](research/2026-07-16-visual-implementation-review.md) — viewport/browser evidence реализованного интерфейса.
15. [`legal/production-privacy-checklist.md`](legal/production-privacy-checklist.md) — фактический data flow, обязательные данные оператора и legal Production Gate.
16. [`operations/2026-07-16-preproduction-evidence.md`](operations/2026-07-16-preproduction-evidence.md) — remote CI, immutable server candidate, process isolation, boot и TLS/holding evidence.

## Принятые решения

- [`decisions/0001-public-catalog-runtime.md`](decisions/0001-public-catalog-runtime.md) — code-first каталог, без runtime-БД в первом релизе.
- [`decisions/0002-url-and-indexation.md`](decisions/0002-url-and-indexation.md) — URL, canonical, redirects и параметры.
- [`decisions/0003-official-changing-data.md`](decisions/0003-official-changing-data.md) — официальные изменяемые данные и производственный календарь.
- [`decisions/0004-admin-and-content-security.md`](decisions/0004-admin-and-content-security.md) — админка отключена, произвольный HTML запрещён.
- [`decisions/0005-telemetry-and-user-data.md`](decisions/0005-telemetry-and-user-data.md) — privacy-first телеметрия без значений расчётов.
- [`decisions/0006-production-deployment.md`](decisions/0006-production-deployment.md) — один выбранный production design.
- [`decisions/0007-calculator-structured-data.md`](decisions/0007-calculator-structured-data.md) — тестируемый `WebApplication` для canonical calculator pages.

## Термины статуса

- **Подтверждено** — доказано кодом, воспроизводимой командой, HTTP-проверкой или зафиксированным визуальным просмотром.
- **Не обнаружено** — отсутствует в репозитории/доступном окружении; внешнее наличие не исключено.
- **Не проверялось** — вне доступного контура или требует отдельного доступа/процедуры.
- **Решение** — принято ADR и обязательно для реализации.
- **Гипотеза** — требует данных и не может блокировать или определять архитектуру сама по себе.

## Исторические материалы

[`archive/original-audit.md`](archive/original-audit.md) сохранён для происхождения проекта. Он содержит противоречивые и устаревшие требования и исключён из нормативного набора.
