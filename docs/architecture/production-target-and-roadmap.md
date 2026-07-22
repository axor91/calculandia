# Целевая архитектура и план реализации

- Статус: **Approved for implementation**
- Основание: baseline `170153337ef3507907e1d91c504b45374e0c03ef`
- Дата: 2026-07-15

## 1. Цель

Запустить по `https://calculandia.ru` production-сайт с 14 проверенными калькуляторами, четырьмя category hubs, task-first responsive UI, корректной индексацией, воспроизводимым deploy и измеримым release gate.

Масштаб каталога не является критерием успеха. Критерии — правильность результата, завершение задачи, понятные допущения, доступность и эксплуатационная устойчивость.

## 2. Принятые ограничения первого релиза

- Модульный монолит Next.js; микросервисы, Redis и очереди не используются.
- Публичный runtime не зависит от PostgreSQL/Prisma.
- Каталог и контент типизированы и хранятся в Git.
- Admin/login и content-management write API отсутствуют в production bundle.
- Произвольный HTML, script-реклама и arbitrary JSON-LD отсутствуют.
- Product analytics, Replay и реклама выключены.
- Рабочие дни РФ и solver уравнений не публикуются.
- Формулы выполняются в браузере; пользовательские значения не отправляются серверу.
- Единственный launch POST endpoint принимает только same-origin JSON allowlist-событие технической ошибки без message, stack, query, fragment и значений полей; тело ограничено 1 KiB, частота — 10 принятых событий в минуту на client bucket и 300 в минуту на процесс.
- Deploy target — проверенный сервер `203.0.113.10`, nginx/FastPanel + PM2 + Next standalone на side-by-side Node 22.22.2.

Нормативные ADR перечислены в [`../README.md`](../README.md).

## 3. Модульные границы

Логические границы (часть контента физически хранится рядом с типизированным каталогом, UI — в `components/`):

```text
catalog/
  definitions, categories, aliases, related graph, validation

calculations/
  pure formula modules, input/output types, golden tests

content/
  structured page sections, examples, sources, assumptions

ui/
  site shell, catalog/search, calculator shell, field/result primitives

platform/
  metadata, structured data, sitemap, redirects, headers, health, logging
```

Расчётный модуль не импортирует React/Next и не читает env/network/time без явного аргумента. UI не дублирует формулу. Registry не содержит произвольных component strings.

## 4. Целевая структура маршрутов

```text
/
/kalkulyatory
/kalkulyatory/matematika
/kalkulyatory/finansy
/kalkulyatory/data-i-vremya
/kalkulyatory/stroitelstvo
/kalkulyator/{slug}
/o-proekte
/metodologiya
/istochniki
/kontakty
/politika-konfidencialnosti
/healthz
```

Точные 14 URL и redirects: [`../product/launch-manifest.md`](../product/launch-manifest.md). URL contract: ADR-0002.

## 5. Данные каталога

```ts
type CalculatorDefinition = {
  slug: CalculatorSlug;
  category: CategoryId;
  component: CalculatorComponentId;
  status: "published" | "draft";
  title: string;
  shortDescription: string;
  aliases: readonly string[];
  seo: { title: string; description: string };
  formulaVersion: string;
  contentUpdatedAt: ISODate;
  formulaReviewedAt: ISODate;
  sourceCheckedAt: ISODate;
  dataEffectiveAt?: ISODate;
  assumptions: readonly string[];
  roundingPolicy: string;
  sources: readonly Source[];
  examples: readonly WorkedExample[];
  sections: readonly ContentSection[];
  faq: readonly FaqItem[];
  related: readonly CalculatorSlug[];
};
```

Build-time TypeScript validation проверяет:

- уникальность slug;
- опубликованную category;
- существование component;
- related graph без broken target/self-loop/duplicate;
- обязательные даты/источники/examples;
- длины title/description;
- соответствие sitemap только published entries.

Rich content хранится структурой (`paragraph`, `heading`, `list`, `formula`, `example`, `table`, `note`) и рендерится безопасными компонентами. MDX/HTML/CMS не нужны в launch.

## 6. Rendering и caching

- Главная, каталог, категории, trust pages и calculator pages статически генерируются при build.
- `generateStaticParams` берёт только published registry entries.
- Нет ISR, зависящего от БД.
- HTML/assets кэшируются nginx с immutable policy для hashed static assets и короткой revalidation для HTML.
- `/healthz` динамически подтверждает процесс/version без external dependencies.
- 404 не кэшируется как замена инфраструктурной ошибке.

## 7. UI-архитектура

### Calculator shell

Общие компоненты:

- `LocalizedNumberField`;
- `DateField` с локализованным выбранным значением;
- `FieldError`/`ErrorSummary`;
- `ModeSelector`;
- `ResultPanel` без автоматического live-объявления при каждом вводе; отдельный `role=status` используется для результата явного действия и статуса копирования;
- `CalculatorActions` (reset/share fragment);
- `FormulaBlock`, `WorkedExample`, `SourceList`, `RelatedTools`.

Short O(1) formulas обновляются live только после valid parse. Schedules и потенциально тяжёлые расчёты запускаются по submit. Mobile и desktop имеют одинаковую функциональность; таблица графика не урезается на mobile, а адаптируется/раскрывается.

Полная UI/state/search спецификация: [`../product/search-page-and-ui-spec.md`](../product/search-page-and-ui-spec.md).

## 8. SEO

### Metadata/indexation

- unique title/description/canonical для каждого published URL;
- root metadataBase = canonical origin;
- categories имеют самостоятельное описание и список задач;
- staging/preview не индексируются на уровне response header/meta и закрыты auth/network policy;
- login/admin отсутствуют;
- query duplicate нормализуется canonical, share-state только fragment.

### Structured data

Разрешены генерируемые кодом:

- `Organization`;
- `WebSite`;
- `BreadcrumbList` с реально существующими ссылками.
- `WebApplication` для опубликованной страницы калькулятора с видимыми названием, описанием, бесплатной ценой и датой изменения.

`WebApplication` принят ADR-0007. Другие типы добавляются только отдельным тестируемым решением. FAQ остаётся видимым content, но `FAQPage` не используется ради rich result.

Serializer заменяет `<` на `\u003c` перед вставкой JSON в script.

### Sitemap/robots

- sitemap содержит только canonical published routes;
- `lastModified` берётся из существенной content/formula даты;
- draft/health/admin/API не включаются;
- robots указывает canonical sitemap;
- URL-проверки выполняются после production deploy.

## 9. Security и privacy

Threat model: [`../security/threat-model-and-privacy.md`](../security/threat-model-and-privacy.md).

Обязательные controls:

- dependencies pinned lockfile, audit/exception policy;
- canonical production origin фиксирован; release identity берётся только из Git-bound `.next/BUILD_ID`, а не runtime env;
- одна CSP, совместимая со статическим рендером;
- `frame-ancestors 'none'`, `object-src 'none'`, strict referrer/permissions policy;
- никакого user HTML/eval/ad scripts;
- body limits и reverse-proxy timeouts;
- no Replay/analytics/input logging;
- dependency exception имеет owner, reachability, compensating control и expiry.

## 10. Тестовая стратегия

### Formula

- golden/boundary/property tests по стандарту качества;
- отдельные reference fixtures, не вычисленные тестируемой функцией;
- timezone matrix для date functions;
- reconciliation для financial schedules.

### Component/accessibility

- default/invalid/result/reset/share states;
- label/description/error linkage;
- keyboard mode controls;
- axe 0 critical/serious;
- screen-reader smoke вручную на staging.

### E2E

- главная → поиск → calculator → result → related;
- каждый category link и breadcrumb;
- redirects baseline → canonical;
- 404;
- sitemap/robots/canonical/schema;
- responsive smoke representative calculator каждого structural type.

### Platform

- install/lint/typecheck/unit/component/build;
- dependency audit policy;
- link checker 0 broken links;
- healthcheck/deploy/rollback smoke;
- Lighthouse budgets.

## 11. CI/CD

```text
npm ci
→ lint
→ typecheck
→ unit/component tests + coverage
→ build
→ dependency/license checks
→ E2E against standalone artifact
→ Lighthouse/link/schema checks
→ Git-bound BUILD_ID + full SHA-256 manifest + read-only artifact
→ staging smoke
→ production atomic deploy
→ post-deploy smoke/rollback
```

После baseline создан private repository `github.com/axor91/calculandia` и настроен `origin`. Первый production push выполняется из clean ветки `main`; deploy разрешён только для commit, прошедшего remote CI и совпадающего с `.next/BUILD_ID`.

## 12. План и зависимости

Оценки являются forecast, а не quality deadline. Они предполагают автономную реализацию с параллельными review-потоками; внешний доступ к DNS/репозиторию может изменить календарное время.

| Workstream                     | Зависит от           | Optimistic | Expected | Pessimistic | Gate                                            |
| ------------------------------ | -------------------- | ---------: | -------: | ----------: | ----------------------------------------------- |
| Документы/ADR/baseline         | —                    |      0.5 д |      1 д |         2 д | Documentation review approved                   |
| P0 toolchain/security          | baseline             |        1 д |      2 д |         4 д | green install/lint/type/test/build/audit policy |
| Catalog/routes/platform        | P0                   |      1.5 д |      3 д |         5 д | registry/SEO/redirect tests                     |
| Design system/shell/search     | catalog contract     |      1.5 д |      3 д |         5 д | responsive/a11y component gate                  |
| Existing formula correction    | quality spec         |        1 д |      2 д |         4 д | independent golden review                       |
| 10 new launch tools/content    | shell + quality spec |        3 д |      6 д |        10 д | all 14 page DoD                                 |
| E2E/performance/security       | integrated site      |      1.5 д |      3 д |         5 д | release candidate review                        |
| Server/TLS/deploy/verification | artifact + access    |        1 д |      2 д |         4 д | production smoke + rollback                     |

При параллельной работе expected critical path: **12–18 рабочих дней**; optimistic: 8–10; pessimistic: 20–30 при существенном rework/внешних блокерах. Предыдущая неподтверждённая оценка 7–10 дней отменена.

Quality cut-line не снижается ради даты. Если сроки сжимаются, уменьшается только число непроиндексированных Wave 2 функций; 14 launch URL являются текущим утверждённым scope и меняются только обновлением manifest.

## 13. Реализационные этапы и review gates

### Gate A — документы

- baseline SHA записан;
- ADR Accepted;
- manifest точен;
- correctness/input/UI/deploy/privacy спецификации измеримы;
- независимое documentation review — approved.

### Gate B — P0 platform

- secure dependencies;
- зелёные lint/type/test/build;
- admin/DB/arbitrary HTML удалены из production path;
- env/CSP/health/logging готовы;
- независимое code/security review — approved.

### Gate C — foundation

- registry/routes/redirects/search/shell;
- main/category/trust pages;
- metadata/schema/sitemap/robots;
- responsive foundation;
- architecture/SEO/UX review — approved.

### Gate D — calculator catalog

- 14 manifest tools;
- formula/content/source/accessibility tests;
- independent formula/product review — approved.

### Gate E — release candidate

- E2E, browser matrix, Lighthouse, link/schema/security;
- deploy/rollback artifact;
- final review — approved.

### Gate F — production

- valid TLS/canonical redirects;
- smoke/health/monitoring;
- sitemap/Webmaster/Search Console;
- rollback drill;
- documentation updated with release SHA and evidence.

## 14. Measurable page DoD

Calculator URL готов, если:

- 100% обязательных fields definition schema присутствуют;
- golden/boundary/property tests зелёные с документированной tolerance;
- минимум 2 видимых worked examples совпадают с результатом; независимо от них formula suite содержит минимум 3 hand-calculated golden cases по стандарту качества;
- formula/source/review/assumption metadata видимы;
- default state выдаёт корректный результат;
- axe: 0 critical/serious;
- keyboard smoke проходит;
- 360×800 и 390×844: нет page horizontal scroll и основное действие доступно без блокирующей рекламы;
- 1366×768: form и primary result одновременно видны для short tool;
- canonical/breadcrumb/related targets существуют;
- structured data соответствует видимому HTML;
- unit/component/E2E route tests зелёные.

## 15. Measurable release DoD

- CI pipeline exit 0;
- 14/14 manifest calculators проходят page DoD;
- 0 broken internal links;
- 0 unknown published registry components;
- 0 unresolved reachable critical vulnerabilities; high имеют исправление либо временное exception с owner/expiry;
- Lighthouse budgets выполнены на representative pages;
- production HTTPS/canonical/redirect/sitemap/robots/404/health проверены;
- test alert доставлен либо документирован log/uptime fallback;
- rollback на предыдущий artifact выполнен в test drill ≤ 10 минут;
- RPO публичного code-first content = Git/release artifact; mutable production data отсутствуют;
- release SHA и результаты gates записаны в документации.
