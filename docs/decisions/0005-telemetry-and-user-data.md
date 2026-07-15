# ADR-0005: телеметрия и пользовательские данные

- Статус: **Accepted**
- Дата: 2026-07-15

## Решение

- Значения калькуляторов обрабатываются в браузере и не отправляются приложению.
- Share-state создаётся только по явному действию пользователя и хранится во fragment URL.
- Нельзя логировать значения полей, полный fragment, cookies или authorization headers.
- Session Replay на launch запрещён.
- Product analytics и рекламные trackers на launch не подключаются; consent UI не показывается без необязательных trackers.
- На launch ошибки сервера пишутся в структурированные server logs без message/stack/input; browser boundary отправляет на same-origin `POST /api/client-errors` только `source`, безопасный route context и framework digest.
- Endpoint требует `application/json`, точный production Origin и `Sec-Fetch-Site: same-origin`; отклоняет неизвестные поля и тело больше 1 KiB.
- Application limit: 10 принятых событий в минуту на trusted-proxy client address и отдельный global ceiling 300/minute/process. Адрес используется только как SHA-256 rate-limit key и не логируется. Nginx перезаписывает proxy headers и добавляет собственный per-IP limit.
- Внешний error provider/DSN на launch не используется. Его подключение требует отдельного privacy/security review.
- События будущей продуктовой аналитики передают только имя калькулятора и тип события, но не введённые/полученные числа.

## Минимальные события после отдельного privacy approval

- calculator_started;
- calculation_succeeded;
- validation_failed с кодом поля, но без значения;
- share_clicked;
- related_opened;
- search_zero_result только как агрегированный словарь после отдельного решения о privacy.
