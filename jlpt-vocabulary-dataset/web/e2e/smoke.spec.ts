import { expect, test } from "@playwright/test";

test("dashboard and all book cards load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /흩어진 JLPT 단어장/ })).toBeVisible();
  await expect(page.getByText("6,393")).toBeVisible();
  await page.getByRole("link", { name: /단어장 보기/ }).click();
  await expect(page.getByText("27개 중 27개 표시")).toBeVisible();
});

test("deep book route preserves expected session count", async ({ page }) => {
  await page.goto("/books/session-027/");
  await expect(page.getByRole("heading", { level: 1, name: "62개 단어 카드화 완료" })).toBeVisible();
  await expect(page.getByText("원본 순서의 단어 62개")).toBeVisible();
  await expect(page.getByText("전체 62개 중 62개")).toBeVisible();
});

test("global search renders grouped source results", async ({ page }) => {
  await page.goto("/search/");
  await page.getByRole("textbox", { name: "전체 단어 검색" }).fill("賃金");
  await expect(page.getByRole("heading", { name: "賃金", exact: true }).first()).toBeVisible();
  await expect(page.getByText(/개 고유 단어/)).toBeVisible();
});

test("mobile layout has no horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile project only");
  await page.goto("/books/");
  await expect(page.getByText("27개 중 27개 표시")).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflows).toBe(false);
});

test("unknown book serves a meaningful static 404", async ({ page }) => {
  const response = await page.goto("/books/session-999/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible();
});

test("study requires reveal, persists a rating and resumes its order", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop functional path");
  await page.goto("/study/?books=session-027");
  await page.getByRole("button", { name: /학습 시작/ }).click();
  await expect(page.getByText("1 / 20")).toBeVisible();
  await expect(page.getByRole("button", { name: /알겠음/ })).toBeDisabled();
  await page.getByRole("button", { name: /정답 보기/ }).click();
  await page.getByRole("button", { name: /알겠음/ }).click();
  await expect(page.getByText("2 / 20")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("jlpt-vocab:progress:v1") ?? "null") as { records: Record<string, unknown> } | null);
  expect(Object.keys(saved?.records ?? {})).toHaveLength(1);
  await page.reload();
  await page.getByRole("button", { name: /이어서 학습/ }).click();
  await expect(page.getByText("2 / 20")).toBeVisible();
});

test("settings resets only app data and validates an import preview", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop functional path");
  const backup = {
    schemaVersion: 1,
    updatedAt: "2026-10-28T00:00:00.000Z",
    records: {
      "word-000000000001": { wordId: "word-000000000001", repetitions: 1, intervalDays: 1, easeFactor: 2.5, dueAt: "2026-10-29T00:00:00.000Z", lastReviewedAt: "2026-10-28T00:00:00.000Z", lastRating: "good", lapses: 0 },
    },
  };
  await page.goto("/settings/");
  await page.evaluate((value) => { localStorage.setItem("other-app", "keep"); localStorage.setItem("jlpt-vocab:progress:v1", JSON.stringify(value)); }, backup);
  await page.reload();
  await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "초기화 확인" }).click();
  await page.getByRole("button", { name: /정말 삭제/ }).click();
  expect(await page.evaluate(() => localStorage.getItem("other-app"))).toBe("keep");
  expect(await page.evaluate(() => localStorage.getItem("jlpt-vocab:progress:v1"))).toBeNull();
  await page.locator('input[type="file"]').setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByText("검증 완료")).toBeVisible();
  await page.getByRole("button", { name: /이 백업으로 교체/ }).click();
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("jlpt-vocab:progress:v1") ?? "{}").records ?? {}).length)).toBe(1);
});
