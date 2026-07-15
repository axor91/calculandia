# Threat model и privacy design

- Статус: **Approved for launch scope**

## 1. Data inventory

| Data | Где возникает | Куда передаётся | Retention |
|---|---|---|---|
| Значения калькулятора | Browser state | Никуда автоматически | До закрытия/сброса страницы |
| Shared calculation | URL fragment по явному copy | Получателю ссылки; сервер fragment не получает | Контролирует пользователь/browser history |
| HTTP metadata | nginx/Next logs | Server logs | 14 дней initial, без query/fragment values |
| Error event | Browser/server при optional DSN | Error provider | Минимальный provider retention; без input values |
| Contact message | Launch scope не включает form | — | — |
| Analytics/Replay/Ads | Отключены | — | — |

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
  → read-only Next runtime
```

External data API, CMS and runtime DB отсутствуют в launch boundary.

## 3. Assets и угрозы

| Asset | Угроза | Control |
|---|---|---|
| Правильность результата | Формульная/округляющая ошибка | Golden/property tests, version/review workflow, visible assumptions |
| Индексируемый контент | Stored XSS/JSON-LD injection | Нет user/admin HTML; typed render; safe JSON serialization |
| Доступность | Expensive input/main-thread DoS | Schema limits, submit boundary, schedule row cap, nginx timeouts |
| Privacy | Утечка финансовых значений в logs/analytics/referrer | Client-only calculation, fragments, no Replay/analytics, log redaction |
| Supply chain | Vulnerable dependency/lock tampering | Lockfile, CI audit, minimal dependencies, exception expiry |
| Deploy | Compromised artifact/wrong release | SHA-named immutable releases, gates, symlink rollback |
| TLS/canonical | MITM/duplicate indexation | ACME cert, HTTPS/non-www redirects, automated checks |
| Secrets | Fallback/committed env | `.env*` ignored except example, env validation, mode 0600 |

## 4. Abuse cases

- Очень длинные/нечисловые inputs: rejected before calculation.
- 600-месячный schedule: разрешён; >600 rejected.
- URL fragment с crafted content: parser принимает только versioned allowlisted numeric keys/limits; не вставляет HTML.
- Direct admin/API probes: production routes отсутствуют и возвращают 404.
- Framing/clickjacking: CSP `frame-ancestors 'none'`.
- Script injection through structured data: trusted definitions + `<` escaping.
- Error report с input state: beforeSend sanitizer удаляет form values, URL fragment и sensitive breadcrumbs; Replay disabled.

## 5. Privacy/legal boundary

Документ фиксирует технический data design, но не является юридическим заключением. Перед подключением analytics, ads, contact forms или user accounts требуется отдельная правовая проверка применимых требований, обновление политики и назначение data owner.

На launch необязательных trackers нет, поэтому блокирующий consent banner не нужен.

## 6. Security verification

- dependency scan + reachability review;
- secret scan repository/artifact;
- CSP/header check production;
- reflected/stored XSS fixtures for fragment/search/content;
- oversized input tests;
- admin/API route negative tests;
- TLS scan and redirect matrix;
- log inspection confirms absence of calculation values;
- review gate перед production.

