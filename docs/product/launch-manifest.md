# Launch manifest

- Статус: **Approved for implementation**
- Версия: `1.1`
- Дата: 2026-07-16 (v1.0 — 2026-07-15)
- Launch cut-line: **30 индексируемых калькуляторов** (v1.0: 14; v1.1 добавляет Wave 2 из 16 URL по решению владельца от 2026-07-16 «14 калькуляторов мало»). Ни один условный URL не входит в release.

## 1. Правила manifest

- Один URL отвечает одному основному пользовательскому intent.
- Дополнительный режим допустим только как иной способ получить тот же тип результата.
- Все страницы проходят [`calculator-quality-standard.md`](calculator-quality-standard.md).
- Если любой из 14 калькуляторов не проходит formula/content/accessibility gate, весь утверждённый релиз задерживается до исправления или формального изменения manifest отдельным review-решением; незавершённый URL не публикуется.
- Solver уравнений и рабочие дни РФ исключены из launch.

## 2. Точный список

|   # | Category      | Canonical URL                        | Основной intent                                   | Ввод → результат                                                                | Formula/reference basis                                      | Formula owner                                 | Связанные URL | Baseline migration                |
| --: | ------------- | ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- | ------------- | --------------------------------- |
|   1 | Математика    | `/kalkulyator/procent-ot-chisla`     | Найти процент, целое или долю                     | число/процент/часть → искомое значение                                          | Определение процента как сотой доли                          | Engineering + content review                  | 2, 3          | новый URL                         |
|   2 | Математика    | `/kalkulyator/procentnoe-izmenenie`  | Сравнить два неотрицательных значения в процентах | старое/новое → изменение и симметричная разница                                 | Relative change; symmetric difference over mean magnitude    | Engineering + content review                  | 1, 3          | `/calculator/percent-diff` → 301  |
|   3 | Математика    | `/kalkulyator/drobi`                 | Выполнить действие с двумя дробями                | mixed fractions + operation → reduced fraction/mixed result                     | Rational arithmetic, Euclidean GCD                           | Engineering + content review                  | 1, 4          | `/calculator/fractions` → 301     |
|   4 | Математика    | `/kalkulyator/proporcii`             | Найти неизвестный член пропорции                  | три известных значения → четвёртое                                              | Cross multiplication with non-zero denominator               | Engineering + content review                  | 1, 3          | новый URL                         |
|   5 | Финансы       | `/kalkulyator/ipoteka`               | Оценить ипотечный платёж                          | price/down payment/term/rate/type → payment, overpayment, schedule              | Standard annuity/differential amortization                   | Engineering; financial assumptions review     | 6, 7, 8       | `/calculator/mortgage` → 301      |
|   6 | Финансы       | `/kalkulyator/kredit`                | Рассчитать потребительский кредит                 | principal/term/rate/type → payment, total, schedule                             | Standard annuity/differential amortization                   | Engineering; financial assumptions review     | 5, 7, 8       | новый URL                         |
|   7 | Финансы       | `/kalkulyator/vklad`                 | Рассчитать вклад с ежемесячной капитализацией     | principal/rate/term/end-of-month contribution → balance/income                  | Monthly compound recurrence with contribution after interest | Engineering; financial assumptions review     | 5, 6, 8       | новый URL                         |
|   8 | Финансы       | `/kalkulyator/dosrochnoe-pogashenie` | Сравнить один досрочный платёж                    | original loan/paid months/prepayment/strategy → saved interest/new term/payment | Shared annuity schedule; prepayment after scheduled payment  | Engineering; financial assumptions review     | 5, 6, 7       | новый URL                         |
|   9 | Дата и время  | `/kalkulyator/dni-mezhdu-datami`     | Узнать календарный интервал                       | start/end/include-end → signed total days, full weeks and remainder days        | Local Gregorian date arithmetic                              | Engineering + golden date cases               | 10, 11        | `/calculator/days` → 301          |
|  10 | Дата и время  | `/kalkulyator/pribavit-k-date`       | Прибавить/вычесть календарный период              | local date + signed days/months/years → date                                    | Gregorian arithmetic, month-end clamp policy                 | Engineering + golden date cases               | 9, 11         | часть baseline `/calculator/days` |
|  11 | Дата и время  | `/kalkulyator/vozrast`               | Рассчитать полный возраст                         | birth date/as-of date → years/months/days/next birthday                         | Calendar-component difference                                | Engineering + golden date cases               | 9, 10         | новый URL                         |
|  12 | Строительство | `/kalkulyator/beton`                 | Оценить объём бетона                              | geometry/dimensions/count/reserve → m³                                          | Geometric volume + explicit reserve                          | Engineering + construction assumptions review | 13, 14        | новый URL                         |
|  13 | Строительство | `/kalkulyator/plitka`                | Оценить количество плитки                         | surface/tile/openings/reserve → pieces/boxes/area                               | Area/ceiling to package + reserve                            | Engineering + construction assumptions review | 12, 14        | новый URL                         |
|  14 | Строительство | `/kalkulyator/oboi`                  | Оценить число рулонов обоев                       | room/openings/roll/repeat/reserve → strips/rolls                                | Perimeter, usable strips with repeat, ceiling                | Engineering + construction assumptions review | 12, 13        | новый URL                         |

## 2a. Wave 2 — расширение до 30 (утверждено 2026-07-16)

Правила раздела 1 действуют без изменений. Все 16 URL остаются в четырёх существующих категориях: новые category hubs не открываются, пока текущие не доказали индексацию. Каждый URL проходит полный [`calculator-quality-standard.md`](calculator-quality-standard.md) gate до публикации. Частотные объёмы Wordstat по-прежнему не заявляются; приоритет определён повторяемостью intent у исследованных конкурентов (см. раздел 4 и research) и переиспользованием уже проверенных движков (amortization, percent, calendar, construction units/openings).

|   # | Category      | Canonical URL                       | Основной intent                                  | Ввод → результат                                                             | Formula/reference basis                                                  | Переиспользование           |
| --: | ------------- | ----------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------- |
|  15 | Математика    | `/kalkulyator/srednee-znachenie`    | Среднее арифметическое и взвешенное списка чисел | список значений (+веса) → среднее, сумма, количество                         | Definition of arithmetic/weighted mean                                   | number parsing/result utils |
|  16 | Математика    | `/kalkulyator/nod-nok`              | НОД и НОК двух и более целых чисел               | целые числа → НОД, НОК, шаги                                                 | Euclidean GCD; `lcm = a×b / gcd`                                         | GCD из fractions engine     |
|  17 | Математика    | `/kalkulyator/kvadratnoe-uravnenie` | Решить квадратное уравнение                      | a, b, c → корни/дискриминант, вершина                                        | Closed-form discriminant (детерминированный, НЕ общий solver из §3)      | number/result utils         |
|  18 | Математика    | `/kalkulyator/ploshchad-figur`      | Площадь базовых фигур                            | фигура + размеры → площадь                                                   | Классические формулы: прямоугольник, треугольник (Герон), круг, трапеция | режимный UI как у №1        |
|  19 | Финансы       | `/kalkulyator/slozhnyj-procent`     | Рост суммы со сложным процентом                  | сумма/ставка/срок/период капитализации → итог, доход                         | Compound interest recurrence                                             | deposit recurrence engine   |
|  20 | Финансы       | `/kalkulyator/nakopleniya`          | Сколько откладывать в месяц до цели              | цель/срок/ставка → требуемый ежемесячный взнос                               | Future value of annuity, inverse; сверка forward-рекуррентой             | deposit recurrence engine   |
|  21 | Финансы       | `/kalkulyator/refinansirovanie`     | Выгода рефинансирования кредита                  | текущий кредит (остаток/ставка/срок) + новая ставка → экономия, новый платёж | Два annuity schedules, разница total interest                            | shared amortization engine  |
|  22 | Финансы       | `/kalkulyator/skidka`               | Цена со скидкой и экономия                       | цена/процент(ы) скидки → итоговая цена, экономия                             | Percent-of-number; последовательные скидки перемножением                 | percent engine              |
|  23 | Дата и время  | `/kalkulyator/skolko-dnej-do`       | Сколько дней осталось до даты                    | целевая дата (+точка отсчёта) → дни, недели+дни                              | Local Gregorian date arithmetic                                          | days-between engine         |
|  24 | Дата и время  | `/kalkulyator/raznica-dat`          | Разница между датами в годах/месяцах/днях        | две даты → полные Y/M/D                                                      | Calendar-component difference                                            | age engine                  |
|  25 | Дата и время  | `/kalkulyator/den-nedeli`           | День недели по дате                              | дата → день недели                                                           | Gregorian weekday (детерминированный алгоритм по calendar tuple)         | calendar utils              |
|  26 | Дата и время  | `/kalkulyator/kalkulyator-vremeni`  | Сложение и вычитание времени                     | интервалы чч:мм → сумма/разность, нормализация в дни                         | Sexagesimal arithmetic on minutes                                        | новый малый модуль          |
|  27 | Строительство | `/kalkulyator/kraska`               | Расход краски и число банок                      | стены/проёмы/расход/слои/объём банки → литры, банки                          | Area × coverage × layers; package ceiling                                | walls/openings utils        |
|  28 | Строительство | `/kalkulyator/laminat`              | Количество ламината                              | комната/упаковка/запас → м², упаковки                                        | Area / pack area + reserve; ceiling                                      | room area/units utils       |
|  29 | Строительство | `/kalkulyator/kirpich`              | Количество кирпича                               | стена/проёмы/формат кирпича/шов/толщина кладки → штук + запас                | Wall volume / (brick+joint volume); форматы по ГОСТ 530                  | walls/openings utils        |
|  30 | Строительство | `/kalkulyator/shtukaturka`          | Расход штукатурки и число мешков                 | площадь/толщина слоя/расход/фасовка → кг, мешки                              | Area × thickness × consumption; package ceiling                          | area/units utils            |

Итог по категориям: Математика 8, Финансы 8, Дата и время 7, Строительство 7. Sitemap: 7 статических + 4 категории + 30 калькуляторов = **41 URL**.

Замечания по границам scope:

- №17 не отменяет исключение общего solver уравнений (§3): квадратное уравнение решается закрытой формулой без итераций, полнота гарантирована.
- №21 не использует внешние текущие ставки (source policy §5): обе ставки вводит пользователь; страница явно сообщает, что комиссии/страховки при рефинансировании не моделируются.
- №23 использует явное поле «точка отсчёта» с дефолтом «сегодня» на клиенте; тесты фиксируют asOf, недетерминированного `Date.now()` в математике нет.
- №29/№30 используют видимые редактируемые коэффициенты (§5); справочные значения — из ГОСТ/manufacturer sources с типом записи.

## 3. Не публикуется в первой волне

| Baseline/idea           | Решение                             | Причина                                                                                 | Условие возврата                                                                                              |
| ----------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/calculator/equations` | 404; отсутствует в registry/sitemap | Недетерминированный Newton solver, synchronous main-thread load, не гарантирует полноту | Отдельный scope/spec, deterministic solver или честно ограниченный numerical tool, complexity limits и worker |
| Рабочие дни РФ          | Не показывать режим и URL           | Baseline calendar неверен; официальные переносы меняются ежегодно                       | ADR-0003 data gate и version-controlled official calendars                                                    |
| ~~Среднее значение~~    | Перенесено в Wave 2 (§2a, №15)      | —                                                                                       | Закрыто v1.1                                                                                                  |
| Налоги/зарплата/пособия | Wave 2+                             | Изменяемое законодательство/YMYL                                                        | Primary-source update owner и review SLA                                                                      |
| Здоровье                | Wave 2+                             | Высокий trust/YMYL риск                                                                 | Medical source/reviewer policy                                                                                |

## 4. Intent/SERP evidence

Дата проверки SERP: 2026-07-15. Точный частотный объём Wordstat не заявляется: в доступном контуре не было аутентифицированного Wordstat export. Решение основано на повторяемости задач у исследованных конкурентов, составе выдачи и стоимости качественной реализации.

| Intent cluster                              | Наблюдение выдачи                                                                                  | Решение                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| «калькулятор процентов / процент от числа»  | Выдача часто принимает один инструмент с близкими режимами: процент от числа, доля, исходное целое | Отдельный broad utility URL №1                        |
| «процентная разница / процентное изменение» | Есть самостоятельные страницы и отличающаяся формула относительно «процент от числа»               | Отдельный URL №2                                      |
| «дни между датами»                          | Самостоятельные landing pages и комбинированные date tools                                         | Отдельный URL №9                                      |
| «прибавить дни к дате»                      | В выдаче присутствуют самостоятельные pages и отдельные sections комбинированных tools             | Отдельный URL №10 во избежание перегруженной формы    |
| «рабочие дни»                               | Пользователь ожидает официальный календарь, а не только выходные                                   | Исключено до data gate                                |
| Ипотека/кредит/вклад                        | Устойчивые отдельные intents на всех крупных каталогах                                             | Три самостоятельных URL                               |
| Строительные материалы                      | Повторяются у крупных RU-каталогов, имеют различающиеся input models                               | Три самостоятельных URL для полноценного category hub |

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
