# Calculandia

Основной Git/CI: private GitLab goghtools-group/calculandia. Перед Git/CI/deploy
читать docs/operations/auto-deploy.md и docs/operations/production-design.md.
GitHub Actions выключен; archive/github-* не является текущей инструкцией.
Сохранять immutable artifacts, exact SHA/manifest, все браузеры и strict audit.
Runtime без БД; не трогать legacy prisma DB или соседние PM2 приложения.
Пользовательские файлы .codex и локальные ветки сохранять. Existing owner decisions
о публикации и отключённом remote monitor остаются в силе.
