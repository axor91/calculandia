> **Исторический документ.** Этот файл описывает первоначальные цели и частично не соответствует фактическому состоянию проекта на 15 июля 2026 года. Актуальные результаты проверки, конкурентное исследование и целевой план находятся в [`docs/README.md`](../README.md).

Цели проекта
Создать масштабируемую платформу с множеством калькуляторов, которую легко расширять без дублирования кода.
Обеспечить продакшен-готовое качество: читаемость, тестируемость, безопасность, производительность.
Реализовать полноценный SEO-слой с управлением мета-данными и контентом через админ-панель.
Архитектура
Модель: модульный монолит с чёткими доменными границами, готовый к выделению микро-сервисов при росте нагрузки.
Домены и границы:
Калькуляторы: UI-компоненты и чистые функции расчёта в logic/_.
Каталог/Категории: справочники, связка калькулятор → категория.
SEO и Контент: title/description/keywords, afterCalculator HTML, FAQ, реклама.
Админка: UI для правок, API для сохранения в БД.
Разделение ответственности:
UI (Next.js App Router, Server Components по умолчанию; Client Components там, где нужен интерактив).
API (App Router routes, типобезопасная валидация).
Данные (Prisma ORM, миграции).
Код-сплиттинг:
Ленивые загрузки компонентов калькуляторов (dynamic import).
Чистая логика без React — переиспользуема и тестируема.
Кеширование:
Страница списка: серверный рендер с revalidate по требованию.
Страницы калькуляторов: SSR с кешированием на уровне CDN/Reverse-proxy; результаты расчётов — клиентские вычисления.
Сервисные файлы (sitemap/robots): кэш 1–6 часов.
Масштабирование по мере роста:
Вынесение API в отдельный сервис (Node.js) или сервер функций.
Redis для кеширования частых запросов и конфигураций SEO (опционально).
Очереди задач (BullMQ) для фоновых задач (перегенерация sitemap, интеграции).
Используемые технологии
Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 (токены в app/globals.css).
Бэкенд/API: Next.js API routes (App Router).
БД: SQLite для dev; PostgreSQL для prod (через Prisma).
ORM: Prisma (миграции, типы).
Валидация: Zod (и/или superstruct) на границах API.
Безопасность HTML: DOMPurify (server-side) для afterCalculator/FAQ, если HTML вводится в админке.
Тесты: Vitest/Jest (unit), React Testing Library (component), Playwright (E2E), Prisma test utils (интеграционные).
Линтинг/форматирование: ESLint, Prettier, Husky + lint-staged.
Логи/наблюдаемость: Pino/Next logs, Sentry (ошибки), Web Vitals/Lighthouse.
Структура проекта
app/: страницы, layout, API routes (app/api/_), SEO-файлы (sitemap.ts, robots.ts).
components/: UI-калькуляторы и общие компоненты (NumericInput, AdBanner, ContentBlock, FAQ, SeoTools).
logic/: чистые функции расчётов (без React).
lib/: типы, адаптеры БД, сервисы, конфигурации (Prisma client, мапперы DTO).
prisma/: схема, миграции, сиды.
tests/: unit/integration/e2e.
Важно: единый источник правды — БД (категории, список калькуляторов, SEO/контент/ads). Исключить дублирование конфигов в коде.
Дизайн-система (обязательные требования)
Минималистичный, строгий UI без hover/анимаций, без скруглений (использовать rounded-none).
Цвета: только neutral, positive, negative из app/globals.css.
Поля ввода: border-2 border-neutral-300, фокус focus:border-neutral-900, текст min 16px.
Контейнер калькулятора: bg-white border-2 border-neutral-300 shadow-sm, результат — font-bold.
Адаптив: Mobile <768px (скрыть боковое меню, бургер), Desktop ≥768px.
Данные и модель
Таблицы:
Category(id, name, description?, icon?).
Calculator(id, name, category, description, component, seoTitle, seoDescription, seoKeywords(JSON), contentBefore?, contentAfter?, faq(JSON)?, adsTopEnabled, adsTopCode?, adsSidebarEnabled, adsSidebarCode?, adsBottomEnabled, adsBottomCode?, createdAt, updatedAt).
Ограничения:
Calculator.id — slug, уникальный, используется в URL /calculator/[id].
Calculator.component — ключ маппинга на React-компонент.
Индексы: по Calculator.category, Calculator.id.
SEO
Управление из админки: Title, Description, Keywords, FAQ, контент, рекламные bloques.
Next Metadata API: динамические метатеги на странице калькулятора.
sitemap.xml/robots.txt:
Базовый URL берётся из NEXT_PUBLIC_SITE_URL.
Sitemap: главная, все калькуляторы, админка (priority 0.1).
Robots: Allow /, Disallow /admin/, /api/, Sitemap: {SITE_URL}/sitemap.xml.
Канонические URL, Open Graph, Twitter Cards.
Предпросмотр сниппета в админке.
ЧПУ: /calculator/{id}.
Админ-панель
Функции:
Перечень калькуляторов по категориям; фильтр/поиск.
Редактирование SEO, контента (HTML), FAQ (список Q/A), рекламы (вкл/код).
Просмотр/копирование sitemap.xml и robots.txt.
Доступ:
Авторизация (NextAuth/Keycloak/предпочтительная AuthN), роли (admin).
Защита API маршрутов (middleware по сессии/роли).
CSRF защита для форм (или только JSON fetch с samesite strict cookies).
Безопасность контента:
Серверная очистка HTML DOMPurify (allowlist тегов).
Экранирование при выводе.
API
/api/calculators GET — список (типобезопасный DTO).
/api/calculators/[id] GET/PUT — детали/сохранение SEO/контента/рекламы.
Валидация:
Zod-схемы для входа/выхода, нормализация keywords и faq.
Версионирование: префикс v1 при необходимости.
Лимиты/защита:
Rate-limit для публичных GET (если потребуется).
Аудит-лог сохранений (кто изменил, когда).
Калькуляторы: шаблон и расширяемость
Принципы:
Чистая логика в logic/{calc}.ts (pure functions, guard clauses).
UI-компонент components/{CalcName}Calculator.tsx — использует NumericInput.
Ленивый импорт компонента по ключу component из БД.
Маппинг компонентов:
Поддерживаемый способ: явный componentMap: Record<string, React.ComponentType> в app/calculator/[id]/page.tsx.
Альтернатива (по мере роста): lib/components-map.ts с Record<string, () => Promise<{ default: React.ComponentType }>> и dynamic() для код-сплиттинга.
Гайд по добавлению нового калькулятора:

1. Добавить logic/new-calc.ts с экспортом чистой функции.
2. Создать components/NewCalcCalculator.tsx (использовать NumericInput, форматирование Intl.NumberFormat('ru-RU')).
3. Добавить запись в БД (сид/админка): id, name, category, component: 'NewCalcCalculator', SEO/контент.
4. Добавить компонент в componentMap.
5. Написать unit-тесты на логику и компонент.
   Тестирование
   Unit:
   Функции из logic/* (границы, NaN, негативные кейсы).
   Маппинг DTO БД → UI-модель.
   Component:
   Рендер и интеракции калькуляторов (Testing Library).
   Снапшоты ключевых состояний.
   Integration:
   API маршруты с тестовой БД (Prisma + sqlite in-memory).
   Валидация Zod, статусы ошибок.
   E2E:
   Ключевые пользовательские сценарии (выбор калькулятора, ввод данных, просмотр результата).
   Админка: логин, правки SEO/контента, проверка отражения на странице.
   Нефункциональные:
   Lighthouse/Web Vitals, perf budget.
   Безопасность: XSS/HTML инъекции, заголовки ответов.
   Качество и безопасность (продакшен)
   Код:
   ESLint + Prettier, strict TS, запрет any, guard clauses, DRY.
   PR правила: code review 2+ апрува, CI green build, покрытие unit ≥ 80% для logic/*.
   Безопасность:
   CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
   Очистка HTML контента (DOMPurify), экранирование.
   Авторизация и защита админ-API; JWT/Session, ротация токенов.
   Секреты — в переменных окружения (не коммитить).
   Данные:
   Миграции Prisma, бэкапы БД, миграции backward-compatible.
   Сани-инпутов/валидация на всех API.
   Наблюдаемость:
   Логи ошибок (Sentry), технические метрики (статусы кодов, latency).
   Алерты SLAs (например, TTFB p95 < 500ms).
   Производительность:
   Кэш заголовки, статические ассеты через CDN.
   Код-сплиттинг калькуляторов.
   CI/CD и окружения
   Environments: dev, staging, prod.
   CI:
   Установка, линт, тесты (unit/integration), build.
   CD:
   Автодеплой в staging по main, ручной промоушен в prod.
   Docker:
   Контейнер для Next.js и Prisma миграции при старте.
   Переменные окружения:
   DATABASE_URL, NEXT_PUBLIC_SITE_URL, SENTRY_DSN, секреты аутентификации.
   Команды (Windows PowerShell)

Dev:

npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev

Prod (пример):
npm run build
npm run start

Критерии готовности (Definition of Done)
Добавление нового калькулятора не требует изменения более чем в 3 местах (логика, компонент, маппинг/запись в БД).
Все линтеры/тесты зелёные; покрытие unit для logic/* ≥ 80%.
SEO управляется из админки; sitemap.xml и robots.txt корректны и используют NEXT_PUBLIC_SITE_URL.
Админка защищена (аутентификация, роли), контент санитизируется.
Нет дублирования реестров; единый источник правды — БД.
Соответствие дизайн-системе (без hover/rounded, корректные цвета и границы).
План работ по итогам аудита
Архитектура/данные:
Убрать дублирование реестров: оставить БД как единственный источник; перенести категории полностью в БД; в lib/registry.ts оставить только типы/утилиты.
Унифицировать маппинг компонентов: componentMap + lazy dynamic(); привести component значений в БД к этому справочнику.
SEO/файлы:
Унифицировать базовый URL: и app/sitemap.ts, и app/robots.ts берут process.env.NEXT_PUBLIC_SITE_URL.
Кэширование sitemap/robots и их предпросмотр в админке.
Дизайн-система:
Удалить hover/rounded, везде border-2, shadow-sm только у контейнера, использовать только neutral/positive/negative.
Безопасность:
Ввести аутентификацию в админке и защиту API; добавить серверную очистку HTML (DOMPurify).
Добавить security headers и базовую CSP.
Тесты/качество:
Unit-тесты для logic/percentDiff.ts, logic/mortgage.ts.
Интеграционные тесты API /api/calculators и /api/calculators/[id].
E2E сценарии для основных калькуляторов и админки.
Подключить ESLint/Prettier/Husky, настроить CI.
Производительность:
Lazy-load калькуляторов, аудит Lighthouse, оптимизировать бандл (проверить динамики).
Prod-готовность:
План миграции на PostgreSQL для прод (оставив SQLite для dev).
Бэкапы БД и миграции по релизам.
Мониторинг ошибок (Sentry) и логирование.
Итог: после этих шагов проект будет модульным, легко расширяемым, безопасным и готовым к продакшену с управляемым SEO из админ-панели.
