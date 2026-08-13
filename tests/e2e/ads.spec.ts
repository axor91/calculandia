import { expect, test } from "@playwright/test";

const AD_LOADER = "yandex.ru/ads/system/context.js";
const CONTAINER = '[id^="yandex_rtb_"]';

/**
 * Тест работает в обоих состояниях сборки и в каждом что-то утверждает.
 *
 * Сборка без блоков (штатная): на странице не должно быть ни загрузчика, ни
 * контейнеров — случайно включённая реклама видна сразу.
 *
 * Сборка с блоками (`NEXT_PUBLIC_YANDEX_RTB_CALCULATOR_TOP=R-A-…` перед
 * `npm run build`): проверяется, что вставленное сетью объявление доживает до
 * конца жизненного цикла слота. Тест падает, если контейнеру вернуть
 * `dangerouslySetInnerHTML={{ __html: "" }}`: React стирает им объявление на
 * первом же обновлении после гидрации.
 *
 * Настоящий context.js на время проверки отключается: с чужим идентификатором
 * сеть отвечает «страница отключена» и сама очищает контейнер, а проверяем мы
 * здесь поведение страницы, а не заполнение рекламой.
 */
test("рекламный слот отдан сети и не вычищается перерисовкой", async ({
  page,
}) => {
  await page.route("**/ads/system/context.js", (route) => route.abort());
  await page.goto("/kalkulyator/skidka", { waitUntil: "load" });
  const html = await page.content();
  const containers = page.locator(CONTAINER);
  const count = await containers.count();

  if (count === 0) {
    expect(html).not.toContain(AD_LOADER);
    return;
  }

  expect(html).toContain(AD_LOADER);
  const slot = containers.first();
  const containerId = await slot.getAttribute("id");
  expect(containerId).toMatch(/^yandex_rtb_R-[A-Z]-\d+-\d+$/);

  // Сеть вставляет объявление обычным DOM-узлом — повторяем это руками,
  // потому что настоящая выдача зависит от заполнения и от домена площадки.
  await page.evaluate((id) => {
    const node = document.createElement("div");
    node.dataset.testStub = "ad";
    node.style.height = "250px";
    document.getElementById(id)!.append(node);
  }, containerId!);

  // Дольше таймаута резерва: за это время слот успевает перерисоваться.
  await page.waitForTimeout(5500);
  await expect(slot.locator('[data-test-stub="ad"]')).toHaveCount(1);
});
