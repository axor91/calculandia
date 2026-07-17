# Public launch evidence — 2026-07-17

- Решение: публичный запуск по прямому указанию владельца (documented risk acceptance, [privacy checklist §6](../legal/production-privacy-checklist.md)); юридические поля оператора не заполнены и остаются открытым пунктом.
- Публикуемый релиз: `f4762df17ce2655cd624ba097e3a0b3d86a2f80d` (каталог Wave 2, 30 калькуляторов, 41 URL).

## Хронология попыток publish (все fail-closed сработали штатно)

1. **Попытка 1 — авто-откат**: первый запрос smoke попал в nginx-worker, ещё дообслуживающий holding-конфиг после graceful reload (503 на t=100 мс, 200 на t=200 мс — доказано пробником). Fix: bounded-ожидание внешней активации конфига перед smoke (PR #7).
2. **Попытка 2 — авто-откат**: `/host-healthz` → 403, nginx (www-data) не имел прохода в `/var/lib/calculandia` (0750 calculandia:calculandia). Fix: marker вынесен в выделенный `/var/lib/calculandia-monitor` root:www-data (PR #8).
3. **Попытка 3 — успех**: полный external smoke пройден (host/runtime health, 41 sitemap URL, redirects, TLS, headers, schema, assets, sources, 404), `Published and externally verified production release f4762df…`.

## Публичная верификация

- Главная/калькуляторы/категории — `200`, `/healthz` отдаёт exact SHA, sitemap 41 `<loc>`, robots `Allow: /` (служебные endpoint'ы закрыты), несуществующий URL — `404`.
- Remote monitor включён: failure simulation → красный run (канал алертов доказан), боевой прогон → success; расписание каждые 30 минут; переменные `PRODUCTION_RELEASE_SHA` и `PRODUCTION_PM2_RESTART_BASELINE=5` установлены.
- Локальный host-check — 5-минутный таймер, marker exact-SHA.
- Мгновенный откат доступен: три предыдущих guard-verified релиза на сервере (`0877ada`, `0ab55a6`, `bdd7c4c`).
