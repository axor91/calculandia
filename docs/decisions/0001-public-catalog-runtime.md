# ADR-0001: публичный каталог и runtime

- Статус: **Accepted**
- Дата: 2026-07-15

## Контекст

Baseline хранит каталог и SEO-контент в PostgreSQL, но UI-компоненты и формулы остаются в коде. Отказ БД маскируется как пустой каталог или 404 и может попасть в ISR-кэш. Полноценный editorial workflow отсутствует.

## Решение

Первый production-релиз использует типизированный code-first каталог и структурированный version-controlled контент. Публичные страницы, sitemap и поиск строятся без runtime-БД.

`CalculatorDefinition` содержит slug, category, component id, status, formula version, SEO, content sections, sources, review dates и related links. Объект проходит schema validation во время test/build.

PostgreSQL и Prisma удаляются из публичного runtime первого релиза. Возвращение CMS возможно отдельным ADR после появления auth, RBAC, audit log, preview/publish workflow и устойчивого read model.

## Последствия

- Падение БД не может удалить публичную страницу.
- Формулы и контент проходят один code review и rollback.
- Deploy требуется для публикации контента.
- Массовое редактирование через UI откладывается.
- Git и release artifacts являются источником восстановления публичного сайта; DB backup на первом релизе не требуется.

