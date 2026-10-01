# Автодеплой через GitLab

С 01.10.2026 основной Git/CI — [goghtools-group/calculandia](https://gitlab.com/goghtools-group/calculandia).
Проект приватный в действующей группе; публичный GitHub остаётся резервным снимком
инженерной витрины, без Actions и автоматического зеркалирования. Архив прежнего
процесса: [GitHub deploy](../archive/github-auto-deploy.md).

## CI и выпуск

MR и push в защищённый `main` проходят полный набор проверок в `.gitlab-ci.yml`:

1. `quality`: format/lint/typecheck, Vitest coverage, artifact/ops/nginx contracts,
   production dependency audit, docs links и тесты GitLab receiver.
2. `artifact`: единственная Next standalone сборка, smoke, bundle budget,
   clean Git SHA/BUILD_ID, полный manifest и read-only artifact; проверка публичных
   файлов, упаковка вместе с метаданными job/pipeline/SHA и SHA256 архива.
3. `e2e`: скачивает тот же архив из artifacts, повторяет полный manifest/BUILD_ID
   verification, запускает Chromium, Firefox и WebKit. Штатные skips в browser
   tests сохраняются; результат каждого браузера виден в JUnit.
4. `deploy-production`: только protected push main после всех проверок; получает
   protected file variables лишь в environment `production`, передаёт JSON по SSH
   stdin и независимо проверяет публичные health/version/host freshness и HTTP200.

Все jobs на own runner56948440, tag `calculandia-check`, 2CPU/6GiB, без privileged
и Docker socket; shared runners/AutoDevOps выключены, общий concurrent=2.
Node22.22.2/npm10.9.7 одинаковы с прежним CI. Для browser/Lighthouse jobs явно
заданы HOSTNAME=127.0.0.1 и PORT=3212: Docker HOSTNAME иначе уводит standalone
server с loopback. GitLab Free не требует покупки минут.
Merge только FF и при успешном pipeline. MR теперь проверяется целиком, а не
сокращённо по классификации diff. Classification utility оставлен для локальной работы.

Ночной schedule main: `23 2 * * *`, UTC. Два независимых jobs: `nightly-audit`
и `nightly-performance` (Lighthouse, прежние пороги, 5 прогонов, медиана).
Web pipeline запускает тот же nightly набор, без deploy. Artifacts: release и
JUnit/coverage14дней, Lighthouse30дней, deploy receipt90дней. Старый remote uptime
monitor не восстанавливается: его отключение владельцем остаётся в силе.

## Production

SSH alias `kappers-prod`, фактический адрес5.188.30.214; опубликованные старые
203.0.113.10 — placeholder. Native Node/PM2, без сборки и runtime-БД на сервере.
Immutable `/var/www/calculandia/releases/<sha>` и symlink `current` сохраняются.

Новый root-owned receiver `.ci/receiver.py` установлен как
`/usr/local/sbin/calculandia-gitlab-deploy` с mode0700; ключ в authorized_keys
имеет `restrict,command="/usr/local/sbin/calculandia-gitlab-deploy"`.
Принимается только `gitlab-release` и строго типизированный JSON; arbitrary shell,
status/rollback через CI key, чужой job/project, MR/web pipeline и stale main отвергаются.

Receiver проверяет running GitLab job через `/api/v4/job`, текущий main через
read_repository token, метаданные artifact job того же pipeline/SHA, собственный
SHA256 и SHA256/size архива. Загрузка не пересылает job token на внешний CDN.
Распаковка ограничена200MiB gzip/1GiB total/40000entries/256MiB per file;
links, devices, traversal, CR/LF names и env files запрещены.

Один прежний `/run/lock/calculandia-release.lock` охватывает весь выпуск:
immutable installation → существующий `calculandia-verify-release` →
`calculandia-activate` (candidate3213, exact health, atomic symlink, clean-env PM2,
встроенный rollback) → `calculandia-publish` (nginx reload, external smoke41URL,
fail-closed holding) → свежий host-check. Эти серверные guards сверены с исходным
кодом и не заменены переносом. Приложение слушает3212 только на loopback.

В новом transport нет автоматического удаления старых releases: предыдущие
артефакты сохраняются для отката. Контроль места выполняет host-check; перед
ручной очисткой проверить current и сохранить предыдущий рабочий SHA.

## Credentials и обновление receiver

`PROD_DEPLOY_KEY` и `PROD_SSH_KNOWN_HOSTS`: protected file variables с environment
scope `production`. Host keys прочитаны через административный SSH.
`/root/.local/share/calculandia-gitlab` (0700) хранит read_repository credential
(0600, token до01.10.2027), backup authorized_keys и sanitised receipts/private log.
Token не даёт write/API прав; artifact скачивается краткоживущим CI_JOB_TOKEN.
Старый GitHub deploy key отзывается после успешного GitLab выпуска; legacy gate
и GitHub token не используются новой цепочкой, остаются только для истории/аварийного
доступа администратора. Повторять прежний GitHub provisioning не нужно.

Receiver не обновляет себя из artifacts. После изменения `.ci/receiver.py`
установить проверенную копию через admin SSH и проверить hash/negative probes
перед merge: несовпадение с metadata останавливает deploy до изменения `current`.

## Восстановление

При ошибке смотреть root-only receipt и last-command.log. Не публиковать tokens,
полные process env и private logs. Неверный artifact не активируется. Ошибки
активации восстанавливают previous через существующий script; ошибка publish
возвращает holding. После устранения причины можно повторить job при том же main.

Ручной rollback через административный SSH:

```bash
ssh kappers-prod
calculandia-verify-release <previous-sha>
calculandia-rollback <previous-sha>
calculandia-publish <previous-sha>
```

Проверить `/healthz`, `/host-healthz` и внешний smoke. Сборка на production,
подмена BUILD_ID или принудительное ослабление audit/manifest не допускаются.
Подробности транзакции: [production-design.md](production-design.md).
