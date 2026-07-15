# ADR-0005: телеметрия и пользовательские данные

- Статус: **Accepted**
- Дата: 2026-07-15

## Решение

- Значения калькуляторов обрабатываются в браузере и не отправляются приложению.
- Share-state создаётся только по явному действию пользователя и хранится во fragment URL.
- Нельзя логировать значения полей, полный fragment, cookies или authorization headers.
- Session Replay на launch запрещён.
- Product analytics и рекламные trackers на launch не подключаются; consent UI не показывается без необязательных trackers.
- Разрешена error telemetry с sanitization/masking и минимальным retention, если настроен DSN. Без DSN используются структурированные server logs и uptime checks.
- События будущей продуктовой аналитики передают только имя калькулятора и тип события, но не введённые/полученные числа.

## Минимальные события после отдельного privacy approval

- calculator_started;
- calculation_succeeded;
- validation_failed с кодом поля, но без значения;
- share_clicked;
- related_opened;
- search_zero_result только как агрегированный словарь после отдельного решения о privacy.

