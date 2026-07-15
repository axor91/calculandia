# ADR-0007: structured data страниц калькуляторов

- Статус: **Accepted**
- Дата: 2026-07-16

## Контекст

Архитектурный документ первоначально разрешал только site-level `Organization`, `WebSite` и `BreadcrumbList`. Опубликованный калькулятор является бесплатным браузерным приложением, а его название, описание и дата изменения уже видимы на странице. Требуется единый тестируемый тип без пользовательского или редакторского JSON-LD.

## Решение

Для каждого из 14 canonical calculator URL код генерирует `WebApplication` со следующими полями:

- `name`, `description` и `url` из валидированного каталога;
- `applicationCategory = CalculatorApplication`;
- `operatingSystem = Any` и требование браузера;
- бесплатный `Offer` в RUB;
- связь с `WebSite` Calculandia;
- `dateModified = contentUpdatedAt`.

`BreadcrumbList` генерируется отдельно из реально показанных breadcrumbs. Произвольный JSON-LD, `FAQPage`, review/rating и недоказанные свойства запрещены. Serializer экранирует `<`; E2E проверяет наличие обоих типов на всех 14 страницах.

## Последствия

Изменение типа или набора утверждений требует обновления ADR, видимого content и E2E. Structured data не используется как способ заявить свойства, отсутствующие на странице.
