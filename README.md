# Calculandia

Платформа русскоязычных онлайн-калькуляторов на Next.js.

## Текущий статус

**Сайт запущен публично** (2026-07-17): `calculandia.ru` отдаёт каталог из 30 калькуляторов в четырёх категориях (manifest v1.1; 41 индексируемый URL). Каждая страница проходит единый контракт качества: golden/property-тесты формул, SEO/crawl-контракты, responsive UI и accessibility в трёх браузерах. Текущий релиз всегда виден в `/healthz`; статус gates — в [`docs/implementation/status.md`](docs/implementation/status.md). Baseline `1701533` сохранён только как known-broken исходное состояние.

Актуальная документация и принятые решения: [`docs/README.md`](docs/README.md).

## Локальная проверка

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run check
```

Локальные наборы: `check:pr` (быстрый гейт уровня PR: quality, build, bundle budget, Chromium E2E), `check:ops` (artifact/ops/nginx-регрессии), `check:release` (полный релизный контур c трёхбраузерной матрицей), `check` (release + Lighthouse).

CI разрезан по классам изменений: PR-гейт `production-gate` классифицирует diff (docs/ops/app/dependencies, неизвестные пути fail-safe запускают всё), выполняет только релевантные jobs и сводит их в единственный required-контекст `verify` (always-running агрегатор). Полный релизный контур — workflow `release` на push в main: артефакт с download round-trip (`BUILD_ID` + полный SHA-256 manifest) и параллельная Chromium/Firefox/WebKit матрица по скачанному exact-артефакту. Lighthouse ушёл в nightly (5 прогонов, медиана); на критическом пути его заменяет детерминированный gzip-бюджет First-Load JS.

Одна moderate build-time уязвимость nested PostCSS документирована временным exception до 15 августа 2026 года; high/critical блокируют gate.

Скопируйте `.env.example` только в локальный ignored `.env.local` и не коммитьте секреты. Публичный launch runtime по ADR-0001 не требует БД.
