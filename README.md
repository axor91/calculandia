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

`npm run check` выполняет lint, typecheck, coverage, artifact/ops regressions, production dependency gate, build, standalone smoke, Chromium/Firefox/WebKit E2E и Lighthouse. CI дополнительно проверяет реальные nginx templates, требует clean Git-bound release artifact, загружает его с вложенным `.next`, скачивает обратно и сверяет `BUILD_ID` и полный SHA-256 manifest.

Одна moderate build-time уязвимость nested PostCSS документирована временным exception до 15 августа 2026 года; high/critical блокируют gate.

Скопируйте `.env.example` только в локальный ignored `.env.local` и не коммитьте секреты. Публичный launch runtime по ADR-0001 не требует БД.
