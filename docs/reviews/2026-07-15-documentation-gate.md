# Documentation Gate A — review log

- Дата первого review: 2026-07-15
- Reviewers: три независимых Codex-потока — documentation, technical baseline, product/SEO/UX
- Первый verdict: **Rejected**
- Product/SEO/UX повторный verdict: **Approved**
- Documentation третий verdict: **Approved** после исправления Node runtime, deploy sequence и формульных contracts

## Финальный gate result

**APPROVED.** P0 implementation разрешена. Документы остаются живой нормативной системой и обновляются при изменении принятого решения или фактического evidence.

## Critical dispositions

| Замечание                            | Решение                                                                       | Evidence                                              | Статус            |
| ------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------- |
| Не проверена корректность формул     | Добавлен correctness audit, нормативный quality standard и golden gate        | `audit/...`, `product/calculator-quality-standard.md` | Addressed in docs |
| Не решён runtime DB/holiday calendar | Accepted ADR: static code-first runtime; working days removed from launch     | ADR-0001, ADR-0003                                    | Addressed         |
| Нет immutable baseline               | Создан known-broken root commit и записаны SHA/Node/npm/lock hash             | `1701533`, docs README/audit                          | Addressed         |
| Solver небезопасен/неточен           | Исключён из registry/manifest, baseline URL не получает production equivalent | launch manifest, ADR-0002                             | Addressed         |
| Input/precision contract отсутствует | Принят localized numeric/date/domain/rounding contract                        | calculator quality standard                           | Addressed         |

## High dispositions

| Замечание                               | Решение                                                                     | Evidence                     | Статус              |
| --------------------------------------- | --------------------------------------------------------------------------- | ---------------------------- | ------------------- |
| Необоснованные 7–10 дней                | Оценка отменена; added optimistic/expected/pessimistic workstream forecast  | architecture §12             | Addressed           |
| Нет точного launch cut-line             | Approved manifest: 14 canonical URL без alternatives                        | launch manifest              | Addressed           |
| Architecture остаётся proposed          | Шесть ADR получили Accepted                                                 | `docs/decisions/`            | Addressed           |
| Нет search architecture                 | Local registry combobox, no-JS fallback, no indexable search URL            | UI spec §1                   | Addressed           |
| Не определены URL/query/canonical       | Accepted URL/indexation ADR + redirect table                                | ADR-0002                     | Addressed           |
| Нет state/wireframe spec                | Добавлены wireframes и 8 states                                             | UI spec §2–3                 | Addressed           |
| Accessibility недостаточно измерима     | WCAG 2.2 AA, axe threshold, keyboard/SR/browser matrix                      | UI spec §4–5                 | Addressed           |
| Нет performance budgets/KPI             | Lab budgets и privacy-safe KPI добавлены                                    | UI spec §6–7                 | Addressed           |
| Конкурентные доказательства эфемерны    | Selected screenshots сохранены; URL/viewport/anatomy/assets/hashes записаны | evidence log + assets        | Addressed           |
| Нет production design/rollback/SLO      | Выбран один server topology, atomic releases, health, rollback ≤10m         | ADR-0006 + operations design | Addressed in design |
| Нет threat/privacy model                | Data inventory, trust boundaries, threats, retention и telemetry policy     | security document + ADR-0005 | Addressed           |
| Audit смешивает доказательства и выводы | Добавлена evidence boundary, уточнены DB/monitoring/JSON-LD claims          | updated audit                | Addressed           |
| Нет formula/editorial workflow          | Formula/review/source dates и published-error workflow                      | quality standard §5          | Addressed           |

## Medium dispositions

- Исторический `audit.md` перемещён в `docs/archive/`; root оставлен как короткий redirect stub.
- Selected visual artifacts сохранены в Git-ready `docs/assets`.
- Locale paste/comma/space contract принят.
- Accessibility baseline defects записаны как correctness/UX P0.
- Sentry example, Replay и obsolete config подлежат удалению в P0 batch.
- Dependency policy допускает только scoped exception с owner/expiry/controls.
- Backup object определён: immutable Git/release artifact; mutable launch DB отсутствует.

## Не закрывается документацией

Следующие замечания считаются только спроектированными и будут закрыты evidence реализации:

- формульные ошибки baseline;
- dependency/build/lint/test failures;
- admin/DB/Sentry/holiday removal;
- production vhost/TLS/monitoring;
- Git remote/push;
- actual responsive/accessibility/performance/browser results.
