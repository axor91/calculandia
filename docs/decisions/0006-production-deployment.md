# ADR-0006: production deployment

- Статус: **Accepted**
- Дата: 2026-07-15

## Проверенный контур

- Server: `5.188.28.98`, Ubuntu/Linux, nginx/FastPanel.
- Доступен SSH alias `kappers-prod` с root-доступом.
- Глобальный Node на сервере: `v20.20.2`; он не подходит как поддерживаемый runtime launch и используется другими приложениями.
- PM2 используется для существующих Node-приложений.
- Порт `3212` на момент проверки свободен.
- Конфигурации nginx управляются через `/etc/nginx/fastpanel2-available` и `/etc/nginx/fastpanel2-sites`.
- `calculandia.ru` ещё не имеет site config и попадает на parking/default page.

## Решение

- Runtime/build: одинаковый поддерживаемый Node `22.22.2`, установленный side-by-side в `/opt/nodejs/node-v22.22.2-linux-x64`; глобальный Node 20 и существующие PM2-приложения не изменяются.
- Bind: `127.0.0.1:3212`; отдельный system user `calculandia` запускает PM2/standalone с явным Node 22 interpreter path и собственным `PM2_HOME`.
- Process manager: PM2, один непривилегированный процесс на launch; cluster только после измерения.
- Releases: `/var/www/calculandia/releases/{git-sha}`.
- Active symlink: `/var/www/calculandia/current`.
- Release ownership: `root:root`; directories `0555`, files `0444`; runtime user не может изменить release или `current`.
- Artifact identity: `.next/BUILD_ID` равен clean Git SHA, `ARTIFACT.sha256` покрывает каждый файл; runtime env не задаёт version.
- Reverse proxy/TLS: nginx/FastPanel, canonical host `calculandia.ru`, Let's Encrypt/ACME certificate.
- Deployment: build/test локально и/или в CI, full-file streaming secret scan, manifest verification, transfer immutable standalone artifact, negative write probe от runtime user, healthcheck, atomic symlink switch, PM2 reload.
- Rollback: switch symlink to previous healthy artifact and reload PM2.
- Database migration step отсутствует, потому что launch runtime не использует БД.

Подробности и команды: [`../operations/production-design.md`](../operations/production-design.md).
