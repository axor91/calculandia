# Спецификация поиска, страниц и UI

- Статус: **Normative**
- Accessibility target: **WCAG 2.2 AA** плюс product target touch 44×44 CSS px.

## 1. Поиск первого релиза

- Источник: тот же типизированный registry, что создаёт страницы и sitemap.
- Размер: 14 published tools; отдельный search backend не нужен.
- UI: client-side accessible combobox на главной и `/kalkulyatory`.
- Индекс: title, short description, category, curated synonyms; произвольный SEO-text не индексируется в search.
- Ranking: exact title/alias → prefix → token intersection → category; fuzzy matching не используется до появления данных.
- Keyboard: стрелки, Enter, Escape, Tab без focus trap; WAI-ARIA combobox/listbox semantics.
- No-JS: все category/tool links остаются в HTML; поиск является enhancement.
- Zero state: «Ничего не найдено», четыре категории и контакт для предложения инструмента.
- URL: ввод не создаёт query URL и историю; search pages не индексируются.
- Analytics: на launch отсутствует. Будущее zero-result logging требует privacy review и не сохраняет исходную строку без агрегации.

## 2. Минимальные wireframes

### Главная, desktop

```text
[logo] [search........................] [Каталог] [Методология]

[H1: калькуляторы, которые объясняют результат]
[короткое обещание]       [поиск / популярные запросы]

[Популярные инструменты: 4 cards]
[Математика] [Финансы] [Дата] [Строительство]
[Как проверяем формулы] [Новые/обновлённые]
[footer trust/legal]
```

### Calculator, desktop

```text
[breadcrumb]
[H1] [короткая строка о результате] [проверено: дата]

[form fields / controls       ][live/result summary]
[primary action when required ][copy link / reset]

[как считается] [формула] [пример]
[допущения и ограничения]
[источники / версия]
[related tools]
```

### Calculator, mobile

```text
[header: logo | search | menu]
[breadcrumb]
[H1]
[короткая строка]
[fields]
[result immediately after active group]
[action row: reset | copy]
[details/formula/examples]
[related]
```

Реклама отсутствует в launch.

## 3. Page states

| State                | Поведение                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Initial              | Valid defaults, сразу показан пример результата                                                                                   |
| Editing              | Дешёвый расчёт обновляется после valid parse; тяжёлый ждёт submit                                                                 |
| Incomplete           | Нейтральная подсказка, старый результат визуально не выдаётся за новый                                                            |
| Invalid              | Inline error + summary при нескольких полях; focus на summary после submit                                                        |
| Busy                 | Только schedule/heavy; кнопка disabled, `aria-busy`, без бесконечного spinner                                                     |
| Result               | Именованный region; live-статус только после явного действия, чтобы не озвучивать каждую клавишу; таблица не озвучивается целиком |
| Unavailable          | Причина и поддерживаемый диапазон, без guessed result                                                                             |
| Copy success/failure | Текстовый статус; исходные значения не отправляются серверу                                                                       |
| Runtime error        | Error boundary, сохранение введённых данных по возможности, retry/reset                                                           |

## 4. Responsive/browser matrix

| Environment          | Viewport/режим                                        | Gate                                                                            |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Chrome Android       | 360×800 portrait, 800×360 landscape, virtual keyboard | Полная функциональность, нет horizontal page scroll                             |
| Safari iOS           | 390×844 portrait, landscape, safe areas               | Inputs не zoom из-за font <16; controls не закрыты keyboard                     |
| Tablet Safari/Chrome | 768×1024 и landscape                                  | Нет пустого desktop sidebar; usable split/one-column                            |
| Chrome desktop       | 1366×768, 1440×900, 1920×1080                         | Form и primary result одновременно видимы для short tools                       |
| Firefox desktop      | 1366×768                                              | Форматирование/inputs/table эквивалентны                                        |
| WebKit desktop       | 1440×900                                              | Date/number behaviors и focus проверены                                         |
| Все desktop          | 200% zoom, keyboard-only                              | Нет потери content/actions и двухмерного scroll                                 |
| Reduced motion       | OS preference                                         | Нет обязательной анимации                                                       |
| Screen reader smoke  | NVDA/Firefox и VoiceOver/Safari                       | Labels, errors, result, menu, FAQ читаются в правильном порядке в обеих связках |

`44×44` — product target для touch, а не заявление, что каждый inline link обязан иметь такую рамку по WCAG.

## 5. Accessibility acceptance

- один `h1`, логичная heading hierarchy;
- skip-link к main content;
- landmarks header/nav/main/footer;
- `fieldset/legend` для групп режимов;
- настоящие radio/checkbox либо корректные `aria-pressed` semantics;
- `aria-expanded`/`aria-controls` для menu/FAQ;
- labels не полагаются на placeholder;
- visible focus и порядок DOM совпадает с визуальным;
- ошибки связаны через `aria-describedby`;
- цвет не является единственным сигналом;
- axe: 0 critical и 0 serious;
- ручной keyboard и screen-reader smoke обязателен; axe его не заменяет.

## 6. Performance budgets

Lab gate на production build, mobile profile:

- Lighthouse Performance ≥ 90 для главной и representative short calculator;
- Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95;
- LCP lab ≤ 2.5 s;
- CLS ≤ 0.1;
- total blocking time ≤ 200 ms;
- route-specific initial JS target ≤ 170 KiB gzip, исключение требует bundle report;
- calculator input-to-result main-thread task ≤ 50 ms для live tools;
- schedule build запускается только по submit и занимает ≤ 200 ms для 600 rows на reference machine; если реализация не выполняет budget, она обязана использовать worker до допуска к launch;
- fonts self-hosted, reserved result/ad dimensions.

Field CWV оценивается только после накопления RUM/CrUX; отсутствие 28-дневных данных не маскируется lab-метрикой.

## 7. Product quality metrics после privacy approval

- successful calculation rate;
- median time from first interaction to valid result;
- validation error rate по коду поля без value;
- share action rate;
- related-tool transition rate;
- search zero-result aggregate;
- JS error/session и HTTP 5xx;
- p75 LCP/INP/CLS при наличии RUM.

Значения ввода/вывода, fragment URL и финансовые параметры не являются analytics payload.
