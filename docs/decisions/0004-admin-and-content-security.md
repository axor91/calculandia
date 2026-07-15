# ADR-0004: админка и безопасность контента

- Статус: **Accepted**
- Дата: 2026-07-15

## Решение

Admin UI, login, content-management write API, произвольный HTML, рекламный script-код и поле arbitrary JSON-LD не входят в первый production bundle. Технический `POST /api/client-errors` не управляет контентом: он принимает только жёстко ограниченное allowlist-событие без текста ошибки и пользовательских значений согласно ADR-0005.

Контент хранится в типизированных структурах и выводится React-компонентами без `dangerouslySetInnerHTML`. Structured data генерируется только доверенным кодом из validated definitions и сериализуется с безопасным экранированием.

Реклама на launch выключена. Её включение требует отдельной security/privacy/performance проверки и не может размещать slot до первого результата.

## Последствия

- Нет default credentials и административного attack surface.
- Не требуется HTML sanitizer в production path.
- Content changes проходят Git review и deploy.
- CMS возвращается только после отдельного threat model и ADR.
