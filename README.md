# Calculandia

**Живой сайт: [calculandia.ru](https://calculandia.ru)** — платформа
русскоязычных онлайн-калькуляторов: 30 калькуляторов в четырёх категориях,
41 индексируемый URL. Next.js 15 (App Router) + React 19, прод без БД
(ADR-0001), деплой за nginx.

Репозиторий открыт как инженерная витрина: здесь видно не «код калькулятора»,
а **как одиночный разработчик держит прод дисциплиной релизных гейтов** —
каждая страница проходит единый контракт качества до выхода наружу.

## Контракт качества (ни одна страница не выходит без него)

- **Формулы**: golden-тесты (эталонные значения) + property-тесты
  (инварианты на диапазонах входов) — арифметика не «выглядит верной»,
  а доказана на классах входов.
- **SEO/crawl-контракты**: canonical, метаданные, sitemap, статус-коды —
  проверяются тестами, а не глазами.
- **UI**: responsive + accessibility в трёх браузерах
  (Chromium / Firefox / WebKit, Playwright).
- **Производительность**: детерминированный gzip-бюджет First-Load JS на
  критическом пути; Lighthouse — nightly, 5 прогонов, медиана.
- **Релиз наблюдаем**: текущая версия всегда видна в `/healthz`.

## CI: гейты разрезаны по классам изменений

PR-гейт `production-gate` классифицирует diff (docs / ops / app /
dependencies; неизвестные пути fail-safe запускают всё), выполняет только
релевантные jobs и сводит их в единственный required-контекст `verify`.
Релизный контур на push в `main`: сборка артефакта с download round-trip
(`BUILD_ID` + полный SHA-256 manifest) и трёхбраузерная матрица **по
скачанному артефакту**, а не по рабочей копии — тестируется ровно то, что
поедет в прод.

Известные исключения безопасности документируются с дедлайном
(high/critical блокируют гейт без исключений).

## Локальная проверка

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run check          # полный контур: release + Lighthouse
```

Наборы по уровню: `check:pr` (quality, build, bundle budget, Chromium E2E) ·
`check:ops` (artifact/ops/nginx-регрессии) · `check:release` (полный контур,
3 браузера).

`.env.example` копируется только в локальный ignored `.env.local`;
секреты в репозитории не живут.

## Документация

Архитектура, ADR и статус гейтов: [`docs/README.md`](docs/README.md) ·
[`docs/implementation/status.md`](docs/implementation/status.md).

## Автор

Артур Абдурахманов · [github.com/axor91](https://github.com/axor91) ·
Telegram [@ar4u91](https://t.me/ar4u91)

Разработка AI-assisted (Claude Code + Codex); качество держат тесты и
релизные гейты, а не доверие к генерации.
