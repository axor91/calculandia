# Calculandia

Платформа русскоязычных онлайн-калькуляторов на Next.js.

## Текущий статус

Baseline `1701533` сохранён как known-broken исходное состояние. Проект проходит подготовку к первому production-релизу; текущий `master` нельзя разворачивать до закрытия release gates.

Актуальная документация и принятые решения: [`docs/README.md`](docs/README.md).

## Локальный baseline

```bash
npm ci
npm test
npx tsc --noEmit
npm run lint
npm run build
```

В baseline часть команд намеренно завершается ошибкой; точные результаты находятся в production readiness audit. README будет обновляться вместе с toolchain и production runbook.

Не копируйте `.env` в репозиторий. Публичный launch runtime по ADR-0001 не требует БД.

