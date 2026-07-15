# Визуальная проверка реализации

- Дата: 2026-07-16
- Build: production standalone от текущего review tree; окончательный release SHA фиксируется в production evidence
- Screenshots: headless Chromium (системный Google Chrome); functional matrix: Chromium, Firefox и WebKit
- Полные снимки: [`../assets/research/2026-07-16/`](../assets/research/2026-07-16/)
- Целостность evidence: [`SHA256SUMS`](../assets/research/2026-07-16/SHA256SUMS)

## Покрытие

| Surface                              | Viewports                              | Evidence                                                                                                                                                                                                                                          |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Главная                              | 390×844, 768×1024, 1366×768, 1920×1080 | [`mobile`](../assets/research/2026-07-16/home-390x844.png), [`tablet`](../assets/research/2026-07-16/home-768x1024.png), [`desktop`](../assets/research/2026-07-16/home-1366x768.png), [`wide`](../assets/research/2026-07-16/home-1920x1080.png) |
| Каталог                              | 390×844, 1366×768                      | [`mobile`](../assets/research/2026-07-16/catalog-390x844.png), [`desktop`](../assets/research/2026-07-16/catalog-1366x768.png)                                                                                                                    |
| Категория «Финансы»                  | 390×844, 1366×768                      | [`mobile`](../assets/research/2026-07-16/finance-390x844.png), [`desktop`](../assets/research/2026-07-16/finance-1366x768.png)                                                                                                                    |
| Короткий калькулятор процентов       | 390×844, 1366×768                      | [`mobile`](../assets/research/2026-07-16/percent-390x844.png), [`desktop`](../assets/research/2026-07-16/percent-1366x768.png)                                                                                                                    |
| Финансовый калькулятор с графиком    | 390×844, 1366×768                      | [`mobile`](../assets/research/2026-07-16/mortgage-390x844.png), [`desktop`](../assets/research/2026-07-16/mortgage-1366x768.png)                                                                                                                  |
| Строительная форма высокой плотности | 390×844, 1366×768                      | [`mobile`](../assets/research/2026-07-16/wallpaper-390x844.png), [`desktop`](../assets/research/2026-07-16/wallpaper-1366x768.png)                                                                                                                |

## Зафиксированные выводы

- На 390 px функциональность не урезана: форма идёт перед результатом, затем explanation/source/related; page-level horizontal scroll отсутствует по автоматической проверке всех 14 URL.
- На desktop короткая форма и основной результат одновременно находятся в первом рабочем блоке; длинный контент отделён визуально и не мешает расчёту.
- Главная сохраняет task-first hierarchy на четырёх ширинах: обещание → поиск → категории → частые задачи → trust.
- Каталог и category hub отличаются по intent и тексту, а не являются дублирующими сетками карточек.
- Финансовый график закрыт по умолчанию, создаётся после раскрытия, имеет именованный focusable scroll-region; на mobile колонки не удаляются.
- Для длинной строительной формы единицы находятся рядом с полями, запас и монтажный припуск видимы, результат округления и ограничения следуют сразу после формы.

## Связанные автоматические доказательства

- Playwright: 75 passed / 6 intentional browser-specific skips из 81 project case — 14 canonical pages на 360×800, mobile overflow, metadata/schema/axe WCAG 2/2.1/2.2 A+AA, redirects, security headers, keyboard search/menu, share restore, schedule focus, sitemap crawl и 404 contract.
- axe-core: 0 critical/serious на всех 14 calculator pages в мобильном smoke.
- Дополнительный UX-review: 51 route/viewport combination на 320, 768 и 1920 px без horizontal overflow.
- Production build: 37 static/dynamic routes собраны; calculator First Load JS 124 kB, ниже бюджета 170 KiB.
- Lighthouse, median трёх запусков на URL: главная 99/100/100/100, LCP 2,037 ms, CLS 0, TBT 30 ms; калькулятор процентов 99/100/100/100, LCP 2,189 ms, CLS 0, TBT 33 ms.

Снимки и автоматизированный browser matrix являются evidence, но не заменяют ручной VoiceOver/NVDA и полевые Web Vitals; эти проверки остаются post-launch задачей наблюдения.
