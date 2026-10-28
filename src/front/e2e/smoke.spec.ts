import { expect, test, type Page } from "@playwright/test";

async function openLibrary(page: Page) {
  await page.goto("/books");
  await expect(page).toHaveURL(/\/books/);
  await expect(page.getByRole("heading", { name: "단어장", exact: true })).toBeVisible();
}

async function expandFolder(page: Page, name: string) {
  const row = page.locator('button[aria-expanded]').filter({ hasText: name }).first();
  await expect(row).toBeVisible();
  if (await row.getAttribute("aria-expanded") === "false") await row.click();
}

test("app, HTML seed and private data APIs open without login", async ({ page, request }) => {
  await openLibrary(page);
  for (const path of ["/api/bootstrap", "/api/books", "/api/search?q=学&scope=words", "/api/stats/overview", "/api/study/cards?books=html-n1-yuui-79-84&limit=10"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  const htmlCards = await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&limit=300")).json() as { cards: unknown[]; totalMatches: number };
  expect(htmlCards.cards).toHaveLength(268);
  expect(htmlCards.totalMatches).toBe(268);
  expect((await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&minStar=2&countOnly=true")).json()).totalMatches).toBe(31);
  expect((await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&chunk=1&countOnly=true")).json()).totalMatches).toBe(50);
  expect((await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&chunk=6&countOnly=true")).json()).totalMatches).toBe(18);
  expect((await request.get("/data/collections.json")).status()).toBe(404);
  expect((await request.get("/flashcard-template.html")).status()).toBe(404);
});

test("dark metadata, icons, accessibility and layout hold on every required viewport", async ({ page, request }, testInfo) => {
  await openLibrary(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('link[rel="icon"][type="image/png"][sizes="16x16"]')).toHaveAttribute("href", "/icons/icon-16x16.png");
  await expect(page.locator('link[rel="icon"][type="image/png"][sizes="32x32"]')).toHaveAttribute("href", "/icons/icon-32x32.png");
  await expect(page.locator('link[rel="apple-touch-icon"][sizes="180x180"]')).toHaveAttribute("href", "/icons/apple-touch-icon-180x180.png");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0f1218");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(15, 18, 24)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const bottomNavigation = await page.getByRole("navigation", { name: "주요 메뉴" }).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { position: getComputedStyle(element).position, bottomGap: window.innerHeight - rect.bottom };
  });
  expect(bottomNavigation.position).toBe("fixed");
  expect(Math.abs(bottomNavigation.bottomGap)).toBeLessThan(1);
  await expect(page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name: "통계" })).toHaveCount(0);
  const unnamed = await page.locator("button, input, select, a").evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || element.getAttribute("aria-label") === "Open Next.js Dev Tools") return false;
    if (element instanceof HTMLInputElement && element.labels?.length) return false;
    return !(element.textContent?.trim() || element.getAttribute("aria-label") || element.getAttribute("title"));
  }).length);
  expect(unnamed).toBe(0);
  const undersizedControls = await page.locator("button, input, select").evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.height < 44 && element.getAttribute("aria-label") !== "Open Next.js Dev Tools";
  }).length);
  expect(undersizedControls).toBe(0);
  if (testInfo.project.name !== "desktop-1280") return;

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json() as { start_url: string; display: string; background_color: string; theme_color: string; icons: Array<{ src: string; sizes: string }> };
  expect(manifest).toMatchObject({ start_url: "/books", display: "standalone", background_color: "#0f1218", theme_color: "#0f1218" });
  expect(new Set(manifest.icons.map((icon) => icon.sizes))).toEqual(new Set(["any", "16x16", "32x32", "180x180", "192x192", "512x512"]));
  for (const [iconPath, size] of [["/icons/icon-16x16.png", 16], ["/icons/icon-32x32.png", 32], ["/icons/apple-touch-icon-180x180.png", 180], ["/icons/icon-192x192.png", 192], ["/icons/icon-512x512.png", 512]] as const) {
    const response = await request.get(iconPath);
    expect(response.status(), iconPath).toBe(200);
    const bytes = Buffer.from(await response.body());
    expect(bytes.readUInt32BE(16), iconPath).toBe(size);
    expect(bytes.readUInt32BE(20), iconPath).toBe(size);
  }
});

test("one book tap starts flashcards while its menu keeps details available", async ({ page }) => {
  await openLibrary(page);
  const search = page.getByPlaceholder("폴더·세트 검색...");
  await search.fill("N1 유의표현");
  const directStudy = page.getByRole("link", { name: "N1 유의표현 예상 어휘 79–84 바로 학습" });
  await expect(directStudy).toBeVisible();
  await directStudy.click();
  await expect(page).toHaveURL(/\/study\?books=html-n1-yuui-79-84&start=1/);
  await expect(page.getByRole("heading", { name: "暗示" })).toBeVisible();
  await expect(page.getByText("1 / 20", { exact: true })).toBeVisible();
  const readingField = page.getByRole("group", { name: "히라가나 텍스트 필드" });
  const meaningField = page.getByRole("group", { name: "한국어 뜻 텍스트 필드" });
  const hintLayout = async () => page.locator("h1, [aria-label='히라가나 텍스트 필드'], [aria-label='한국어 뜻 텍스트 필드']").evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
  }));
  const hiddenLayout = await hintLayout();
  await page.getByRole("button", { name: /ひらがな/ }).click();
  await expect(readingField.getByText("あんじ", { exact: true })).toBeVisible();
  expect(await hintLayout()).toEqual(hiddenLayout);
  await page.getByRole("button", { name: /한국어/ }).click();
  await expect(meaningField.getByText("암시", { exact: true })).toBeVisible();
  expect(await hintLayout()).toEqual(hiddenLayout);
  await page.getByRole("button", { name: "학습 중단" }).click();

  await openLibrary(page);
  await search.fill("한끝");
  await page.getByRole("link", { name: /한끝 단어장1.*통계/ }).first().click();
  await expect(page).toHaveURL(/\/stats\?bookId=session-013/);
  await expect(page.getByLabel("통계 범위")).toHaveValue("book:session-013");

  await openLibrary(page);
  await search.fill("한끝");
  const menu = page.getByRole("button", { name: /한끝 단어장1.*메뉴/ }).first();
  await expect(menu).toBeVisible();
  await menu.click();
  await page.getByRole("link", { name: "단어 목록·편집" }).click();
  await expect(page).toHaveURL(/\/books\/session-013/);
  await expect(page.getByRole("heading", { level: 1, name: /한끝 단어장1/ })).toBeVisible();
  await expect(page.locator("ol button").first()).toBeVisible();
  await page.locator("ol button").first().click();
  await expect(page.getByRole("heading", { name: "단어 편집" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/settings");
  await expect(page.getByText("로그인 없이 바로 사용합니다.")).toBeVisible();
  await page.goto("/login");
  await expect(page).toHaveURL(/\/books/);
});

test("folder tree pin, creation, move and reload persist", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "mutation journey runs once");
  await openLibrary(page);
  const forbidden = await request.post("/api/sync/mutations", { headers: { Origin: "https://evil.example" }, data: { deviceId: "e2e", mutations: [] } });
  expect(forbidden.status()).toBe(403);
  await page.getByRole("button", { name: "추가" }).click();
  await page.getByRole("tab", { name: /폴더/ }).click();
  await page.getByLabel("폴더 이름").fill("E2E 폴더");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText(/폴더를 저장했습니다/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("E2E 폴더", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "E2E 폴더 고정" }).click();
  await expect(page.getByRole("heading", { name: "고정" })).toBeVisible();

  await page.getByRole("button", { name: "추가" }).click();
  await page.getByRole("tab", { name: /폴더/ }).click();
  await page.getByLabel("폴더 이름").fill("E2E 하위");
  await page.getByLabel("위치").selectOption({ label: "E2E 폴더" });
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText(/폴더를 저장했습니다/)).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "추가" }).click();
  await page.getByRole("tab", { name: /세트/ }).click();
  await page.getByLabel("세트 제목").fill("E2E 이동 세트");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText(/세트를 저장했습니다/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("E2E 이동 세트", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "E2E 이동 세트 메뉴" }).click();
  await page.getByLabel("위치").selectOption({ label: "E2E 하위" });
  await page.getByRole("button", { name: "변경 저장" }).click();
  await expandFolder(page, "E2E 폴더");
  await expandFolder(page, "E2E 하위");
  await expect(page.getByText("E2E 이동 세트", { exact: true })).toBeVisible({ timeout: 15_000 });
  const expandDuration = await page.evaluate(() => performance.getEntriesByName("library-expand").at(-1)?.duration || 0);
  expect(expandDuration).toBeLessThan(100);
  await page.reload();
  await expect(page.getByText("E2E 이동 세트", { exact: true })).toBeVisible();
});

test("entry edits propagate to SQL search and the two independent hints", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "mutation journey runs once");
  await page.goto("/books/session-013");
  await page.locator("ol button").first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("읽기", { exact: true }).fill("e2e-よみ");
  await dialog.getByLabel("뜻 (한 줄에 하나)").fill("E2E 편집 뜻");
  await dialog.getByLabel("대표 뜻").fill("E2E 편집 뜻");
  await dialog.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("button", { name: "동기화됨" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/search?q=E2E%20편집%20뜻&scope=words");
  await expect(page.getByText("E2E 편집 뜻", { exact: true })).toBeVisible();
  await page.goto("/study?books=session-013");
  await page.getByRole("button", { name: /새 학습 시작/ }).click();
  await page.getByRole("button", { name: /ひらがな/ }).click();
  await expect(page.getByText("e2e-よみ", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E 편집 뜻", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: /한국어/ }).click();
  await expect(page.getByText("E2E 편집 뜻", { exact: true })).toBeVisible();
  const hintDuration = await page.evaluate(() => performance.getEntriesByName("study-hint-meaning").at(-1)?.duration || 0);
  expect(hintDuration).toBeLessThan(100);
  await page.getByRole("button", { name: "학습 중단" }).click();
});

test("HTML flashcards support score-without-reveal, bookmark, loop, keys and durable resume", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "study journey runs once");
  await page.goto("/study?books=html-n1-yuui-79-84");
  await page.getByRole("button", { name: /새 학습 시작/ }).click();
  await expect(page.getByText("1 / 20", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "暗示" })).toBeVisible();
  await page.keyboard.press("b");
  await expect(page.getByRole("button", { name: "북마크 해제" })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => (await (await fetch("/api/study/cards?books=html-n1-yuui-79-84&bookmarks=true&countOnly=true")).json()).totalMatches as number), { timeout: 15_000 }).toBeGreaterThan(0);
  await page.getByRole("button", { name: "모르는 카드 반복" }).click();
  await expect(page.getByRole("button", { name: "모르는 카드 반복" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("a");
  await expect(page.getByRole("heading", { name: "一蹴" })).toBeVisible();
  const transitionDuration = await page.evaluate(() => performance.getEntriesByName("study-card-transition").at(-1)?.duration || 0);
  expect(transitionDuration).toBeLessThan(200);
  await page.getByRole("button", { name: "학습 중단" }).click();
  await expect(page.getByText("이어서 학습")).toBeVisible();
  await page.getByText("이어서 학습").click();
  await expect(page.getByRole("heading", { name: "一蹴" })).toBeVisible();
});

test("CSV import, JSON export, stats and no-overflow remain available", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "import journey runs once");
  await openLibrary(page);
  await page.getByRole("button", { name: "추가" }).click();
  await page.getByRole("tab", { name: /가져오기/ }).click();
  await page.getByLabel("CSV 또는 JSON 파일").setInputFiles({ name: "e2e-import.csv", mimeType: "text/csv", buffer: Buffer.from("term,reading,meanings,tags\n試験語,しけんご,시험용 단어,e2e\n") });
  await page.getByRole("button", { name: "파일 검사" }).click();
  await expect(page.getByText(/총 1행 · 정상 1 · 오류 0/)).toBeVisible();
  await page.getByLabel("세트 제목").fill("E2E CSV 세트");
  await page.getByRole("button", { name: "가져오기 확정" }).click();
  await expect(page.getByText("1개 단어를 가져왔습니다.")).toBeVisible();
  await page.getByRole("link", { name: "가져온 세트 열기" }).click();
  await page.getByText("세트 작업").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "JSON" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.json$/);
  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "통계" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("a second browser receives one synced evaluation", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "multi-device journey runs once");
  const contextA = await browser.newContext(); const contextB = await browser.newContext();
  const pageA = await contextA.newPage(); const pageB = await contextB.newPage();
  try {
    await openLibrary(pageA); await openLibrary(pageB);
    const count = (page: Page) => page.evaluate(async () => {
      const today = new Date(Date.now() + 9 * 60 * 60 * 1_000).toISOString().slice(0, 10);
      return (await (await fetch("/api/stats/overview?from=2026-01-01&to=" + today)).json()).totalReviewEvents as number;
    });
    const before = await count(pageB);
    await pageA.goto("/study?books=session-014");
    await pageA.getByRole("button", { name: /새 학습 시작/ }).click();
    await pageA.getByRole("button", { name: /알고있음/ }).click();
    await pageA.getByRole("button", { name: "학습 중단" }).click();
    await pageB.reload();
    await expect.poll(() => count(pageB), { timeout: 15_000 }).toBe(before + 1);
  } finally { await contextA.close(); await contextB.close(); }
});

test("an offline evaluation survives reload and syncs exactly once", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "offline journey runs once");
  const context = await browser.newContext(); const page = await context.newPage();
  try {
    await openLibrary(page);
    const count = () => page.evaluate(async () => {
      const today = new Date(Date.now() + 9 * 60 * 60 * 1_000).toISOString().slice(0, 10);
      return (await (await fetch("/api/stats/overview?from=2026-01-01&to=" + today)).json()).totalReviewEvents as number;
    });
    const before = await count();
    await page.goto("/study?books=session-015");
    await page.getByRole("button", { name: /새 학습 시작/ }).click();
    await context.setOffline(true);
    await page.getByRole("button", { name: /공부하겠음/ }).click();
    await expect(page.getByText("2 / 20", { exact: true })).toBeVisible();
    await context.setOffline(false);
    await page.goto("/stats");
    await expect.poll(count, { timeout: 20_000 }).toBe(before + 1);
    await page.waitForTimeout(1_000);
    expect(await count()).toBe(before + 1);
  } finally { await context.close(); }
});

test("login APIs remain removed", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "security journey runs once");
  expect((await request.post("/api/auth/login", { data: {} })).status()).toBe(404);
  expect((await request.post("/api/auth/logout")).status()).toBe(404);
  expect((await request.get("/api/me")).status()).toBe(404);
});
