# Implementation review gates

- Дата: 2026-07-16
- Scope: foundation, 14 launch calculators, responsive UX/a11y, SEO, security, release engineering
- Метод: независимые review-потоки с обязательным повторным review после исправлений

## Gate C — platform, SEO и release engineering

### Первый проход — Changes required

Ревью выявило release-blocking расхождения:

- legacy redirects могли формировать localhost destination;
- 404 наследовал homepage canonical;
- часть source URL не подтверждала заявленную методику;
- отсутствовали remote CI и строгая dirty-artifact production gate;
- privacy/telemetry boundary и production ownership требовали явного evidence.

Исправлено:

- четыре legacy route handler возвращают точный `301` на HTTPS canonical;
- root canonical перенесён на homepage, 404 отдаёт `404 + noindex` без canonical;
- девять уникальных источников проверены и привязаны к соответствующим методам;
- добавлены CI, Git-bound 40-character `BUILD_ID`, full-file secret scan, SHA-256 manifest, read-only artifact и negative verifier tests;
- telemetry ограничена same-origin JSON allowlist, 1 KiB и двухуровневым rate limit; значения расчётов не логируются;
- подготовлены отдельный runtime user, Node 22, immutable release layout, nginx/PM2/logrotate и fail-closed activate/rollback scripts.

### Повторный проход — Technical Approved

Независимо подтверждены:

- 447 unit/property tests;
- coverage 85.63% statements, 81.89% branches, 86.11% functions, 89.48% lines;
- 37 production routes, 14 пререндеренных calculator pages;
- 2,226 artifact files, manifest/read-only/secret-scan checks;
- canonical/schema/sitemap/crawl/redirect/404/security-header contracts;
- Chromium, Firefox и WebKit matrix;
- отсутствие High/Critical dependency findings.

Release Candidate отдельно подтверждён clean remote commit `bdd7c4c`, green CI, immutable internal activation и boot recovery. Production verdict требует публичного proxy/monitor/rollback evidence и утверждённой operator/privacy information.

## Gate D — calculator correctness и content quality

### Первый проход — Changes required

Найдены неполные result contracts, отсутствующие теоретические значения для строительных закупок, недостаточная видимость процентов при досрочном погашении, неоднозначность формул пропорций и scale-dependent rounding.

Исправлено:

- для каждого инструмента унифицированы formula/assumptions/result/source/FAQ contracts;
- финансовые результаты показывают сравнимые total interest values;
- плитка и обои показывают теоретическое количество, закупочное округление и полезную площадь;
- варианты пропорции описаны явно;
- закупочные количества переведены на направленные exact decimal-ratio `ceil`/`floor` без epsilon snap;
- введены invariants против недокупки и regressions для больших/малых decimal boundary.

### Финальный повторный проход — Approved

- 134 targeted tests passed;
- дополнительный 5,000-case fuzz smoke для плитки/обоев прошёл без исключений, коротких полотен и недокупки;
- чрезмерно малый раппорт обоев безопасно отклоняется до integer multiplication;
- `piecesToBuy >= piecesWithReserve` и `cutLength >= minimumCutLength` подтверждены.

## UX/UI, responsive и accessibility gate

### Первый проход — Changes required

Исправлены:

- недостаточный contrast muted/amber элементов;
- ложное `aria-invalid` для всех полей при form-level ошибке;
- неоднозначные label/hint и отсутствующее объявление изменившегося результата;
- keyboard search/menu/share/schedule interactions;
- мобильное переполнение и полная browser/viewport matrix.

### Финальный повторный проход — Approved

Дополнительная проверка обнаружила accessible-name mismatch логотипа и недостаточный non-text contrast границ/focus indicator. Accessible name теперь содержит видимый label, axe matrix включает WCAG 2.1/2.2 A и AA; control border затемнён до `#878d87`, search использует тот же token, focus indicator — `3px #08796c` без отключения outline.

Финальный независимый verdict: открытых Critical/High/Medium findings нет. Подтверждены 75 passed / 6 intentional skips в полном Chromium/Firefox/WebKit matrix, 51 дополнительная комбинация ширин 320/768/1920 px без overflow и Lighthouse 99/100/100/100 на обеих representative страницах.

## Незакрытые внешние условия Production Gate

1. Проверяемая идентичность владельца/оператора, адрес и privacy contact.
2. Финальный policy/ops `origin/main` commit и зелёный GitHub CI.
3. Переключение valid-TLS holding на production proxy и external smoke.
4. Exact-SHA monitor failure simulation/success и rollback drill с evidence.

Ни одно из этих условий не подменяется локальным review verdict.
