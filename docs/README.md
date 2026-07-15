# Документация Calculandia

Актуально на **15 июля 2026 года**.

## Статус

Baseline исходного проекта зафиксирован коммитом `170153337ef3507907e1d91c504b45374e0c03ef` (`chore: capture pre-production baseline`). Это намеренно сохранённое **known-broken** состояние, а не release candidate.

- Node во время аудита: `v22.22.2`.
- npm: `10.9.7`.
- SHA-256 исходного `package-lock.json`: `5e5dfa1f630b8540bdde43af8e2b6975a174d23594b317597d7b1e1692a6b778`.
- Документационный gate: исправляется по результатам трёх независимых ревью.
- Production gate: закрыт; публичный запуск запрещён до выполнения release DoD.

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

## Принятые решения

- [`decisions/0001-public-catalog-runtime.md`](decisions/0001-public-catalog-runtime.md) — code-first каталог, без runtime-БД в первом релизе.
- [`decisions/0002-url-and-indexation.md`](decisions/0002-url-and-indexation.md) — URL, canonical, redirects и параметры.
- [`decisions/0003-official-changing-data.md`](decisions/0003-official-changing-data.md) — официальные изменяемые данные и производственный календарь.
- [`decisions/0004-admin-and-content-security.md`](decisions/0004-admin-and-content-security.md) — админка отключена, произвольный HTML запрещён.
- [`decisions/0005-telemetry-and-user-data.md`](decisions/0005-telemetry-and-user-data.md) — privacy-first телеметрия без значений расчётов.
- [`decisions/0006-production-deployment.md`](decisions/0006-production-deployment.md) — один выбранный production design.

## Термины статуса

- **Подтверждено** — доказано кодом, воспроизводимой командой, HTTP-проверкой или зафиксированным визуальным просмотром.
- **Не обнаружено** — отсутствует в репозитории/доступном окружении; внешнее наличие не исключено.
- **Не проверялось** — вне доступного контура или требует отдельного доступа/процедуры.
- **Решение** — принято ADR и обязательно для реализации.
- **Гипотеза** — требует данных и не может блокировать или определять архитектуру сама по себе.

## Исторические материалы

[`archive/original-audit.md`](archive/original-audit.md) сохранён для происхождения проекта. Он содержит противоречивые и устаревшие требования и исключён из нормативного набора.
