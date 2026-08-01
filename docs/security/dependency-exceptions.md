# Dependency security exceptions

Гейт `npm run audit:prod` — `scripts/audit-prod.mjs`: запускает `npm audit --omit=dev --json` и падает на **любом** high/critical в production-дереве, кроме advisory, явно внесённых в `ALLOWLIST` скрипта. У каждой записи есть `expires`; после этой даты гейт красный независимо от находок, поэтому исключение нельзя продлить молча. Негативное поведение проверено вручную (пустой allowlist → exit 1 с перечислением).

## DEP-2026-001 — Next.js nested PostCSS

- Status: **Temporary accepted**
- Opened: 2026-07-15
- Renewed: 2026-08-01 (severity поднялась до high, добавлены два новых advisory)
- Owner: platform engineering
- Expiry: 2026-10-01
- Advisories: `GHSA-qx2v-qp2m-jg93`, `GHSA-6g55-p6wh-862q`, `GHSA-r28c-9q8g-f849`
- Severity: high
- Path: `next@15.5.22 → postcss@8.4.31` (bundled внутрь тарбола `next`)

### Reachability

Advisory относятся к CSS stringify с неэкранированным `</style>` и к автозагрузке source map по `sourceMappingURL` из CSS-комментариев. В Calculandia PostCSS исполняется во время trusted build над version-controlled CSS. Production runtime не принимает CSS, HTML или style content от пользователя, не имеет CMS/write API и не вызывает PostCSS из request path. Собственный top-level `postcss` — 8.5.19 (уже исправленный); уязвим только экземпляр внутри `next`.

### Compensating controls

- arbitrary HTML/CSS/admin удалены;
- immutable CI/release artifact;
- CSP и React escaping;
- no runtime PostCSS calls;
- `audit:prod` блокирует любой high/critical вне этого списка, allowlist истекает по дате;
- advisory пересматривается при каждом Next.js patch.

### Why not force override

`next` поставляет PostCSS внутри своего тарбола, поэтому npm `overrides` к нему не применяется: после `overrides.next.postcss = 8.5.19` и переустановки дерево остаётся на `postcss@8.4.31` со статусом `invalid ... overridden`. Проверено 2026-08-01 на `next@15.5.22`. `npm audit fix --force` ошибочно предлагает downgrade Next.js до 9.3.3 и не применяется.

### Closure condition

- официальный Next.js patch обновляет nested PostCSS до исправленной версии; либо
- проект переходит на поддержанную Next major/minor, прошедшую полный regression gate; либо
- reachability меняется — тогда exception немедленно отзывается и launch блокируется.

## DEP-2026-002 — sharp/libvips (закрыто override'ом)

- Status: **Closed 2026-08-01**
- Advisory: `GHSA-f88m-g3jw-g9cj` (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591), severity high
- Path: `next@15.5.22 → sharp@0.34.4`

`sharp` — optional-зависимость Next для image optimization; `next/image` в проекте не используется, но пакет присутствовал в production-дереве. Закрыто `overrides.sharp = "0.35.3"` (override применяется, дерево переустановлено и проверено `npm ls sharp`), без downgrade Next. При появлении поддержанного `sharp` в самом Next override снимается.
