# Статус реализации

Обновлено: 2026-07-16.

| Gate                      | Статус                                 | Evidence                                                                                                                                                                                                                                      |
| ------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline                  | Complete                               | `170153337ef3507907e1d91c504b45374e0c03ef`                                                                                                                                                                                                    |
| Documentation Gate A      | **Approved**                           | Product/SEO/UX review APPROVED; documentation review APPROVED после трёх проходов                                                                                                                                                             |
| P0 Platform Gate B        | **Approved**                           | technical/quality/security APPROVED after four review passes; 72 tests; Git-bound manifest/read-only artifact; sanitized telemetry; 0 high/critical audit                                                                                     |
| Foundation Gate C         | **Approved**                           | typed registry; 25 canonical URLs; responsive design system; metadata/schema/crawl/axe/browser review                                                                                                                                         |
| Calculator Catalog Gate D | **Approved (14) + Wave 2 implemented** | manifest v1.1 поднял cut-line до 30; 16 новых калькуляторов реализованы по полному контракту (движки/контент/тесты; 845 unit, 123 E2E passed / 6 intentional skips в 3 браузерах)                                                             |
| Release Candidate Gate E  | **Approved (release engineering)**     | hardening PR #1 merged (`0877ada`), remote CI green, artifact round-trip proven independently; live install/forward/rollback drills под holding выполнены; host monitor исправлен (PR #2 `84b3910`, PR #3 `7273832`) и живёт на 5-мин таймере |
| Production Gate F         | **Blocked**                            | valid-TLS holding and rollback drill ready; public proxy/monitor activation wait for operator identity/privacy/notification approval                                                                                                          |

## External state

- Git remote: private `github.com/axor91/calculandia`; `main` protected, required `verify` applies to admins, Actions require full-SHA pinning. Цепочка merged main: `0877ada` (hardening, PR #1) → `84b3910` (monitor RestrictSUIDSGID, PR #2) → `7273832` (monitor User=/CAP_SETUID, PR #3) — все с green required CI; артефакты обоих релизных SHA независимо скачаны и сверены (BUILD_ID + полный SHA-256 manifest).
- SSH production access: подтверждён через alias `kappers-prod`.
- Production runtime: Node `22.22.2`, отдельный user/systemd/PM2 c clean environment (SSH-переменные удалены одноразовой перерегистрацией), immutable release `f4762df` (Wave 2, 30 калькуляторов) активен только на `127.0.0.1:3212`; boot recovery проверен.
- TLS: действующий Let's Encrypt для apex/www, simulated renewal green; deploy-hook реально выполняет `nginx -t` + reload.
- Public vhost: holding `503 + noindex + Retry-After`; parking `200` устранён, приложение наружу не proxy; активный конфиг байт-в-байт равен holding-шаблону.
- Rollback/forward drill новым комплектом скриптов: `0877ada → 0ab55a6 → 0877ada`, 2.95 s / 7.20 s, exact symlink/BUILD_ID/health identity confirmed.
- Host monitor: `calculandia-host-check.timer` каждые 5 минут; после двух исправлений (`RestrictSUIDSGID` и явный `User=` + `NoNewPrivileges` + seccomp → потеря CAP_SETUID в systemd 255) подтверждены 4 последовательных таймерных цикла healthy; marker exact-SHA, `pm2Restarts=2` = launch baseline. Диск 90% — warning-зона (критический порог 92%), нужна плановая чистка.
- Lighthouse TBT-флейк на CI закрыт причинно: dynamic-чанки разрезаны с категорийных на per-калькуляторные, страница гидрирует только собственный компонент.
- GitHub `main`: protected; required `verify`, `enforce_admins=true`, strict linear history, force-push/deletion disabled; Actions `sha_pinning_required=true`.
- Юридический владелец/оператор и privacy contact не предоставлены; без этих данных Production Gate не утверждается.

## Текущая разрешённая работа

1. Получить точные данные оператора и подтверждение уведомления/исключения; завершить публичную privacy-страницу.
2. Собрать и развернуть финальный policy/ops commit, прошедший remote CI.
3. Переключить holding на production proxy и выполнить external smoke.
4. Включить exact-SHA monitor и подтвердить simulated alert/success.
