# Launch manifest

- Статус: **Approved for implementation**
- Версия: `1.0`
- Дата: 2026-07-15
- Launch cut-line: **14 индексируемых калькуляторов**. Ни один условный URL не входит в release.

## 1. Правила manifest

- Один URL отвечает одному основному пользовательскому intent.
- Дополнительный режим допустим только как иной способ получить тот же тип результата.
- Все страницы проходят [`calculator-quality-standard.md`](calculator-quality-standard.md).
- Если любой из 14 калькуляторов не проходит formula/content/accessibility gate, весь утверждённый релиз задерживается до исправления или формального изменения manifest отдельным review-решением; незавершённый URL не публикуется.
- Solver уравнений и рабочие дни РФ исключены из launch.

## 2. Точный список

| # | Category | Canonical URL | Основной intent | Ввод → результат | Formula/reference basis | Formula owner | Связанные URL | Baseline migration |
|---:|---|---|---|---|---|---|---|---|
| 1 | Математика | `/kalkulyator/procent-ot-chisla` | Найти процент, целое или долю | число/процент/часть → искомое значение | Определение процента как сотой доли | Engineering + content review | 2, 3 | новый URL |
| 2 | Математика | `/kalkulyator/procentnoe-izmenenie` | Сравнить два неотрицательных значения в процентах | старое/новое → изменение и симметричная разница | Relative change; `2|a-b|/(|a|+|b|)` | Engineering + content review | 1, 3 | `/calculator/percent-diff` → 301 |
| 3 | Математика | `/kalkulyator/drobi` | Выполнить действие с двумя дробями | mixed fractions + operation → reduced fraction/mixed result | Rational arithmetic, Euclidean GCD | Engineering + content review | 1, 4 | `/calculator/fractions` → 301 |
| 4 | Математика | `/kalkulyator/proporcii` | Найти неизвестный член пропорции | три известных значения → четвёртое | Cross multiplication with non-zero denominator | Engineering + content review | 1, 3 | новый URL |
| 5 | Финансы | `/kalkulyator/ipoteka` | Оценить ипотечный платёж | price/down payment/term/rate/type → payment, overpayment, schedule | Standard annuity/differential amortization | Engineering; financial assumptions review | 6, 7, 8 | `/calculator/mortgage` → 301 |
| 6 | Финансы | `/kalkulyator/kredit` | Рассчитать потребительский кредит | principal/term/rate/type → payment, total, schedule | Standard annuity/differential amortization | Engineering; financial assumptions review | 5, 7, 8 | новый URL |
| 7 | Финансы | `/kalkulyator/vklad` | Рассчитать вклад с ежемесячной капитализацией | principal/rate/term/end-of-month contribution → balance/income | Monthly compound recurrence with contribution after interest | Engineering; financial assumptions review | 5, 6, 8 | новый URL |
| 8 | Финансы | `/kalkulyator/dosrochnoe-pogashenie` | Сравнить один досрочный платёж | original loan/paid months/prepayment/strategy → saved interest/new term/payment | Shared annuity schedule; prepayment after scheduled payment | Engineering; financial assumptions review | 5, 6, 7 | новый URL |
| 9 | Дата и время | `/kalkulyator/dni-mezhdu-datami` | Узнать календарный интервал | start/end/include-end → signed total days, full weeks and remainder days | Local Gregorian date arithmetic | Engineering + golden date cases | 10, 11 | `/calculator/days` → 301 |
| 10 | Дата и время | `/kalkulyator/pribavit-k-date` | Прибавить/вычесть календарный период | local date + signed days/months/years → date | Gregorian arithmetic, month-end clamp policy | Engineering + golden date cases | 9, 11 | часть baseline `/calculator/days` |
| 11 | Дата и время | `/kalkulyator/vozrast` | Рассчитать полный возраст | birth date/as-of date → years/months/days/next birthday | Calendar-component difference | Engineering + golden date cases | 9, 10 | новый URL |
| 12 | Строительство | `/kalkulyator/beton` | Оценить объём бетона | geometry/dimensions/count/reserve → m³ | Geometric volume + explicit reserve | Engineering + construction assumptions review | 13, 14 | новый URL |
| 13 | Строительство | `/kalkulyator/plitka` | Оценить количество плитки | surface/tile/openings/reserve → pieces/boxes/area | Area/ceiling to package + reserve | Engineering + construction assumptions review | 12, 14 | новый URL |
| 14 | Строительство | `/kalkulyator/oboi` | Оценить число рулонов обоев | room/openings/roll/repeat/reserve → strips/rolls | Perimeter, usable strips with repeat, ceiling | Engineering + construction assumptions review | 12, 13 | новый URL |

## 3. Не публикуется в первой волне

| Baseline/idea | Решение | Причина | Условие возврата |
|---|---|---|---|
| `/calculator/equations` | 404; отсутствует в registry/sitemap | Недетерминированный Newton solver, synchronous main-thread load, не гарантирует полноту | Отдельный scope/spec, deterministic solver или честно ограниченный numerical tool, complexity limits и worker |
| Рабочие дни РФ | Не показывать режим и URL | Baseline calendar неверен; официальные переносы меняются ежегодно | ADR-0003 data gate и version-controlled official calendars |
| Среднее значение | Wave 2 | Низкая роль в launch clusters относительно обязательных страниц | После первой индексации |
| Налоги/зарплата/пособия | Wave 2+ | Изменяемое законодательство/YMYL | Primary-source update owner и review SLA |
| Здоровье | Wave 2+ | Высокий trust/YMYL риск | Medical source/reviewer policy |

## 4. Intent/SERP evidence

Дата проверки SERP: 2026-07-15. Точный частотный объём Wordstat не заявляется: в доступном контуре не было аутентифицированного Wordstat export. Решение основано на повторяемости задач у исследованных конкурентов, составе выдачи и стоимости качественной реализации.

| Intent cluster | Наблюдение выдачи | Решение |
|---|---|---|
| «калькулятор процентов / процент от числа» | Выдача часто принимает один инструмент с близкими режимами: процент от числа, доля, исходное целое | Отдельный broad utility URL №1 |
| «процентная разница / процентное изменение» | Есть самостоятельные страницы и отличающаяся формула относительно «процент от числа» | Отдельный URL №2 |
| «дни между датами» | Самостоятельные landing pages и комбинированные date tools | Отдельный URL №9 |
| «прибавить дни к дате» | В выдаче присутствуют самостоятельные pages и отдельные sections комбинированных tools | Отдельный URL №10 во избежание перегруженной формы |
| «рабочие дни» | Пользователь ожидает официальный календарь, а не только выходные | Исключено до data gate |
| Ипотека/кредит/вклад | Устойчивые отдельные intents на всех крупных каталогах | Три самостоятельных URL |
| Строительные материалы | Повторяются у крупных RU-каталогов, имеют различающиеся input models | Три самостоятельных URL для полноценного category hub |

SERP evidence URLs сохранены в [`../research/evidence-log.md`](../research/evidence-log.md).

## 5. Source policy

- Для чистой математики source of truth — формальная спецификация в коде/документе и независимые golden examples; ссылка на справочный источник используется для объяснения, но не заменяет тесты.
- Для финансовых формул не используются внешние текущие ставки: все значения вводит пользователь. Страница явно сообщает, что комиссии, страховки, банковское округление и ПСК могут отличаться.
- Для строительства результат является оценкой. Каждый коэффициент запаса видим и редактируем; скрытых отраслевых коэффициентов нет.
- Mutable official data запрещены без ADR-0003.

## 6. Category launch gate

Каждая из четырёх категорий публикуется только когда все её manifest URL прошли:

- formula golden cases;
- content/source review;
- 0 broken internal links;
- 0 axe critical/serious;
- keyboard/mobile smoke;
- metadata/canonical/sitemap test;
- production build.
