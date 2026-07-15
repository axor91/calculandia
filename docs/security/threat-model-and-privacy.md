# Threat model и privacy design

- Статус: **Technical controls approved; legal/operator approval pending**

## 1. Data inventory

| Data                  | Где возникает                 | Куда передаётся                                | Retention                                                                             |
| --------------------- | ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| Значения калькулятора | Browser state                 | Никуда автоматически                           | До закрытия/сброса страницы                                                           |
| Shared calculation    | URL fragment по явному copy   | Получателю ссылки; сервер fragment не получает | Контролирует пользователь/browser history                                             |
| HTTP metadata         | nginx/Next logs               | Server logs                                    | 14 дней initial, без query/fragment values                                            |
| Error event           | Browser/Next error boundary   | Same-origin endpoint → server logs             | 14 дней initial; только source/context/digest, без message/stack/input/query/fragment |
| Contact message       | Launch scope не включает form | —                                              | —                                                                                     |
| Analytics/Replay/Ads  | Отключены                     | —                                              | —                                                                                     |

## 2. Trust boundaries

```text
Untrusted browser input
  → local parser/schema
  → pure calculation
  → escaped React output

Git-reviewed catalog/content
  → build-time validation
  → static HTML/JSON-LD

Internet
  → nginx limits/TLS
  → static/read-only Next routes
  → bounded technical error-event endpoint
```

External data API, CMS and runtime DB отсутствуют в launch boundary. Единственный POST не меняет каталог или пользовательское состояние и служит для ограниченной технической диагностики.

## 3. Assets и угрозы

| Asset                   | Угроза                                                 | Control                                                                                                                        |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Правильность результата | Формульная/округляющая ошибка                          | Golden/property tests, version/review workflow, visible assumptions                                                            |
| Индексируемый контент   | Stored XSS/JSON-LD injection                           | Нет user/admin HTML; typed render; safe JSON serialization                                                                     |
| Доступность             | Expensive input/main-thread DoS                        | Schema limits, submit boundary, schedule row cap, nginx timeouts                                                               |
| Доступность логов       | Cross-site poisoning, quota starvation, oversized body | Same-origin JSON/fetch-metadata gate, stream limit 1 KiB, allowlist, 10/min/client + 300/min global, nginx per-IP limit        |
| Privacy                 | Утечка финансовых значений в logs/analytics/referrer   | Client-only calculation, fragments, no Replay/analytics, log redaction                                                         |
| Supply chain            | Vulnerable dependency/lock tampering                   | Lockfile, CI audit, minimal dependencies, exception expiry                                                                     |
| Deploy                  | Compromised/mutable artifact or forged release ID      | Git-bound BUILD_ID, full SHA-256 manifest, no writable mode bits, root-owned release, dedicated runtime user, symlink rollback |
| TLS/canonical           | MITM/duplicate indexation                              | ACME cert, HTTPS/non-www redirects, automated checks                                                                           |
| Secrets                 | Fallback/committed env                                 | `.env*` ignored except example, env validation, mode 0600                                                                      |

## 4. Abuse cases

- Очень длинные/нечисловые inputs: rejected before calculation.
- 600-месячный schedule: разрешён; >600 rejected.
- URL fragment с crafted content: parser принимает только versioned allowlisted numeric keys/limits; не вставляет HTML.
- Direct admin/content API probes: production routes отсутствуют и возвращают 404; только документированный telemetry POST существует.
- Framing/clickjacking: CSP `frame-ancestors 'none'`.
- Script injection through structured data: trusted definitions + `<` escaping.
- Error report с input state: client формирует новый allowlist object, а сервер отклоняет дополнительные поля; message/stack/query/fragment не принимаются; Replay disabled.
- Cross-site error report: отклоняется до parsing/rate counter; исчерпание одного client bucket не блокирует другой bucket.
- Forged `APP_RELEASE`: health не читает runtime release env и возвращает только immutable `.next/BUILD_ID`.

## 5. Privacy/legal boundary

Документ фиксирует технический data design, но не является юридическим заключением. Перед подключением analytics, ads, contact forms или user accounts требуется отдельная правовая проверка применимых требований, обновление политики и назначение data owner.

На launch необязательных trackers нет, поэтому блокирующий consent banner не нужен.

До Production Gate требуется указать проверяемые данные владельца/оператора, статус и адрес, действующий privacy contact, основания/цели/сроки обработки технических метаданных и порядок реализации прав пользователя. Эти данные нельзя выводить из Git nickname или придумывать. Пока владелец не предоставил их и текст не прошёл legal review, публичный launch блокируется независимо от технической готовности.

Игнорируемый legacy `.env` не входит в artifact и локально ограничен mode `0600`. Содержащиеся в нём старые credentials считаются кандидатами на ротацию; их значения не копируются в документацию или release.

## 6. Security verification

- dependency scan + reachability review;
- streaming secret scan каждого artifact file без size skip + SHA-256 manifest verification;
- CSP/header check production;
- reflected/stored XSS fixtures for fragment/search/content;
- oversized input tests;
- admin/content API route negative tests и telemetry POST origin/media/schema/size/per-client isolation tests;
- read-only mode/ownership checks и negative write probe от runtime user;
- TLS scan and redirect matrix;
- log inspection confirms absence of calculation values;
- review gate перед production.
