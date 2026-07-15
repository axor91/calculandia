# Evidence log конкурентного и визуального исследования

- Дата competitor capture/review: 2026-07-15
- Дата implementation capture/review: 2026-07-16
- Browser mode: headless Chromium screenshots + text/HTML inspection where screenshots were blocked
- Assets: [`../assets/research/2026-07-15/`](../assets/research/2026-07-15/)

Этот журнал отделяет фактически просмотренное от выводов. Screenshot показывает состояние страницы только в момент capture; заявленные competitor counts не считаются числом качественных индексируемых URL.

Актуальная реализация после исследования зафиксирована отдельной матрицей и 14 full-page screenshots: [`2026-07-16-visual-implementation-review.md`](2026-07-16-visual-implementation-review.md).

## 1. Calculandia

| Surface           | URL/source                                   | Viewport | Evidence                                                                                 | Подтверждено                                                         |
| ----------------- | -------------------------------------------- | -------: | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Публичный домен   | `https://calculandia.ru/`                    |  desktop | [`live-fastpanel-desktop.png`](../assets/research/2026-07-15/live-fastpanel-desktop.png) | FastPanel parking page; приложение не опубликовано                   |
| Локальная главная | temporary PostgreSQL seed + `localhost:3212` | 1440×900 | [`local-home-1440.png`](../assets/research/2026-07-15/local-home-1440.png)               | 2 категории, 5 cards, нет поиска/trust content                       |
| Локальная главная | то же                                        |  390×844 | [`local-home-390.png`](../assets/research/2026-07-15/local-home-390.png)                 | Stack cards, mobile nav минимальна                                   |
| Ипотека           | `/calculator/mortgage`                       | 1366×768 | [`local-mortgage-1366.png`](../assets/research/2026-07-15/local-mortgage-1366.png)       | Placeholders вместо defaults, result empty до ввода, широкий sidebar |
| Дни               | `/calculator/days`                           |  390×844 | [`local-days-390.png`](../assets/research/2026-07-15/local-days-390.png)                 | Длинная форма, browser date format, неверное обещание holidays РФ    |
| Проценты          | `/calculator/percent-diff`                   |  390×844 | [`local-percent-390.png`](../assets/research/2026-07-15/local-percent-390.png)           | Реклама/режимы отодвигают поля и result ниже первого экрана          |

Дополнительно просмотрены без сохранения в selected asset set: 360×800, 768×1024 и 1440×900 variants. Они перечислены в исходном research report; selected assets сохраняют ключевые различия.

## 2. Визуально проверенные competitor pages

| Сайт/page               | URL                                                           | Desktop/mobile evidence                                                                                                                                | Проверенные блоки                                          | Наблюдение                                                                |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Calcup, date difference | `https://calcup.ru/datetime/date-diff`                        | [`desktop`](../assets/research/2026-07-15/calcup-date-desktop.png), [`mobile`](../assets/research/2026-07-15/calcup-date-mobile.png)                   | nav/sidebar, H1, inputs, result, formula/content, related  | Task-first: inputs/result высоко; sidebar скрывается на mobile            |
| Calculatorov, percent   | `https://calculatorov.ru/poschitat-procent-ot-chisla-onlayn/` | [`desktop`](../assets/research/2026-07-15/calculatorov-percent-desktop.png), [`mobile`](../assets/research/2026-07-15/calculatorov-percent-mobile.png) | intro, ads, form, modes, content                           | Rich anatomy, но крупные ads до utility                                   |
| JustCalc, mortgage      | `https://www.justcalc.ru/calculators/ipoteka-calculator`      | [`desktop`](../assets/research/2026-07-15/justcalc-mortgage-desktop.png), [`mobile`](../assets/research/2026-07-15/justcalc-mortgage-mobile.png)       | freshness, form, sliders, examples, result                 | Clean trust signals; mobile form слишком длинная                          |
| Calcal, mortgage        | `https://calcal.ru/mortgage-calculator`                       | [`desktop`](../assets/research/2026-07-15/calcal-mortgage-desktop.png), [`mobile`](../assets/research/2026-07-15/calcal-mortgage-mobile.png)           | author/reviewer, source/version, form/result, actions, ads | Strong identity/explainability; metadata/actions push tool down on mobile |

## 3. Контентно проверенные сайты и taxonomy inventory

| Сайт            | Home/catalog URL           |                     Заявлено | Наблюдаемые верхние категории                                                                                                              | Примеры явно найденных инструментов               | Visual access                                                                 |
| --------------- | -------------------------- | ---------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| All-Calculators | `https://all-calcs.ru/`    |                     101 / 11 | строительство, финансы, бизнес, здоровье, быт, конвертеры, математика, авто, спорт, экология, физика                                       | ипотека, бетон, ИМТ, НДС, расход топлива          | Browser capture нестабилен; HTML/text checked                                 |
| MoyCalc         | `https://moycalc.ru/`      |                     414 / 14 | финансы, строительство, бизнес, здоровье, математика, авто, быт, электричество, инструменты, конвертеры, кулинария, образование, дата, сад | НДС live demo, ипотека, строительные и date tools | Browser connection closed; HTML/text checked                                  |
| Calcup          | `https://calcup.ru/`       |                    ~300 / 16 | finance/date/math/converters и другие hubs                                                                                                 | date difference, mortgage, percentage/tools       | Visual checked                                                                |
| AllCalc         | `https://allcalc.ru/`      | большой исторический каталог | крупная многоуровневая taxonomy                                                                                                            | advanced modes, history/share                     | Bot verification; capture фиксировал block/error, выводы только content layer |
| Calculatorov    | `https://calculatorov.ru/` |                    2792 / 15 | broad consumer categories                                                                                                                  | percent, mortgage, date, construction             | Visual checked                                                                |
| JustCalc        | `https://www.justcalc.ru/` |                         100+ | налоги физлиц/бизнеса, финансы, здоровье, строительство и др.                                                                              | mortgage, Russia-2026 focused tools               | Visual checked                                                                |
| Calcal          | `https://calcal.ru/`       |                         1402 | categories/subcategories/hubs                                                                                                              | mortgage, finance/math/date tools                 | Visual checked                                                                |
| WPCalc          | `https://wpcalc.com/`      |                         ~520 | broad taxonomy                                                                                                                             | catalog visible behind consent                    | Full-screen consent blocked product                                           |
| CalcBee         | `https://calcbee.com/`     |                   7000+ / 31 | international broad taxonomy                                                                                                               | mass calculator catalog                           | Full-screen consent blocked product                                           |

Полный список сотен URL не извлекался и не заявляется: это отдельная crawl dataset задача с robots/rate constraints. Для launch decision использованы category recurrence, sampled page anatomy и SERP intent checks, а не заявленное количество страниц.

## 4. SERP intent checks

| Query                                           | Sample results, checked 2026-07-15                                                   | Evidence/result                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `калькулятор процентов онлайн процент от числа` | `rg.ru/post/kalkulyator-procentov.html`, `percentcalculator.ru`                      | Broad percentage page допускает близкие percentage modes             |
| `калькулятор процентной разницы между числами`  | `calculatorov.ru/kalkulyator-raznicy-v-procentah/`                                   | Difference/change имеет самостоятельный intent и formula explanation |
| `калькулятор дней между датами`                 | `date-difference.ru`, `date-calc.online/ru`, `dayspedia.com/datecalculator/?lang=ru` | Устойчивая самостоятельная задача                                    |
| `прибавить дни к дате калькулятор`              | `calculat.io/ru/date/count-day`, `datetoday.info/ru/add-days-to-date`                | Отдельный intent; целесообразен отдельный URL/короткая форма         |

Wordstat exact frequencies не получены: доступный контур не имел аутентифицированного export. Поэтому документы не приписывают точные частоты; manifest является осознанным product decision с прозрачной evidence boundary.

## 5. Page anatomy matrix

| Block                | Calculandia baseline       | Calcup          | Calculatorov        | JustCalc           | Calcal               | Launch requirement    |
| -------------------- | -------------------------- | --------------- | ------------------- | ------------------ | -------------------- | --------------------- |
| Search               | Нет                        | Да              | Да                  | Ограниченно        | Да                   | Да, registry combobox |
| Default valid result | Часто нет                  | Да/быстро       | После form          | После длинной form | Split panel          | Да                    |
| Formula/example      | Только 1 страница частично | Да              | Да                  | Да                 | Да                   | Да                    |
| Sources/review date  | Нет                        | Есть            | Updated date        | Есть               | Сильно выражены      | Обязательны           |
| Related tools        | Слабые footer links        | Да              | Да                  | Да                 | Да                   | 3–6 task-related      |
| Ads before result    | Есть на percent            | Нет/умеренно    | Да, существенно     | Не доминируют      | Встречаются          | Запрещены launch      |
| Mobile parity        | Частично                   | Хорошая         | Utility pushed down | Long form          | Metadata pushes down | Полная parity         |
| Save/share state     | Нет                        | Favorites/share | Разное              | Разное             | PDF/share/embed      | Fragment copy link    |

## 6. Asset integrity

SHA-256 selected assets:

```text
3df09c9e2d7b012a9aa99c550e7a744699375574778e66d85161352e12e67eb4  calcal-mortgage-desktop.png
a01b212e18554205745ba02834359d22ed51451f90c80e8945ade05294384c3a  calcal-mortgage-mobile.png
3f7f5cbe57b130dfea9781b835ebb39490b85888399b17bd47cce4dbb19891c6  calculatorov-percent-desktop.png
228d3de2fe4ec279ddb854a341af5bc4800738c53015c5e2467cfa7b27c86cfb  calculatorov-percent-mobile.png
f7c709f5908b6407aaad450b50d309ea7eef6cf1c8c3b7b48d88db20807af6e8  calcup-date-desktop.png
8e23b4558e2887625181ea404405af6e9f6578df26e0758b03d96ca6da3c2c49  calcup-date-mobile.png
1ea423ca541476623c7f0d7aeba3ba07652d1797cabad9d72c7ded957054f9b5  justcalc-mortgage-desktop.png
3cc2901bd50033273b71d7dcabb51be8cc95b6f9da6c7eb4171990393a0e294a  justcalc-mortgage-mobile.png
fb783d80bae080ec9302cff9b1733d920d7e1b095a6e94736d9b8bf50c789cf6  live-fastpanel-desktop.png
e31794b4f74ab4a0bb3c5b2629e3f44aa9306afece7df921c6949451d1bb3411  local-days-390.png
a2365c677e566d4e47f2bf39212828b2447eb9a8786ac2a29bc2ce6221c1c9fa  local-home-1440.png
71bbb2247c7f2a6ccd9587d0dee58937a50f188b7b3eae9f7aacbd12d92b4d32  local-home-390.png
2583672a4bcb6675a967000a7d33d20c7cd888463de6b63094cc081d13163c14  local-mortgage-1366.png
13168976b6a576fc93adb60cb463f61e9809f8768109d62d6bb42f4a8ee7dc77  local-percent-390.png
```
