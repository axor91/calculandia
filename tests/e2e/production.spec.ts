import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";

const calculatorRoutes = [
  "procent-ot-chisla",
  "procentnoe-izmenenie",
  "drobi",
  "proporcii",
  "ipoteka",
  "kredit",
  "vklad",
  "dosrochnoe-pogashenie",
  "dni-mezhdu-datami",
  "pribavit-k-date",
  "vozrast",
  "beton",
  "plitka",
  "oboi",
  "srednee-znachenie",
  "nod-nok",
  "kvadratnoe-uravnenie",
  "ploshchad-figur",
  "slozhnyj-procent",
  "nakopleniya",
  "refinansirovanie",
  "skidka",
  "skolko-dnej-do",
  "raznica-dat",
  "den-nedeli",
  "kalkulyator-vremeni",
  "kraska",
  "laminat",
  "kirpich",
  "shtukaturka",
] as const;

type AxeViolation = {
  id: string;
  impact: string | null;
  nodes: readonly unknown[];
};

async function seriousAxeViolations(page: Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const runtime = (
      globalThis as unknown as {
        axe: {
          run: (options: object) => Promise<{ violations: AxeViolation[] }>;
        };
      }
    ).axe;
    const result = await runtime.run({
      runOnly: {
        type: "tag",
        values: [
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22a",
          "wcag22aa",
        ],
      },
    });
    return result.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    );
  });
}

test.describe("production routes", () => {
  for (const slug of calculatorRoutes) {
    test(`${slug}: canonical metadata, schema and mobile a11y`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`/kalkulyator/${slug}`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://calculandia.ru/kalkulyator/${slug}`,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        `https://calculandia.ru/kalkulyator/${slug}`,
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /opengraph-image\.png/,
      );
      const schemaTypes = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((scripts) =>
          scripts.flatMap((script) => {
            const value = JSON.parse(script.textContent || "null") as
              { "@type"?: string } | readonly { "@type"?: string }[] | null;
            if (Array.isArray(value)) {
              return value.map((item) => item["@type"]);
            }
            return [
              (value as { "@type"?: string } | null | undefined)?.["@type"],
            ];
          }),
        );
      expect(schemaTypes).toContain("WebApplication");
      expect(schemaTypes).toContain("BreadcrumbList");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(await seriousAxeViolations(page)).toEqual([]);
    });
  }

  test("legacy routes return exact permanent redirects", async ({
    request,
  }) => {
    for (const [from, to] of [
      ["/calculator/percent-diff", "/kalkulyator/procentnoe-izmenenie"],
      ["/calculator/mortgage", "/kalkulyator/ipoteka"],
      ["/calculator/fractions", "/kalkulyator/drobi"],
      ["/calculator/days", "/kalkulyator/dni-mezhdu-datami"],
    ]) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(response.headers().location).toBe(`https://calculandia.ru${to}`);
    }
  });

  test("application responses retain the security-header contract", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });
});

test("search and mobile navigation preserve keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Найти калькулятор" });
  await search.focus();
  await search.fill("ипотека");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/kalkulyator\/ipoteka$/);

  await page.goto("/");
  const menu = page.getByRole("button", { name: "Открыть меню" });
  await menu.click();
  await expect(
    page.getByRole("navigation", { name: "Мобильная навигация" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "Мобильная навигация" }),
  ).toHaveCount(0);
  await expect(menu).toBeFocused();
});

for (const [name, path] of [
  ["home", "/"],
  ["catalog", "/kalkulyatory"],
  ["category", "/kalkulyatory/finansy"],
  ["methodology", "/metodologiya"],
] as const) {
  test(`${name} shell is axe-clean without overflow on mobile and desktop`, async ({
    page,
  }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(await seriousAxeViolations(page)).toEqual([]);
    }
  });
}

test("changed primary result is announced without invalidating unrelated fields", async ({
  page,
}) => {
  await page.goto("/kalkulyator/procent-ot-chisla");
  await expect(page.locator('[data-calculator-ready="true"]')).toBeVisible();
  await page.getByLabel("Число").fill("2500");
  await expect(
    page
      .locator('[role="status"][aria-live="polite"]')
      .filter({ hasText: "Результат расчёта" }),
  ).toContainText("375");

  await page.getByLabel("Число").fill("oops");
  await expect(page.locator('form [role="alert"]')).toBeVisible();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
});

test("finance share link restores the same submitted result", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Clipboard permission control is covered in Chromium",
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/kalkulyator/kredit");
  const amount = page.getByLabel("Сумма кредита");
  const resultPanel = page.getByRole("region", { name: "Результат расчёта" });
  const before = await resultPanel.innerText();
  await amount.fill("900000");
  await expect(page.getByText(/Поля изменены/)).toBeVisible();
  await page.getByRole("button", { name: "Поделиться расчётом" }).click();
  await expect.poll(() => page.url()).toContain("#calc=kredit");
  await expect.poll(() => resultPanel.innerText()).not.toBe(before);
  const sharedResult = await resultPanel.innerText();
  await page.reload();
  await expect(amount).toHaveValue("900000");
  await expect.poll(() => resultPanel.innerText()).toBe(sharedResult);
});

test("wide payment schedule is keyboard-scrollable and axe-clean", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kalkulyator/ipoteka");
  await page.getByText(/График платежей ·/).click();
  const region = page.getByRole("region", {
    name: /График платежей: прокручиваемая таблица/,
  });
  await expect(region).toBeVisible();
  await region.focus();
  await expect(region).toBeFocused();
  expect(await seriousAxeViolations(page)).toEqual([]);
});

test("quality-contract totals are visible in financial and construction results", async ({
  page,
}) => {
  await page.goto("/kalkulyator/dosrochnoe-pogashenie");
  await expect(page.getByText("Проценты без досрочного")).toBeVisible();
  await expect(page.getByText("Проценты при сокращении срока")).toBeVisible();
  await expect(page.getByText("Проценты при снижении платежа")).toBeVisible();

  await page.goto("/kalkulyator/plitka");
  await expect(page.getByText("Расчётно без запаса")).toBeVisible();
  await expect(page.getByText("Полезная площадь без запаса")).toBeVisible();

  await page.goto("/kalkulyator/oboi");
  await expect(page.getByText("Расчётно без запаса")).toBeVisible();
  await expect(page.getByText("Полезная площадь без запаса")).toBeVisible();
});

test("sitemap routes and their internal links are healthy", async ({
  request,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "One HTTP crawl is sufficient");
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const sitemapXml = await sitemapResponse.text();
  const paths = [
    ...sitemapXml.matchAll(/<loc>https:\/\/calculandia\.ru([^<]*)<\/loc>/g),
  ].map((match) => match[1] || "/");
  expect(paths).toHaveLength(41);

  const internalPaths = new Set(paths);
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    for (const match of html.matchAll(/href="(\/[^"#?]*)/g)) {
      internalPaths.add(match[1] || "/");
    }
  }

  for (const path of internalPaths) {
    const response = await request.get(path);
    expect(response.status(), path).toBeLessThan(400);
  }
});

test("404 is noindex and does not canonicalize to the homepage", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "One metadata response check is sufficient",
  );
  const response = await page.goto("/net-takogo-kalkulyatora");
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
