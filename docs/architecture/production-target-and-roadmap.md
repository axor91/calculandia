# Целевая архитектура и дорожная карта Calculandia

Статус: **предложение по итогам аудита**  
Дата: **15 июля 2026 года**

## 1. Цель первого релиза

Опубликовать не максимальный каталог, а устойчивую платформу, которую можно сразу отдавать на индексацию и затем расширять без изменения базовой архитектуры.

Первый релиз должен включать:

- 12–15 полноценных калькуляторов;
- четыре содержательные категории;
- task-first UI и адаптивность;
- корректные canonical, sitemap, robots и breadcrumbs;
- formula/source/update metadata;
- безопасный публичный runtime без зависимости от доступности CMS;
- мониторинг, backup и воспроизводимый deploy.

## 2. Архитектурные решения

### 2.1 Модель приложения

Оставить модульный монолит Next.js. Микросервисы, очередь задач и Redis на первом этапе не нужны: они не решают текущие блокеры и увеличивают операционную стоимость.

Границы:

- `catalog` — определения категорий и калькуляторов;
- `calculations` — чистые формулы и схемы ввода/вывода;
- `content` — SEO-текст, примеры, FAQ, источники и дата проверки;
- `ui` — общий calculator shell и специализированные widgets;
- `platform` — metadata, sitemap, headers, monitoring и deploy;
- `admin` — отдельная необязательная граница, отключённая в первом production-релизе.

### 2.2 Источник истины

Предложение: **code-first публичный каталог + version-controlled content**.

Причины:

- реализация формулы и React-компонент уже находятся в коде;
- произвольное имя компонента из БД не даёт настоящего единого источника истины;
- публичные страницы не должны исчезать при отказе БД;
- изменения формул требуют review, тестов и версии;
- Git даёт историю и rollback без разработки полноценной CMS.

PostgreSQL используется там, где данные действительно изменяются независимо от deploy:

- будущая CMS и редакционный workflow;
- пользователи/роли;
- audit log;
- holiday cache;
- операционные настройки, если они не влияют на целостность каталога.

Статус решения: proposed. Перед реализацией требуется зафиксировать его как ADR, но оно рекомендовано для быстрого запуска.

### 2.3 Типизированное определение

Концептуальный контракт:

```ts
type CalculatorDefinition = {
  slug: string;
  category: CategoryId;
  component: CalculatorComponentId;
  formulaVersion: string;
  title: string;
  description: string;
  seo: {
    title: string;
    description: string;
  };
  updatedAt: string;
  sources: Source[];
  related: string[];
  status: "draft" | "published";
};
```

`component` выбирается из union/typed map, а не принимается как произвольная строка из БД.

## 3. Предлагаемая структура

```text
app/
  kalkulyatory/
    page.tsx
    [category]/page.tsx
  kalkulyator/
    [slug]/page.tsx
  o-proekte/page.tsx
  metodologiya/page.tsx
  istochniki/page.tsx
  kontakty/page.tsx
  politika-konfidencialnosti/page.tsx

src/ или существующие корневые каталоги:
  catalog/
    categories.ts
    calculators.ts
    types.ts
  content/
    calculators/{slug}.mdx
    categories/{slug}.mdx
  logic/
    {slug}.ts
  components/
    calculators/
    calculator-shell/
    catalog/
  lib/
    seo/
    structured-data/
    formatting/
    monitoring/
```

Переезд каталогов под `src/` не является обязательным для запуска. Важнее границы модулей и типизированные контракты.

## 4. Информационная архитектура

### 4.1 Маршруты

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
```

Калькулятор имеет flat URL вне category path. Это позволяет менять категорию без изменения адреса и накопленного поискового сигнала.

Существующие `/calculator/{id}` получают 301 redirect на новые канонические URL. Карта redirect фиксируется до первой индексации и покрывается тестами.

### 4.2 Навигация

Desktop header:

- логотип;
- поиск;
- категории;
- все калькуляторы;
- о проекте.

Mobile header:

- логотип;
- отдельная понятная кнопка поиска;
- одна кнопка menu;
- drawer с категориями и trust/legal links.

## 5. Каталог первого релиза

Целевой объём: 12–15 страниц. Финальная граница определяется качеством, а не календарным числом.

### 5.1 Математика

1. Универсальный калькулятор процентов, включая процент от числа, число по проценту, изменение и разницу.
2. Калькулятор дробей.
3. Пропорции.
4. Уравнения/системы уравнений с понятным scope.
5. Среднее значение — если успевает пройти тот же content/QA gate.

Текущий `percent-diff` объединяется с более сильным универсальным intent либо сохраняется как режим с 301 redirect старого URL.

### 5.2 Финансы

1. Ипотека.
2. Кредит.
3. Вклад и сложный процент.
4. Досрочное погашение.

Обязательны источники, дата проверки, описание допущений и дисклеймер о справочном характере результата.

### 5.3 Дата и время

1. Разница между датами.
2. Прибавить/вычесть период из даты.
3. Возраст.
4. Рабочие дни РФ.

Если два intent реализуются на одной странице, URL и content должны соответствовать главному запросу, а интерфейс — не превращаться в длинный набор несвязанных режимов.

### 5.4 Строительство

1. Бетон.
2. Плитка.
3. Обои либо напольное покрытие.

Эта категория имеет практический спрос и более низкий риск быстро устаревающих нормативов, чем налоги и пособия.

### 5.5 Что откладывается

- НДФЛ, НДС, УСН, зарплата, пособия — до официального data-update pipeline.
- Здоровье — до формализованных источников, review и дисклеймеров.
- Авто и спорт — до подтверждения спроса и качества первых четырёх clusters.
- Тысячи автоматически сгенерированных converters — не входят в стратегию запуска.

## 6. Шаблоны страниц

### 6.1 Главная

1. H1/позиционирование без SEO-полотна.
2. Поиск с подсказками.
3. Популярные задачи.
4. Четыре категории.
5. Новые и обновлённые калькуляторы.
6. Коротко о проверке формул.
7. Footer с trust/legal.

### 6.2 Категория

1. Breadcrumbs.
2. H1 и уникальное введение.
3. Популярные инструменты.
4. Task-based subgroups.
5. Все опубликованные калькуляторы категории.
6. Связанный guide только при самостоятельной ценности.

Категория не публикуется, пока в ней нет минимум трёх полноценных инструментов.

### 6.3 Калькулятор

1. Breadcrumbs.
2. H1 и одно предложение о результате.
3. Calculator shell: inputs + live result.
4. Presets, reset, copy/share URL.
5. Формула и алгоритм.
6. Worked examples.
7. Интерпретация и ограничения.
8. Источники, formula version и дата проверки.
9. Related calculators.
10. Visible FAQ без FAQPage schema.
11. Реклама после результата/полезного блока.

### 6.4 Trust-страницы

- «О проекте» — назначение, владелец, контакты.
- «Методология» — как выбираются формулы, тестируются границы и обновляются данные.
- «Источники» — политика первичных источников.
- Политика конфиденциальности — фактически используемые данные и trackers.
- Контакты — способ сообщить об ошибке в формуле.

## 7. SEO-архитектура

### 7.1 Metadata

- уникальные title/description;
- canonical только на production host;
- Open Graph/Twitter cards;
- никаких автоматически составленных keywords как основного SEO-механизма;
- `noindex` для draft, поиска с параметрами, preview и admin.

### 7.2 Structured data

Генерируется только кодом из типизированных данных:

- Organization;
- WebSite;
- BreadcrumbList.

Дополнительный тип добавляется только если страница полностью соответствует его официальным требованиям и видимому контенту. Произвольное поле JSON-LD в админке удаляется.

FAQ остаётся полезным видимым блоком, но не рассматривается как источник Google rich result.

### 7.3 Sitemap и robots

- только canonical published URLs;
- фактический `lastModified` из версии контента;
- admin/API/preview не попадают в sitemap;
- sitemap index вводится только при реальной необходимости;
- robots не используется как замена auth/noindex;
- после deploy sitemap отправляется в Яндекс Вебмастер и Search Console.

### 7.4 Перелинковка

```text
Главная → категории → калькуляторы
Калькулятор → реальная категория
Калькулятор → 3–6 следующих релевантных задач
Trust/content page → соответствующие калькуляторы
```

Не создавать orphan pages и не связывать страницы только потому, что у них одинаковый математический тип.

## 8. UX/UI-система

### 8.1 Визуальное направление

- спокойная техническая идентичность, но не безликий admin UI;
- один сильный accent для действий и результата;
- ясная типографическая иерархия;
- границы используются для структуры, а не вокруг каждого блока;
- умеренные hover/focus состояния допустимы и нужны для affordance;
- анимация только функциональная и с поддержкой reduced motion.

Старое правило «никаких hover/анимаций и только прямоугольники» не должно быть абсолютным. Оно не улучшает доступность само по себе и мешает отличать интерактивные элементы.

### 8.2 Calculator shell

Desktop:

- form и result panel в двух колонках;
- result остаётся видимым при разумной длине формы;
- related/sidebar не уменьшает рабочую область.

Mobile:

- одна колонка;
- progressive disclosure для дополнительных параметров;
- live result сразу после активной группы;
- sticky summary допустим, если не закрывает keyboard/fields;
- минимум элементов перед калькулятором.

### 8.3 Доступность

- semantic headings/forms;
- label/id и понятные units;
- keyboard navigation и видимый focus;
- ошибки через текст + `aria-describedby`/live region;
- touch targets ≥44×44;
- contrast WCAG AA;
- графики имеют table/text equivalent;
- native date control сопровождается локализованным представлением.

## 9. Безопасность и эксплуатация

### 9.1 Production topology

```text
Internet
  → DNS
  → nginx/reverse proxy или CDN с валидным TLS
  → Next.js Node 22 application
  → PostgreSQL только при необходимости runtime-данных
  → Sentry/logs/uptime monitoring
```

Reverse proxy выполняет request limits, размер body, timeout и базовую фильтрацию некорректных запросов. Источник: [Next.js Self-hosting](https://nextjs.org/docs/app/guides/self-hosting).

### 9.2 Обязательные меры

- env schema и отказ старта при отсутствии production secrets;
- никаких fallback credentials;
- закрытая админка на первом релизе;
- security headers из одного источника;
- CSP без произвольных scripts;
- dependency audit в CI;
- миграции отдельным контролируемым шагом;
- backup + проверяемый restore;
- Sentry instrumentation и global error handler;
- uptime/5xx alert;
- логирование без персональных/секретных данных.

## 10. CI/CD

Минимальный pipeline:

1. `npm ci`.
2. Prisma generate.
3. ESLint.
4. TypeScript.
5. Unit/component tests.
6. Production build.
7. Dependency audit policy.
8. Deploy staging.
9. Smoke/E2E staging.
10. Ручной promotion production.
11. Post-deploy smoke и rollback при ошибке.

Baseline и каждую фазу следует фиксировать отдельными коммитами. Нельзя начинать массовую переработку, пока текущий исходник не зафиксирован первым коммитом.

## 11. Дорожная карта

### Этап 0 — P0, дни 1–2

- baseline-коммит;
- безопасные версии Next.js/React и совместимые обновления зависимостей;
- исправление теста, TypeScript, ESLint и build;
- env validation и удаление fallback secrets;
- отключение admin/write routes в production;
- единая CSP;
- рабочая production DB либо исключение DB из public render path;
- vhost, валидный TLS и canonical redirect.

Результат: приложение технически можно развернуть, но каталог ещё не считается SEO-ready.

### Этап 1 — фундамент, дни 3–4

- типизированный catalog registry;
- категории и новые маршруты;
- redirect map;
- новый calculator shell;
- поиск и главная;
- metadata/structured data/sitemap/robots;
- trust/legal pages;
- `next/font`;
- CI и staging.

Результат: готов повторяемый шаблон для наполнения.

### Этап 2 — контент и калькуляторы, дни 5–8

- переработка пяти текущих инструментов;
- добавление 7–10 новых по утверждённому launch catalog;
- edge-case unit tests;
- формулы, примеры, источники, limitations и updatedAt;
- related links;
- responsive/accessibility/component/E2E проверки.

Результат: 12–15 страниц проходят единый quality gate.

### Этап 3 — запуск, дни 9–10

- production deploy;
- проверка HTTP/HTTPS/www/canonical/404/500;
- проверка robots и sitemap на production host;
- smoke/E2E на типовых ширинах;
- CWV/Lighthouse baseline;
- Sentry, uptime и backup;
- Яндекс Вебмастер/Search Console;
- отправка sitemap и нескольких ключевых URL на переобход.

Результат: индексируемый первый релиз.

### Первые 30 дней

- ежедневный контроль 5xx/404/crawl на первой неделе;
- анализ индексации, canonical и запросов;
- исправление UX по session/analytics только при корректной privacy-конфигурации;
- 2–3 новых качественных калькулятора в неделю;
- приоритет по Wordstat/Webmaster/Search Console, а не по размеру каталога конкурентов;
- рекламу включать постепенно после подтверждения, что она не ухудшает task completion и CWV.

## 12. Definition of Done калькулятора

Страница считается готовой, если:

- имеет один ясный search/user intent;
- формула реализована чистой функцией;
- покрыты happy path, границы, invalid input и числовая стабильность;
- результат проверен независимым примером;
- есть понятные labels/units/errors;
- есть реалистичные defaults или объяснено их отсутствие;
- desktop/mobile результат появляется без лишней прокрутки;
- есть формула, worked example, limitations, источники и дата проверки;
- нет неподтверждённых утверждений и выдуманного автора/эксперта;
- metadata/canonical/breadcrumbs/related links корректны;
- structured data соответствует видимому содержимому;
- отсутствует реклама до первого полезного результата;
- страница проходит unit, component/E2E, accessibility smoke и responsive matrix.

## 13. Definition of Done релиза

- все P0 закрыты;
- CI полностью зелёный;
- 12–15 калькуляторов проходят page DoD;
- нет broken internal links и orphan pages;
- нет публичных draft/admin/write endpoints;
- валидный HTTPS и единый canonical host;
- sitemap содержит только опубликованные canonical URL с реальным lastmod;
- CWV baseline измерен, критические regressions отсутствуют;
- monitoring/uptime/backup/rollback проверены;
- документация deploy и контентного обновления актуальна.

## 14. Решения, которые не входят в первый релиз

- микросервисы;
- Redis и очереди без доказанной нагрузки;
- полноценная многопользовательская CMS;
- тысячи автоматически созданных страниц;
- персональные кабинеты;
- сложная рекламная платформа;
- массовая локализация;
- псевдоэкспертные профили ради E-E-A-T.

Эти функции рассматриваются только после появления измеримого пользовательского или операционного запроса.

