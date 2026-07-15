# Стандарт качества калькуляторов

- Статус: **Normative**
- Версия: `1.0`

## 1. Общий числовой контракт

### Ввод

- Русская запятая и точка принимаются как decimal separator.
- Обычные пробелы, NBSP и narrow NBSP между разрядами нормализуются.
- Scientific notation запрещена в consumer UI, если не указана явно.
- Каждое поле имеет `id`, `name`, связанный `label`, unit, hint и domain.
- Placeholder показывает формат, но никогда не заменяет стартовое value.
- Значения по умолчанию образуют корректный расчёт и могут быть сброшены.
- Неконечные значения, overflow и лишние символы отклоняются.

### Domain и limits

Каждый calculator schema задаёт `min`, `max`, integer/decimal и максимальную точность. Общие hard limits:

- длина числовой строки ≤ 32 символов;
- количество schedule rows ≤ 1200;
- диапазон календарных лет launch tools: 1900–2100;
- календарный интервал ≤ 200 лет;
- финансовая сумма: `0 < value ≤ 10^15`;
- годовая ставка: `0 ≤ rate ≤ 1000%`, UI warning выше 100%;
- срок кредита/ипотеки: 1–600 месяцев.

### Точность и округление

- Внутренние расчёты не округляются на каждом шаге без требования алгоритма.
- Денежный UI показывает 2 знака, итог schedule сверяется с остатком и может корректировать последний платёж.
- Для scalar golden cases tolerance: `max(1e-9 absolute, 1e-9 relative)`, кроме явно документированного денежного округления.
- Количество материалов округляется вверх до целой единицы/упаковки.
- Исходные и отображаемые значения не смешиваются.

## 2. Состояния UI

Каждый инструмент обязан поддерживать:

1. `default-valid` — заполненные defaults и готовый результат.
2. `editing-valid` — live result для дешёвых O(1) расчётов.
3. `editing-incomplete` — предыдущий результат не выдаётся как новый; показывается нейтральная подсказка.
4. `invalid` — локализованная ошибка рядом с полем и summary при нескольких ошибках.
5. `submitted` — для schedule/heavy calculation, явная кнопка и busy state.
6. `result` — `aria-live="polite"`, но без озвучивания каждого символа ввода.
7. `share-success/failure` — статус копирования доступен screen reader.
8. `unsupported` — честное сообщение без предположительного результата.

## 3. Спецификации launch-формул

### 3.1 Процент от числа

Поддерживаемые задачи:

- `p%` от `x`: `x × p / 100`;
- `a` составляет сколько процентов от `b`: `a / b × 100`, `b ≠ 0`;
- найти целое по части `a` и проценту `p`: `a × 100 / p`, `p ≠ 0`.

Все конечные числа допустимы там, где знаменатель не ноль. UI называет конкретный режим; результаты разных режимов не смешиваются.

Golden cases: `20% от 250 = 50`; `50 от 200 = 25%`; `50 = 20% от 250`.

### 3.2 Процентное изменение

- Relative change: `(new - old) / old × 100`, domain `old > 0`, `new ≥ 0`.
- Symmetric percent difference: `2 × |a-b| / (a+b) × 100`, domain `a,b ≥ 0`, не оба ноль.

Отрицательные значения отклоняются: consumer page не делает неоднозначных утверждений о процентном изменении знаковых величин.

Golden: `100→120 = +20%`; `120→100 = -16.666…%`; difference `100/120 = 18.1818…%` в обоих порядках.

### 3.3 Дроби

- Все numerators/denominators/whole parts — целые safe integers.
- Denominator > 0 после normalization и не равен нулю.
- Знак mixed fraction относится ко всему числу: `-2 1/3 = -7/3`.
- Result всегда сокращается; нулевой numerator даёт denominator 1.
- Mixed rendering сохраняет знак proper negative fraction: `-1/2`, а не `+1/2` или `-0 1/2`.

Golden: `-2 1/3 + 1 = -1 1/3`; `-1/2 + 1/4 = -1/4`; `1/2 ÷ 0/1` — domain error.

### 3.4 Пропорции

Для `a/b = c/x`: `x = b×c/a`, `a ≠ 0`. UI позволяет выбрать позицию неизвестного, затем использует соответствующее cross multiplication. Неизвестная позиция ровно одна.

### 3.5 Ипотека и кредит

Monthly rate `r = annualRate / 12 / 100`, periods `n`.

- Annuity при `r > 0`: `P × r × (1+r)^n / ((1+r)^n - 1)`.
- При `r = 0`: `P / n`.
- Differential principal part: `P/n`; interest month `i`: outstanding × `r`.
- Mortgage principal = price − down payment; `0 ≤ down payment < price`.

Schedule строится по submit. Последний платёж устраняет floating residual. Не включаются комиссии, страховка, досрочные платежи и банковское округление, если соответствующая страница не моделирует их явно.

Golden annuity: `P=1,000,000`, `12%`, `12 месяцев` → payment примерно `88,848.79` до policy rounding.

### 3.6 Вклад

Поддерживаются initial principal, nominal annual rate, целое число месяцев и фиксированный ежемесячный взнос. Капитализация в launch всегда ежемесячная. Tax, inflation, withdrawal и variable rate не рассчитываются.

Monthly rate `r = annualRate / 12 / 100`. Для каждого месяца `m = 1..n` выполняется строго:

1. `interest_m = balance_(m-1) × r`;
2. `balance_after_interest = balance_(m-1) + interest_m`;
3. фиксированный contribution добавляется **в конце месяца после начисления**, включая последний месяц;
4. `balance_m = balance_after_interest + contribution`.

Total user contributions = initial principal + `n × monthlyContribution`; interest income = final balance − total user contributions. При `r=0` результат равен сумме взносов.

Golden cases:

- `100 000`, `12%`, `1 месяц`, contribution `0` → `101 000`, income `1 000`;
- `100 000`, `12%`, `2 месяца`, contribution `10 000` → month 1 `111 000`, month 2 `122 110`, contributions `120 000`, income `2 110`;
- `50 000`, `0%`, `3 месяца`, contribution `5 000` → `65 000`, income `0`.

### 3.7 Досрочное погашение

Launch моделирует один аннуитетный кредит без предыдущих досрочных платежей. Inputs: original principal `P`, nominal annual rate, original term `n` months, число уже внесённых scheduled payments `k` (`1 ≤ k < n`), one-time prepayment `E`. Исходный schedule строится тем же shared amortization engine, что кредит/ипотека.

Prepayment применяется сразу **после scheduled payment № k**. В этот день сначала начисляется и погашается очередной interest/principal по исходному schedule, затем `E` уменьшает outstanding principal. Требуется `0 < E < outstanding_after_payment_k`; полное закрытие будет отдельным режимом Wave 2.

Стратегии:

- уменьшить срок при сохранении платежа;
- уменьшить платёж при сохранении срока.

При уменьшении срока исходный scheduled payment сохраняется, последний платёж уменьшается до точного остатка + interest; число оставшихся платежей вычисляется до zero balance. При уменьшении платежа оставшиеся `n-k` periods сохраняются и annuity payment пересчитывается от balance after prepayment. Результат показывает baseline total interest, revised total interest, экономию и новый term/payment. Не моделируются штрафы, комиссии, изменение ставки и календарные даты.

Golden cases:

- `P=120 000`, `0%`, `n=12`, `k=3`, `E=20 000`: balance after payment 3 = `90 000`, after prepayment = `70 000`; reduce-term → 7 remaining payments по `10 000`, total term 10 months; reduce-payment → 9 remaining payments с theoretical payment `7 777.777…`, last-payment rounding policy applies; interest savings = 0.
- `P=1 000 000`, `12%`, `n=12`, `k=3`, `E=100 000`: original payment `88 848.788678…`, balance before prepayment `761 080.285426…`, after `661 080.285426…`; reduce-term → 8 remaining payments, total term 11, revised interest `57 020.102600…`, savings `9 165.361540…`; reduce-payment → new payment `77 174.752393…`, revised interest `61 119.137575…`, savings `5 066.326565…`. Tolerance follows financial rounding policy.

### 3.8 Дни между датами

- Парсинг `YYYY-MM-DD` выполняется как local calendar components, не через UTC instant.
- По умолчанию результат — число границ полуночей между start inclusive и end exclusive.
- Начальная дата считается включённой, конечная — исключённой. Единственная дополнительная опция «включая конечную дату» добавляет один календарный день в направлении интервала. Если end раньше start, результат отрицательный и UI явно показывает обратное направление; порядок молча не переставляется.
- Рабочие дни/праздники отсутствуют.

Golden: `2024-03-01 → 2024-03-02 = 1`; `2024-02-28 → 2024-03-01 = 2`; DST не меняет календарное число дней.

Breakdown не является calendar Y/M/D duration: `absoluteDays = |totalDays|`, `fullWeeks = floor(absoluteDays / 7)`, `remainderDays = absoluteDays mod 7`, а направление показывается знаком totalDays. Golden: `2024-03-01 → 2024-03-17 = 16 дней = 2 недели и 2 дня`; обратный порядок даёт `-16`, breakdown остаётся `2 недели 2 дня` с текстом «назад».

### 3.9 Прибавить к дате

- Сначала применяются годы, затем месяцы с clamp к последнему дню целевого месяца, затем дни.
- `2024-01-31 + 1 month = 2024-02-29`.
- `2024-02-29 + 1 year = 2025-02-28`.
- Date хранится как calendar tuple; DST/timezone не изменяют выбранный день.

### 3.10 Возраст

Полные годы/месяцы/дни вычисляются календарно на `asOf`, не делением milliseconds на средний год. `birthDate ≤ asOf`. Политика дня рождения 29 февраля для «следующего дня рождения» объясняется отдельно; базовый возраст на конкретную дату однозначен.

### 3.11 Строительство

- Все dimensions приводятся к SI перед формулой.
- Openings вычитаются только там, где пользователь добавил их явно.
- Reserve — видимый percentage input, default и диапазон объяснены.
- Material package rounding выполняется вверх.
- Page показывает theoretical quantity и quantity with reserve отдельно.

Формулы геометрии, roll repeat и packaging фиксируются в unit tests каждого инструмента.

## 4. Golden-case gate

До публикации каждого URL требуется:

- минимум 10 domain cases;
- минимум 5 invalid/boundary cases;
- минимум 3 независимых hand-calculated golden cases;
- timezone fixtures для date tools;
- last-payment reconciliation для schedules;
- property tests там, где есть очевидные invariants: symmetry, monotonicity, reduced fraction, non-negative balance.

Зелёные baseline tests не считаются доказательством корректности, если они проверяют только self-consistency или `> 0`.

## 5. Formula/editorial workflow

Для каждого definition обязательны:

- `formulaVersion` — меняется при изменении математического результата/semantics;
- `contentUpdatedAt` — существенное изменение объяснения;
- `formulaReviewedAt` — дата последней независимой проверки golden cases;
- `sourceCheckedAt` — дата проверки внешнего источника;
- `dataEffectiveAt` — только для mutable official data;
- `assumptions` и `roundingPolicy`;
- список source records с типом `primary/reference/manufacturer`.

Изменение формулы требует:

1. changelog entry;
2. новых/обновлённых golden cases;
3. независимого review;
4. обновления `formulaVersion` и `formulaReviewedAt`;
5. проверки, изменился ли `lastModified` и нужен ли notice пользователям.

Опубликованная ошибка исправляется отдельным commit с описанием затронутых результатов; нельзя молча менять semantics.
