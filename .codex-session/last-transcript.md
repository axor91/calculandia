# Codex session `019f6eac-2b2b-7a90-ba23-79da8babc48a` (turn 1)

**Usage:** 3 303 658 in (3 108 608 cached, 94%) + 31 492 out = 3 335 150 total
**Duration:** 963s

## Actions

### Shell

```
$ /bin/bash -lc "pwd && rg --files -g 'AGENTS.md' -g '.github/workflows/ci.yml' -g '.github/workflows/production-monitor.yml' -g 'ops/deploy/*.sh' -g 'ops/nginx/**' -g 'ops/systemd/**' -g 'scripts/test-*.mjs' -g 'package.json' -g 'docs/operations/production-design.md' | sort && git status --short && git log -5 --oneline --decorate"
$ /bin/bash -lc 'nl -ba .github/workflows/ci.yml'
$ /bin/bash -lc "rg --hidden --files -g 'AGENTS.md' -g '.github/workflows/ci.yml' -g '.github/workflows/production-monitor.yml' -g 'ops/deploy/*.sh' -g 'ops/nginx/**' -g 'ops/systemd/**' -g 'scripts/test-*.mjs' -g 'package.json' -g 'docs/operations/production-design.md' | sort | xargs -r wc -l"
$ /bin/bash -lc 'nl -ba package.json'
$ /bin/bash -lc 'nl -ba .github/workflows/production-monitor.yml'
$ /bin/bash -lc 'nl -ba docs/operations/production-design.md'
$ /bin/bash -lc 'nl -ba ops/deploy/activate-release.sh'
$ /bin/bash -lc 'for f in ops/nginx/*; do nl -ba "$f"; done'
$ /bin/bash -lc 'nl -ba ops/deploy/publish-release.sh && nl -ba ops/deploy/rollback-release.sh'
$ /bin/bash -lc 'nl -ba ops/deploy/verify-release.sh'
$ /bin/bash -lc 'for f in ops/systemd/*; do nl -ba "$f"; done'
$ /bin/bash -lc 'nl -ba ops/deploy/external-smoke.sh'
$ /bin/bash -lc 'nl -ba scripts/test-nginx-config.mjs'
$ /bin/bash -lc 'nl -ba scripts/test-artifact-tools.mjs'
$ /bin/bash -lc 'nl -ba scripts/test-ops-tools.mjs'
$ /bin/bash -lc 'git log --oneline --decorate --all -- .github/workflows/ci.yml .github/workflows/production-monitor.yml ops/deploy docs/operations/production-design.md | head -80'
$ /bin/bash -lc "rg --files scripts ops | sort && rg -n \"(ARTIFACT|secret|BUILD_ID|standalone|release|deploy|rsync|gh run|ssh|forced|sitemap)\" scripts ops/deploy docs/operations --glob '"'!*.md'"' --glob '"'!test-*.mjs'"'"
$ /bin/bash -lc "rg --hidden -n \"(playwright|lighthouse|lhci|projects:|retries:|fullyParallel|collect:|assert:)\" --glob '"'!node_modules/**'"' --glob '"'!package-lock.json'"' ."
$ /bin/bash -lc 'git diff --stat origin/main...HEAD && git diff origin/main...HEAD -- .lighthouserc.json docs/operations/production-design.md ops .github package.json scripts'
$ /bin/bash -lc 'nl -ba scripts/verify-release-ready.mjs && nl -ba scripts/verify-uploaded-artifact.mjs && nl -ba scripts/verify-standalone.mjs && nl -ba scripts/artifact-integrity.mjs'
$ /bin/bash -lc 'nl -ba .lighthouserc.json && git show origin/main:.lighthouserc.json | nl -ba'
$ /bin/bash -lc 'nl -ba playwright.config.ts && rg -n "''^'"\\s*(test|test\\.describe|test\\.skip|test\\.fixme)\\(\" tests/e2e --glob '*.ts' | wc -l && rg -n \""'^'"\\s*(test|test\\.describe|test\\.skip|test\\.fixme)\\(\" tests/e2e --glob '*.ts'"
$ /bin/bash -lc 'gh api repos/axor91/calculandia/branches/main/protection'
$ /bin/bash -lc 'gh run list --workflow ci.yml --limit 15 --json databaseId,displayTitle,event,headBranch,headSha,status,conclusion,createdAt,startedAt,updatedAt,url'
$ /bin/bash -lc 'for id in 29558065635 29557657614 29556012858 29558177758; do
  gh api "repos/axor91/calculandia/actions/runs/$id/jobs?per_page=100" --jq '"'.jobs[] | [\"RUN \" + (.run_url|split(\"/\")|last) + \" JOB \" + .name + \" \" + .conclusion, (.steps[] | [.number,.name,.conclusion,.started_at,.completed_at] | @tsv)] | .[]'
done
gh run view 29558177758 --log-failed"
$ /bin/bash -lc 'npx playwright test --list'
$ /bin/bash -lc "nl -ba tests/e2e/production.spec.ts | sed -n '1,340p'"
$ /bin/bash -lc 'nl -ba ops/monitor/calculandia-host-check.sh && nl -ba ops/pm2/ecosystem.config.cjs && nl -ba ops/logrotate/calculandia'
$ /bin/bash -lc 'rg --hidden --files .github docs | sort && if [ -f .github/pull_request_template.md ]; then nl -ba .github/pull_request_template.md; fi && if [ -f CODEOWNERS ]; then nl -ba CODEOWNERS; fi && if [ -f .github/CODEOWNERS ]; then nl -ba .github/CODEOWNERS; fi'
$ /bin/bash -lc "rg -n \"aggregationMethod|numberOfRuns|median|minim\" node_modules/@lhci node_modules/lighthouse --glob '*.js' --glob '*.ts' | head -120"
$ /bin/bash -lc 'gh api repos/axor91/calculandia/actions/permissions && gh api repos/axor91/calculandia/actions/permissions/workflow && gh api repos/axor91/calculandia/environments'
```

### Web search
- site:docs.github.com actions required status checks path filtering workflow skipped pending required check ...

### Web search
- site:docs.github.com "If a workflow is skipped due to path filtering" Pending pull request required check ...

### Web search
- site:man.openbsd.org sshd authorized_keys command restrict SSH_ORIGINAL_COMMAND ...

### Web search
- https://man.openbsd.org/sshd#AUTHORIZED_KEYS_FILE_FORMAT

### Web search
- 'command="command"'

### Web search
- https://www.freedesktop.org/software/systemd/man/255/systemd.resource-control.html

### Web search
- site:freedesktop.org/software/systemd/man/255 "MemoryMax=" "CPUQuota=" ...

### Shell

```
$ /bin/bash -lc 'gh run view 29558629989 --json status,conclusion,updatedAt,url,jobs && gh run view 29558629989 --log-failed || true'
$ /bin/bash -lc "gh api user --jq '{login, plan: .plan.name}' && gh api repos/axor91/calculandia --jq '{private,visibility,default_branch,allow_auto_merge,delete_branch_on_merge,organization:.organization.login,owner:.owner.login}' && gh api repos/axor91/calculandia/rulesets"
```

### Web search
- site:docs.github.com actions workflow_run completed conclusion security untrusted code secrets write tokens artifacts ...

### Web search
- site:docs.github.com/en/actions/reference/events-that-trigger-workflows workflow_run untrusted code secrets write tokens ...

### Shell

```
$ /bin/bash -lc "find . -maxdepth 2 -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './.next/*' -not -path './.codex-session/*' | LC_ALL=C sort"
$ /bin/bash -lc "node -p \"require('./package-lock.json').packages['node_modules/@playwright/test'].version\" && node -p \"require('./package-lock.json').packages['node_modules/playwright-core'].version\" && git ls-files .env .env.local .lighthouseci coverage tsconfig.tsbuildinfo prisma/calculandia.db"
$ /bin/bash -lc "gh api repos/axor91/calculandia --jq '.security_and_analysis' && gh api repos/axor91/calculandia/dependency-graph/sbom --silent >/dev/null; printf 'sbom_status=%s\\n' \""'$?"'
```

### Web search
- site:docs.github.com REST actions variables update repository variable GITHUB_TOKEN permissions actions write ...

### Web search
- site:docs.github.com actions schedule delayed high loads start of every hour cron

### Web search
- site:docs.github.com pull_request GITHUB_SHA merge commit last merge commit pull request branch

### Shell

```
$ /bin/bash -lc 'rg -n "gh run download|rsync|activate-release|publish-release|rollback-release|/usr/local/sbin|kappers-prod|PRODUCTION_RELEASE_SHA|PRODUCTION_PM2_RESTART_BASELINE" docs ops .github README.md Запуск.txt'
$ /bin/bash -lc 'git status --short && git diff --check'
```

## Answer

Проведу ревизию только чтением: сначала восстановлю фактический граф CI/deploy по указанным файлам и версиям зависимостей, затем сверю спорные механизмы GitHub Actions, Next.js, PM2/nginx/systemd с первичными источниками. После этого дам целевую схему и оценки критического пути до продакшена; файлов менять не буду.
Первый вывод по репозиторию: сейчас один required job действительно одновременно является PR-гейтом, сборщиком release-артефакта и его round-trip проверкой — то есть критический путь искусственно равен самому тяжёлому сценарию. Отдельно замечаю рассинхронизацию runbook с фактом прод-релиза (статус всё ещё описывает holding/prelaunch, а smoke — 25 URL); это важно для предлагаемого docs-gate, но не меняю файлы. Сейчас дочитываю транзакционные границы скриптов, чтобы автоматизация SSH не расширила полномочия на общем сервере.
Замеры последних успешных GitHub-run дают ясный профиль: из 10:30 критического пути около 1:29 ушло на установку трёх браузеров, 4:44 — на 129 E2E, 1:49 — на Lighthouse; build занял 57 секунд, а все ops/artifact regression-тесты вместе — меньше секунды. Значит, ускорение надо брать не ослаблением guard/manifest проверок, а устранением двойного прогона и перестройкой браузерных/performance-проверок. Проверяю теперь ограничения shared host и официальный semantics required checks/path filters.
Ключевой риск автодеплоя оказался не в PM2: он уже изолирован отдельными user/`PM2_HOME`/systemd unit. Риск — в control plane. Сейчас `activate` и `publish` берут `flock` раздельно, а тесты ops проверяют в основном guard-негативы и синтаксис, но не транзакцию activate→publish и не failure injection. Для безопасного auto-deploy нужен один серверный orchestrator с одним lock на весь цикл и стабильный forced-command wrapper, который сам не обновляется вместе с приложением. Это войдёт в P0/P1 рекомендаций.
## Итог

Цель ≤10 минут реалистична без удаления fail-closed свойств. Целевая длительность для обычного code fix — примерно 7–9 минут от push в PR до подтверждённого production; для ops-only фикса — 3–5 минут; docs-only не должен запускать deploy вообще.

Главная проблема — не медленные проверки сами по себе, а их последовательное выполнение дважды: на PR и затем на `main`. В успешном [run 29558065635](https://github.com/axor91/calculandia/actions/runs/29558065635) из 10:30:

| Участок | Время |
|---|---:|
| Установка 3 браузеров | 1:29 |
| 129 Playwright E2E | 4:44 |
| Lighthouse | 1:49 |
| Build | 0:57 |
| Все artifact/ops/nginx regression-тесты | около 4 сек |
| Artifact upload/download/verify | 0:13 |

То есть guard, manifest и ops-регрессии выкидывать бессмысленно: они почти бесплатны. Убирать с критического пути нужно Lighthouse, дублирование release-артефакта на PR и последовательный трёхбраузерный прогон.

## Целевая схема

| Стадия | Когда | Обязательность | Содержание | Бюджет |
|---|---|---|---|---:|
| `classify` | каждый PR | часть required gate | Безопасная классификация `docs / ops / app / dependencies`; неизвестный путь → полный app pipeline | 5–15 сек |
| `docs-contract` | каждый PR | required | Форматирование изменённых docs, внутренние ссылки, декларация docs impact | 20–45 сек |
| `quality` | app/dependency PR | required | format, lint, typecheck, unit+coverage | 45–75 сек |
| `build-smoke` | app/dependency PR | required | Next build, standalone verification, secret scan, smoke, bundle budget, короткий Chromium `@critical` | 2–3.5 мин |
| `ops-check` | ops/workflow PR | required по классификации | artifact/ops/nginx tests и новые failure-injection tests | 1–2 мин |
| `dependency-review` | lockfile/package PR | required по классификации | Новые high/critical vulnerabilities | менее минуты |
| `verify` | каждый PR | единственный branch-protection context | Всегда запускаемый aggregator, проверяющий результаты нужных классу jobs | секунды |
| `release-artifact` | deploy-relevant push в `main` | блокирует deploy | Exact-main build, release verify, upload/download round-trip | 1.5–2 мин |
| `release-e2e` | после artifact | блокирует deploy | Chromium/Firefox/WebKit как три параллельных jobs, каждый тестирует скачанный exact artifact | 1.5–3 мин |
| `deploy` | green release gate | блокирует release | Forced SSH → единая серверная транзакция → 41 URL smoke | 0.5–1.5 мин |
| `post-deploy` | после publish | блокирует успешный deployment | Свежий GitHub runner проверяет exact SHA/host marker/TLS; обновляет monitor state | менее минуты |
| `nightly` | ночью | async | Lighthouse, полный audit, отчёты и тренды | вне цикла |
| `production-monitor` | каждые 30 мин | async alert | Текущий внешний монитор | без изменения смысла |

Полные 129 E2E при такой схеме не исчезают: они выполняются release-only перед deploy, но три браузера идут параллельно. Playwright официально поддерживает запуск отдельного проекта через `--project`; текущий конфиг уже определяет три проекта, но выполняет их последовательно одним worker ([config](/home/ar4i/projects/calc/playwright.config.ts:12), [Playwright Projects](https://playwright.dev/docs/test-projects)). Дополнительное sharding сейчас мало поможет: все тесты находятся в одном файле и `fullyParallel: false`. Сначала достаточно matrix по браузеру; затем можно разделить browser-independent contract/crawl и интерактивные сценарии на отдельные spec-файлы.

## а) Path filters и required gate

Path-based классификация нужна, но не на уровне `on.pull_request.paths`.

GitHub прямо предупреждает: если required workflow целиком пропущен из-за path filter, его check остаётся `Pending` и блокирует merge. Условно пропущенный job, наоборот, получает `Success`, поэтому сделать conditional job самим required check — потенциальная дырка. Зависимый required job также может быть пропущен после failure, если не использовать `if: always()`. [GitHub troubleshooting required checks](https://docs.github.com/en/enterprise-cloud%40latest/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks).

Правильный паттерн:

- Workflow запускается на каждом PR без `paths`.
- Сохраняется существующее required-имя `verify`, чтобы не делать опасную миграцию branch protection.
- `classify` выдаёт флаги `docs`, `ops`, `app`, `dependencies`.
- Тяжёлые jobs имеют `if` по этим флагам.
- Финальный `verify` имеет `if: always()`, зависит от всех jobs и самостоятельно принимает `success/skipped` только в соответствии с классификацией.
- Ошибка классификации, неизвестный путь или неожиданный `skipped` → fail/full pipeline.
- Классификатор должен иметь unit-тесты; не полагаться на встроенное path filtering, ограниченное первыми 300 файлами.
- Для docs declaration workflow должен реагировать также на `pull_request.edited`, иначе изменение PR body не перезапустит gate.
- PR body нельзя подставлять прямо в shell: GitHub считает его недоверенным вводом; читать следует из event JSON или через env. [GitHub script injection guidance](https://docs.github.com/en/actions/concepts/security/script-injections).

Разделение:

- `docs/**`, корневые Markdown — только docs.
- `ops/**`, `.github/**`, deploy/monitor tests — ops.
- `app/**`, `components/**`, `catalog/**`, `logic/**`, `lib/**`, `public/**`, Next/TS/Playwright/Vitest config — app.
- `package.json`, lockfile — app + dependencies.
- Всё нераспознанное — app + ops, то есть fail-safe default.

Docs-only commit после merge не должен выпускать новый application SHA. Ops-only commit должен обновлять versioned ops bundle и проверять текущий production release, но не пересобирать Next.

PR artifact переиспользовать для production нельзя: `pull_request` проверяется на synthetic merge ref, тогда как squash/rebase создаёт новый SHA в `main`. Это видно и в последнем run: head PR был `97dc…`, но artifact получил merge SHA `e510…`. [GitHub PR merge refs](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests#pull-request-refs-and-merge-branches).

## б) Автодеплой и общий сервер

Автодеплой рекомендую. Но не в виде «Actions получил root SSH и запускает произвольный rsync/bash».

На сервере нужен стабильный root-owned forced-command wrapper, который принимает только типизированные команды вроде:

- `deploy <sha> <run-id>`
- `hold-if-current <sha>`
- `status <sha>`

`authorized_keys` должен использовать `restrict,command="..."`. OpenSSH подтверждает, что forced command игнорирует клиентскую команду, а `restrict` отключает PTY, forwarding и user rc; исходный ввод остаётся только в `SSH_ORIGINAL_COMMAND`, который wrapper обязан строго разобрать. [OpenSSH authorized_keys](https://man.openbsd.org/sshd#AUTHORIZED_KEYS_FILE_FORMAT).

Предпочтительная передача артефакта:

1. GitHub release job собирает и round-trip проверяет artifact.
2. SSH передаёт только `sha` и `run-id`.
3. Серверный wrapper через read-only GitHub token проверяет repository/workflow/event=`push`/branch=`main`/head SHA и успешные release jobs.
4. Сервер сам скачивает artifact из конкретного run. GitHub artifact API допускает fine-grained token только с `Actions: read`. [GitHub artifact API](https://docs.github.com/en/rest/actions/artifacts).
5. Распаковка идёт в bounded staging: лимит размера/времени, запрет absolute/`..`/symlink/special files.
6. Затем существующий независимый bash guard повторно проверяет inventory, SHA-256, BUILD_ID, ownership и modes ([verify-release.sh](/home/ar4i/projects/calc/ops/deploy/verify-release.sh:28)).

Критические меры:

- Создать GitHub Environment `production`, разрешённый только для `main`; сейчас `gh api .../environments` возвращает `total_count: 0`. Deploy key и known-hosts должны существовать только там. Environments ограничивают branches и доступность secrets. [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments).
- `concurrency: production-deploy`, `cancel-in-progress: false`: деплой нельзя убивать посередине. GitHub сериализует concurrency groups; server-side `flock` остаётся вторым барьером. [GitHub concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency).
- Pinned server host key и `StrictHostKeyChecking=yes`.
- Build/test jobs не получают SSH secret.
- Никакого generic `rsync`, shell, `sudo`, `pm2 all`, произвольных путей или других vhost.
- Идемпотентный retry: существующий immutable release либо полностью guard-valid и переиспользуется, либо deploy прекращается.
- Автоматический GC только после успешного publish: не удалять current/previous и сохранять минимум три verified release. Сейчас retention описан в документации, но реализации в просмотренных scripts нет.

Особенно важно объединить deploy в одну серверную транзакцию. Сейчас `activate-release.sh` и `publish-release.sh` берут один и тот же lock, но раздельно ([activate](/home/ar4i/projects/calc/ops/deploy/activate-release.sh:9), [publish](/home/ar4i/projects/calc/ops/deploy/publish-release.sh:9)). Между командами существует окно для rollback/другого deploy. Нужен `calculandia-deploy-release`, удерживающий один lock от staging до окончания external smoke; внутренние скрипты следует превратить в функции либо добавить корректный режим «lock уже удерживается».

Ops control plane нужно версионировать отдельно:

- Стабильный forced-command/bootstrap не обновляется автоматически.
- Repo-managed scripts/nginx/systemd складываются в `/opt/calculandia-ops/releases/<sha>` или аналогичный versioned layout.
- Их symlink/config activation транзакционен и имеет собственный rollback.
- Ops-only fix устанавливает новый bundle, выполняет host check и обязательный 41-URL external smoke против текущего application SHA.

Для shared host дополнительно нужны cgroup-ограничения и для основного PM2 unit, и для candidate. Текущий `max_memory_restart: 512M` — политика рестарта PM2, но не жёсткая граница ресурсов ([ecosystem.config.cjs](/home/ar4i/projects/calc/ops/pm2/ecosystem.config.cjs:8)). `MemoryHigh/MemoryMax`, `CPUQuota` и `TasksMax` ограничивают целый systemd cgroup. [systemd resource control](https://man7.org/linux/man-pages/man5/systemd.resource-control.5.html).

## в) Lighthouse

Из required убрать. В nightly оставить и сделать строже аналитически.

Причины:

- Lighthouse сам документирует зависимость результатов от условий запуска. [Chrome Lighthouse variability](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#why-your-score-fluctuates).
- LHCI по умолчанию использует `aggregationMethod: optimistic`, то есть наиболее проходное из трёх измерений. Именно поэтому текущий required gate одновременно флейковый и не особенно строгий. [LHCI configuration](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#aggregation-methods).
- Fail run показал TBT `859 / 322 / 241.5` при ошибке по лучшему значению 241.5. Простое повышение порога до 300 делает gate стабильнее, но не превращает shared runner в надёжный performance sensor.
- Сейчас отчёты пишутся в `artifacts/lighthouse` ([config](/home/ar4i/projects/calc/.lighthouserc.json:43)), но CI загружает только standalone artifact ([ci.yml](/home/ar4i/projects/calc/.github/workflows/ci.yml:46)); исторические Lighthouse reports теряются.

Nightly:

- 3–5 runs.
- `aggregationMethod: median`.
- Текущие калиброванные page-specific бюджеты.
- Upload reports `if: always()`.
- Отслеживание регрессии относительно baseline, а не реакция на один TBT.
- Отдельный alert, не блокирующий срочный deploy.

На required build добавить быстрый bundle budget, но не считать его заменой Lighthouse: абсолютный и допустимый delta gzip-размера JS, реально referenced homepage и representative calculator. Это детерминированно ловит раздувание чанков менее чем за секунду.

## Документация

Docs gate обязателен. Сейчас документация уже расходится с production:

- Статус всё ещё говорит о RC/holding и blocked launch ([production-design.md](/home/ar4i/projects/calc/docs/operations/production-design.md:3)).
- Process описывает external smoke как 25 sitemap URL ([production-design.md](/home/ar4i/projects/calc/docs/operations/production-design.md:87)), тогда как script требует 41 ([external-smoke.sh](/home/ar4i/projects/calc/ops/deploy/external-smoke.sh:82)).

Целевая политика:

- PR template с обязательным `Docs impact`.
- Для `ops/**`, `.github/workflows/**` и публичного поведения требуется реальный diff в соответствующем `docs/**`.
- Для чистого внутреннего refactor разрешено `Docs not affected: <непустая причина>`.
- `docs-contract` проверяет декларацию, Markdown formatting, внутренние ссылки и несколько generated invariants.
- Из `production-design.md` убрать быстро устаревающие «текущий SHA/holding/сейчас запущено». Design хранит архитектуру и runbook; текущий release хранится в GitHub Deployment, `/healthz` и deploy receipt.
- Workflow не должен самостоятельно commit’ить docs после deploy: это создаёт цикл и обход PR. Deploy evidence — immutable Actions artifact/Environment record; смысловые изменения документации проходят в исходном PR.

## Приоритеты и эффект

1. **P0: разделить PR gate и exact-main release pipeline; required `verify` сделать always-running aggregator.**  
   Эффект: docs PR с 8–10 минут до <1 минуты; app PR до 2.5–4 минут.

2. **P0: убрать Lighthouse из required; полный Playwright запускать release-only как browser matrix.**  
   Эффект: ещё −2–5 минут критического пути, при сохранении всех 129 тестов до deploy.

3. **P0: автоматизировать deploy через production Environment + forced-command orchestrator с одним lock.**  
   Эффект: убрать 10–20+ минут ручных download/verify/rsync/activate/publish действий.

4. **P0: автоматизировать monitor state.**  
   Deploy receipt должен вернуть SHA и PM2 restart baseline; после независимого post-deploy check автоматически обновлять `PRODUCTION_RELEASE_SHA` и `PRODUCTION_PM2_RESTART_BASELINE`. Официальный API требует `Variables: write`; не следует предполагать, что текущий read-only `GITHUB_TOKEN` это умеет — нужен узко ограниченный GitHub App/fine-grained token либо перенос baseline validation на host. [GitHub Variables API](https://docs.github.com/en/rest/actions/variables).

5. **P1: добавить integration/failure-injection tests deploy state machine.**  
   Текущий [test-ops-tools.mjs](/home/ar4i/projects/calc/scripts/test-ops-tools.mjs:70) хорошо тестирует guard, modes и action pins, но не activation/publish rollback. Нужны сценарии nginx old-worker 503→200, постоянный 503, нечитаемый marker для `www-data`, PM2 failure, candidate timeout, rollback failure→exit 2 и lock contention.

6. **P1: pinned Playwright CI image или собственный digest-pinned image с Node 22.22.2/nginx/browser dependencies.**  
   Эффект: убрать ещё 50–140 секунд установки браузеров на каждый run.

7. **P1: versioned ops bundle, resource limits, release GC и общий nginx reload lock с другими приложениями сервера.**  
   Эффект на время небольшой, но это закрывает основные shared-host риски.

8. **P2: `npm audit` убрать с каждого нерелевантного PR.**  
   На dependency PR использовать required dependency review, nightly запускать полный audit. Dependency Review блокирует именно новые уязвимые зависимости. [GitHub dependency review](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/customize-dependency-review-action). Экономия всего 1–2 секунды, ценность здесь в правильной семантике.

9. **P2: monitor cron перенести с `*/30` на, например, `7,37`.**  
   GitHub предупреждает о задержках и возможном drop scheduled jobs в начале часа. [GitHub scheduled workflow guidance](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows#scheduled-workflows).

Также стоит удалить или переопределить монолитный `npm run check`: он не используется workflow и уже не соответствует реальному production gate — в нём нет nginx check, release verify и upload round-trip ([package.json](/home/ar4i/projects/calc/package.json:37)). Лучше иметь явные `check:pr`, `check:ops`, `check:release`, `check:nightly`.

Итого: immutable releases, manifest/secret verification, server guard, candidate, rollback, holding fallback, 41-URL smoke и оба monitor остаются. Скорость достигается маршрутизацией, параллелизмом и устранением ручной оркестрации, а не ослаблением production safety.
