# Dependency security exceptions

## DEP-2026-001 — Next.js nested PostCSS

- Status: **Temporary accepted**
- Opened: 2026-07-15
- Owner: platform engineering
- Expiry: 2026-08-15
- Advisory: `GHSA-qx2v-qp2m-jg93`
- Severity: moderate
- Path: `next@15.5.20 → postcss@8.4.31`

### Reachability

Advisory относится к CSS stringify с неэкранированным `</style>`. В Calculandia PostCSS исполняется во время trusted build над version-controlled CSS. Production runtime не принимает CSS, HTML или style content от пользователя, не имеет CMS/write API и не вызывает PostCSS из request path.

### Compensating controls

- arbitrary HTML/CSS/admin удалены;
- immutable CI/release artifact;
- CSP и React escaping;
- no runtime PostCSS calls;
- `npm audit --audit-level=high` блокирует high/critical;
- advisory пересматривается при каждом Next.js patch.

### Why not force override

Next.js 15.5.20 явно pin-ит внутренний PostCSS. Принудительная подмена transitive package вне поддержанной комбинации может нарушить compiler/build semantics. `npm audit fix --force` ошибочно предлагает downgrade Next.js до 9.3.3 и не применяется.

### Closure condition

- официальный Next.js patch обновляет nested PostCSS до исправленной версии; либо
- проект переходит на поддержанную Next major/minor, прошедшую полный regression gate; либо
- reachability меняется — тогда exception немедленно отзывается и launch блокируется.
