# Calculandia

Платформа русскоязычных онлайн-калькуляторов на Next.js.

## Текущий статус

Каталог расширен до 30 калькуляторов в четырёх категориях (manifest v1.1; 41 индексируемый URL); каждая страница проходит единый контракт качества: golden/property-тесты формул, SEO/crawl-контракты, responsive UI и accessibility в трёх браузерах. Release-engineering hardening завершён: PR #1–#3 merged с green remote CI, immutable release `0877ada` активен на loopback, forward/rollback drills и host monitor подтверждены живыми прогонами под holding. Baseline `1701533` сохранён только как known-broken исходное состояние.

Публичное приложение пока намеренно не открыто: `calculandia.ru` отвечает HTTPS holding `503 + noindex`, пока владелец не предоставит проверяемые реквизиты оператора, privacy contact и подтверждение уведомления Роскомнадзора либо применимого исключения. Точный статус и оставшиеся gates находятся в [`docs/implementation/status.md`](docs/implementation/status.md).

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
