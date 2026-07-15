# ADR-0002: URL, canonical и индексация

- Статус: **Accepted**
- Дата: 2026-07-15

## Решение

- Canonical origin: `https://calculandia.ru`.
- `http` и `www` перенаправляются одним 301 на HTTPS non-www с сохранением path/query.
- Trailing slash отсутствует; дубли нормализуются 308/301 средствами Next/nginx.
- Каталог: `/kalkulyatory`.
- Категория: `/kalkulyatory/{category-slug}`.
- Инструмент: `/kalkulyator/{calculator-slug}`.
- Slug — lowercase ASCII transliteration с дефисами; после публикации неизменяем.
- Share-state хранится только во fragment `#v=1&...`, не отправляется серверу, не попадает в canonical и referrer.
- Поиск первого релиза работает локально на `/kalkulyatory`, не создаёт индексируемый `/search` и parameter pages.
- Draft/admin/preview URL не существуют в production runtime.
- Удалённая никогда не публиковавшаяся страница получает 404. Опубликованный URL удаляется через 410 только после документированного решения; при наличии эквивалента используется 301.
- `lastModified` меняется только при существенном изменении формулы, результата, интерпретации или основного content; косметические правки его не меняют.

## Redirect baseline → release

| Старый URL                 | Новый URL                           | Код |
| -------------------------- | ----------------------------------- | --: |
| `/calculator/percent-diff` | `/kalkulyator/procentnoe-izmenenie` | 301 |
| `/calculator/mortgage`     | `/kalkulyator/ipoteka`              | 301 |
| `/calculator/fractions`    | `/kalkulyator/drobi`                | 301 |
| `/calculator/days`         | `/kalkulyator/dni-mezhdu-datami`    | 301 |
| `/calculator/equations`    | нет production-эквивалента          | 404 |

## Последствия

Категорию можно менять без смены URL инструмента. Состояние расчёта не индексируется и не передаётся серверу. Любое изменение slug требует новой ADR-записи и redirect test.
