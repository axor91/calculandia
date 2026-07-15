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
- Bind: `127.0.0.1:3212`; PM2 запускает standalone server с явным Node 22 interpreter path.
- Process manager: PM2, один процесс на launch; cluster только после измерения.
- Releases: `/var/www/calculandia/releases/{git-sha}`.
- Active symlink: `/var/www/calculandia/current`.
- Shared secrets: `/var/www/calculandia/shared/.env.production.local`, mode `0600`.
- Reverse proxy/TLS: nginx/FastPanel, canonical host `calculandia.ru`, Let's Encrypt/ACME certificate.
- Deployment: build/test локально и/или в CI, transfer immutable standalone artifact, healthcheck, atomic symlink switch, PM2 reload.
- Rollback: switch symlink to previous healthy artifact and reload PM2.
- Database migration step отсутствует, потому что launch runtime не использует БД.

Подробности и команды: [`../operations/production-design.md`](../operations/production-design.md).
