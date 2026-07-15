# Calculandia

Платформа русскоязычных онлайн-калькуляторов на Next.js.

## Текущий статус

Baseline `1701533` сохранён как known-broken исходное состояние. В рабочей ветке P0 toolchain уже проходит lint/type/test/build, но существующие формулы ещё не прошли launch correctness gate; production deploy разрешён только после полного release DoD.

Актуальная документация и принятые решения: [`docs/README.md`](docs/README.md).

## Локальная проверка

```bash
npm ci
npm run check
npm run test:coverage
```

`npm run check` выполняет lint, typecheck, unit tests, production dependency gate и production build. Две moderate build-time уязвимости nested PostCSS документированы временным exception; high/critical блокируют gate.

Скопируйте `.env.example` только в локальный ignored `.env.local` и не коммитьте секреты. Публичный launch runtime по ADR-0001 не требует БД.
