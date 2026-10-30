import { expect, test } from "@playwright/test";

test("long words fit without scrolling and resize back for short words", async ({ page }, testInfo) => {
  const longTerm = "国際連合教育科学文化機関".repeat(20).slice(0, 200);
  const projectOrder = ["desktop-1280", "tablet-768", "mobile-320", "mobile-360", "mobile-390", "mobile-430"];
  const rangeStart = projectOrder.indexOf(testInfo.project.name) * 2;
  await page.route("**/api/study/cards?*", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.cards[rangeStart].representative.term = longTerm;
    body.cards[rangeStart].representative.reading = "こくさいれんごうきょういくかがくぶんかきかん".repeat(6);
    body.cards[rangeStart].representative.meanings = ["국제적인 교육과 과학 및 문화 분야에서 협력하는 기관이라는 뜻입니다. ".repeat(8)];
    body.cards[rangeStart].representative.nuance = "공식적인 문맥에서 쓰는 표현입니다. ".repeat(8);
    body.cards[rangeStart].representative.examples = [{ ja: "国際的な教育と文化について話し合いました。".repeat(8), ko: "국제적인 교육과 문화에 대해 의견을 나누었습니다. ".repeat(8) }];
    body.cards[rangeStart + 1].representative.term = "日本";
    await route.fulfill({ response, json: body });
  });
  await page.goto(`/study?books=html-n1-yuui-79-84&rangeStart=${rangeStart}&rangeSize=2&start=1`);
  await expect(page.locator("article h1")).toHaveText(longTerm);
  await page.getByRole("button", { name: /한국어/ }).click();
  await page.getByRole("button", { name: /ひらがな/ }).click();
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.getByTestId("study-term-slot").evaluate((slot) => {
      const text = slot.querySelector("h1")!;
      const rect = text.getBoundingClientRect();
      return slot.scrollHeight <= slot.clientHeight && slot.scrollWidth <= slot.clientWidth
        && text.scrollHeight <= slot.clientHeight && Math.abs(rect.y + rect.height / 2 - innerHeight / 2) < 1;
    })).toBe(true);
    await expect.poll(() => page.locator(".study-details").evaluate((details) => {
      const rect = details.getBoundingClientRect();
      return details.scrollHeight <= details.clientHeight
        && [...details.querySelectorAll<HTMLElement>("[data-fitted-text]")].every((text) => {
          const slot = text.parentElement!;
          const bounds = text.getBoundingClientRect();
          return slot.scrollHeight <= slot.clientHeight && slot.scrollWidth <= slot.clientWidth
            && text.scrollHeight <= slot.clientHeight && text.scrollWidth <= slot.clientWidth
            && bounds.top >= rect.top - 1 && bounds.bottom <= rect.bottom + 1;
        });
    })).toBe(true);
  }
  const smallSize = await page.locator("article h1").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  await page.getByRole("button", { name: /알고있음/ }).click();
  await expect(page.locator("article h1")).toHaveText("日本");
  const restoredSize = await page.locator("article h1").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(restoredSize).toBeGreaterThan(smallSize);
  expect(restoredSize).toBe(64);
});
