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

async function chooseAllCards(page: Page, total?: number) {
  await expect(page.getByRole("heading", { name: "학습 범위 선택" })).toBeVisible();
  if (total) await expect(page.getByText(`총 ${total}장`, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: total ? `전체 ${total}장 학습` : /전체 \d+장 학습/ }).click();
}

test("bottom navigation opens the listening workspace", async ({ page }) => {
  await page.goto("/books");
  const bottomNavigation = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(bottomNavigation.getByRole("link", { name: "학습" })).toHaveCount(0);
  const listeningLink = bottomNavigation.getByRole("link", { name: "청해" });
  await expect(listeningLink).toBeVisible();
  await listeningLink.click();
  await expect(page).toHaveURL(/\/listening$/);
  await expect(page.getByRole("heading", { name: "청해", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "모든 청해" })).toBeVisible();
  await expect(page.getByRole("button", { name: "추가", exact: true })).toBeVisible();
  await expect(listeningLink).toHaveAttribute("aria-current", "page");
});

test("settings exposes the local ChatGPT OAuth connection", async ({ page, request }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Responses API OAuth" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue with ChatGPT" })).toHaveAttribute("href", "/api/openai/oauth/start");
  const deployment = page.getByRole("region", { name: "배포 정보" });
  await expect(deployment).toContainText("e2e-main");
  await expect(deployment).toContainText("0123456789abcdef0123456789abcdef01234567");
  await expect.poll(async () => (await request.get("/api/openai/status")).json()).toMatchObject({ connected: false, canUseResponses: false });
});

test("app, HTML seed and browser data APIs open without login", async ({ page, request }, testInfo) => {
  if (testInfo.project.name === "desktop-1280") {
    await page.goto("/study");
    await expect(page).toHaveURL(/\/books$/);
    await page.goto("/due");
    await expect(page).toHaveURL(/\/study\?mode=due&start=1/);
    await expect(page.getByText("현재 복습할 단어가 없습니다.")).toBeVisible();
    await expect(page.getByText("새 학습 설정")).toHaveCount(0);
  }
  await openLibrary(page);
  const folderNames = page.locator("button[aria-expanded] span.truncate");
  const expectedFolders = ["청해", "진짜 한끝", "독해", "언지", "사설", "한끝"];
  await expect.poll(async () => (await folderNames.allTextContents()).filter((name) => expectedFolders.includes(name))).toEqual(expectedFolders);
  await expect(page.locator("button[aria-expanded]").filter({ hasText: "진짜 한끝" })).toContainText("12");
  await expect(page.locator("button[aria-expanded]").filter({ hasText: "독해" })).toContainText("4");
  await expect(page.locator("button[aria-expanded]").filter({ hasText: "언지" })).toContainText("3");
  await expect(page.locator("button[aria-expanded]").filter({ hasText: "사설" })).toContainText("6");
  await expect(page.getByRole("button", { name: "한끝 3", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "독해 폴더 바로 학습" })).toHaveAttribute("href", "/study?folder=folder-reading&start=1");
  for (const path of ["/api/bootstrap", "/api/books", "/api/search?q=学&scope=words", "/api/stats/overview", "/api/study/cards?books=html-n1-yuui-79-84&limit=10"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  const htmlCards = await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&limit=300")).json() as { cards: unknown[]; totalMatches: number };
  expect(htmlCards.cards).toHaveLength(268);
  expect(htmlCards.totalMatches).toBe(268);
  const scopedCards = await (await request.get("/api/study/cards?books=session-008&includeReview=true&limit=300")).json() as { cards: Array<{ representative: { bookId: string }; occurrences: Array<{ bookId: string }> }> };
  expect(scopedCards.cards.every((card) => card.representative.bookId === "session-008" && card.occurrences.every((occurrence) => occurrence.bookId === "session-008"))).toBe(true);
  expect((await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&minStar=2&countOnly=true")).json()).totalMatches).toBe(31);
  expect((await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&chunk=1&countOnly=true")).json()).totalMatches).toBe(50);
  expect((await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&chunk=6&countOnly=true")).json()).totalMatches).toBe(18);
  expect((await request.get("/data/collections.json")).status()).toBe(404);
  expect((await request.get("/flashcard-template.html")).status()).toBe(404);
});

test("folder flashcards keep the selected learning scope title", async ({ page }) => {
  await page.goto("/study?folder=folder-reading&rangeStart=0&rangeSize=2&start=1");
  const title = page.getByLabel("학습 범위");
  await expect(title).toHaveText("독해");
  await page.getByRole("button", { name: /알고있음/ }).click();
  await expect(title).toHaveText("독해");
});

test("flashcards show optional nuance and example translations", async ({ page }) => {
  await page.goto("/study?books=html-n1-yuui-79-84&rangeStart=6&rangeSize=1&start=1");
  await expect(page.getByRole("heading", { name: "生地" })).toBeVisible();
  await expect(page.getByText("타고난 바탕", { exact: true })).toBeVisible();
  await expect(page.getByText("뉘앙스", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/酒が入ると彼の生地が出る。/)).toBeVisible();
  const translation = page.getByText("술이 들어가면 그의 본바탕이 드러난다.", { exact: true });
  await expect(translation).toBeHidden();
  await page.getByRole("button", { name: /한국어/ }).click();
  await expect(translation).toBeVisible();
});

test("short flashcards center the word and keep details accessible below it", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/study?books=html-n1-yuui-79-84&rangeStart=6&rangeSize=1&start=1");
  await expect(page.getByRole("heading", { name: "生地" })).toBeVisible();
  const slots = page.locator("article [data-testid], article [role='group']");
  const positions = () => slots.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()));
  const before = await positions();
  const word = await page.locator("article h1").boundingBox();
  expect(Math.abs(word!.y + word!.height / 2 - 568 / 2)).toBeLessThan(1);
  await page.getByRole("button", { name: /한국어/ }).click();
  await page.getByRole("button", { name: /ひらがな/ }).click();
  expect(await positions()).toEqual(before);
  const article = page.locator("article");
  expect(await article.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  await page.locator(".study-details").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await page.locator("article h1").boundingBox()).toEqual(word);
  const example = await page.getByTestId("study-example-slot").boundingBox();
  const footer = await page.locator("footer").boundingBox();
  expect(example!.y + example!.height).toBeLessThanOrEqual(footer!.y);
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(568);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
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

test("one book tap starts flashcards while its menu keeps details available", async ({ page }, testInfo) => {
  await openLibrary(page);
  const search = page.getByPlaceholder("폴더·세트 검색...");
  await search.fill("N1 유의표현");
  const directStudy = page.getByRole("link", { name: "N1 유의표현 예상 어휘 79–84 바로 학습" });
  await expect(directStudy).toBeVisible();
  await directStudy.click();
  await expect(page).toHaveURL(/\/study\?books=html-n1-yuui-79-84&start=1/);
  await chooseAllCards(page, 268);
  await page.getByRole("button", { name: "학습 처음부터 시작" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "처음부터 시작", exact: true }).click();
  const term = page.locator("article h1");
  await expect(term).toBeVisible();
  const firstTerm = await term.textContent();
  await expect(page.getByText("1 / 268", { exact: true })).toBeVisible();
  await expect(page.getByText("새 학습 설정")).toHaveCount(0);
  await expect(page.getByText("오늘 복습 0개")).toHaveCount(0);
  const readingField = page.getByRole("group", { name: "히라가나 텍스트 필드" });
  const meaningField = page.getByRole("group", { name: "한국어 뜻 텍스트 필드" });
  const readingText = readingField.locator("span");
  const meaningText = meaningField.locator("span");
  await expect(readingText).toBeHidden();
  await expect(meaningText).toBeHidden();
  expect(await readingField.evaluate((element) => ({ border: getComputedStyle(element).borderTopWidth, background: getComputedStyle(element).backgroundColor }))).toEqual({ border: "0px", background: "rgba(0, 0, 0, 0)" });
  expect(await meaningField.evaluate((element) => ({ border: getComputedStyle(element).borderTopWidth, background: getComputedStyle(element).backgroundColor }))).toEqual({ border: "0px", background: "rgba(0, 0, 0, 0)" });
  const cardLayout = () => page.locator("[data-testid='study-term-slot'], [data-testid='study-nuance-slot'], [aria-label='히라가나 텍스트 필드'], [aria-label='한국어 뜻 텍스트 필드'], [data-testid='study-example-slot']").evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
  }));
  const hiddenLayout = await cardLayout();
  await page.getByRole("button", { name: /ひらがな/ }).click();
  await expect(readingText).toBeVisible();
  await expect(readingField).toHaveText(/\S/);
  expect(await cardLayout()).toEqual(hiddenLayout);
  await page.getByRole("button", { name: /한국어/ }).click();
  await expect(meaningText).toBeVisible();
  await expect(meaningField).toHaveText(/\S/);
  expect(await cardLayout()).toEqual(hiddenLayout);
  await page.getByRole("button", { name: /알고있음/ }).click();
  await expect(term).not.toHaveText(firstTerm || "");
  await page.getByRole("button", { name: "학습 처음부터 시작" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "취소" }).click();
  await expect(page.getByText("2 / 268", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "학습 처음부터 시작" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "처음부터 시작", exact: true }).click();
  await expect(term).toBeVisible();
  await expect(page.getByText("1 / 268", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "학습 중단" }).click();

  if (testInfo.project.name === "desktop-1280") {
    await page.goto("/study?books=html-n1-yuui-79-84&chunk=1&start=1");
    await expect(page.getByRole("heading", { name: "학습 범위 선택" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "暗示" })).toBeVisible();
    await expect(page.getByText("1 / 50", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "학습 중단" }).click();

    await page.goto("/study?books=session-045&start=1");
    await expect(page.getByRole("region", { name: "50장씩" }).getByRole("link", { name: "201–244 44장 학습" })).toBeVisible();
    await expect(page.getByRole("region", { name: "150장씩" }).getByRole("link", { name: "151–244 94장 학습" })).toBeVisible();
    await page.getByRole("link", { name: "201–244 44장 학습" }).click();
    await expect(page).toHaveURL(/\/study$/);
    await expect(page.getByText("1 / 44", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /알고있음/ }).click();
    await expect(page.getByText("2 / 44", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("2 / 44", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "학습 중단" }).click();

    await page.goto("/study?books=session-045&start=1");
    const firstFifty = page.getByRole("region", { name: "50장씩" }).getByRole("link", { name: /1–50 50장 학습/ });
    const lastFifty = page.getByRole("region", { name: "50장씩" }).getByRole("link", { name: /201–244 44장 학습/ });
    await expect(firstFifty).toContainText("미학습 0/50");
    await expect(lastFifty).toContainText("진행 1/44");
    await firstFifty.click();
    await expect(page.getByText("1 / 50", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /알고있음/ }).click();
    await expect(page.getByText("2 / 50", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "학습 중단" }).click();

    await page.goto("/study?books=session-045&start=1");
    await expect(page.getByRole("region", { name: "50장씩" }).getByRole("link", { name: /1–50 50장 학습/ })).toContainText("진행 1/50");
    const preservedLastFifty = page.getByRole("region", { name: "50장씩" }).getByRole("link", { name: /201–244 44장 학습/ });
    await expect(preservedLastFifty).toContainText("진행 1/44");
    await preservedLastFifty.click();
    await expect(page.getByText("2 / 44", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "학습 중단" }).click();
  }

  await page.goto("/study?books=session-045&start=1");
  await chooseAllCards(page, 244);
  await expect(page.getByRole("heading", { name: "暗示" })).toBeVisible();
  await expect(page.getByText("1 / 244", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "학습 중단" }).click();

  await page.goto("/study?books=session-024&start=1");
  await expect(page.getByRole("heading", { name: "학습 범위 선택" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "もはや" })).toBeVisible();
  await expect(page.getByText("1 / 32", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "학습 중단" }).click();

  await openLibrary(page);
  await search.fill("한끝");
  await expect(page.getByRole("link", { name: /한끝 단어장1.*통계/ })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "모든 단어장" }).getByRole("button", { name: "즐겨찾기" })).toHaveCount(0);
  await page.getByRole("button", { name: /한끝 단어장1.*메뉴/ }).first().click();
  const bookMenu = page.getByRole("dialog");
  await expect(bookMenu.getByRole("button", { name: "즐겨찾기" })).toBeVisible();
  await bookMenu.getByRole("link", { name: "통계" }).click();
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
  await expect(page.getByRole("heading", { name: "설정" })).toBeVisible();
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
  await page.goto("/study?books=session-013&start=1");
  await chooseAllCards(page);
  await page.getByRole("button", { name: /ひらがな/ }).click();
  await expect(page.getByText("e2e-よみ", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E 편집 뜻", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: /한국어/ }).click();
  await expect(page.getByText("E2E 편집 뜻", { exact: true })).toBeVisible();
  const hintDuration = await page.evaluate(() => performance.getEntriesByName("study-hint-meaning").at(-1)?.duration || 0);
  expect(hintDuration).toBeLessThan(100);
  await page.getByRole("button", { name: "학습 중단" }).click();
});

test("HTML flashcards restart safely and preserve review data, favorites and durable resume", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "study journey runs once");
  type ActiveSession = { id: string; status: string; wordIds: string[]; queue: string[]; results: unknown[]; position: number };
  const today = new Date(Date.now() + 9 * 60 * 60 * 1_000).toISOString().slice(0, 10);
  const reviewCount = async () => (await (await request.get("/api/stats/overview?from=2026-01-01&to=" + today)).json() as { totalReviewEvents: number }).totalReviewEvents;
  const bookmarkCount = async () => (await (await request.get("/api/study/cards?books=html-n1-yuui-79-84&bookmarks=true&countOnly=true")).json() as { totalMatches: number }).totalMatches;
  const activeSession = async () => ((await (await request.get("/api/bootstrap")).json()) as { activeSessions: ActiveSession[] }).activeSessions.find((session) => session.status === "active" && session.wordIds.length === 268);
  await page.goto("/study?books=html-n1-yuui-79-84&start=1");
  await chooseAllCards(page, 268);
  await expect(page.getByText("1 / 268", { exact: true })).toBeVisible();
  const term = page.locator("article h1");
  await expect(term).toBeVisible();
  const firstTerm = await term.textContent();
  await expect(page.getByRole("button", { name: "일본어 발음 듣기" })).toHaveCount(0);
  await expect.poll(async () => (await activeSession())?.wordIds.length, { timeout: 15_000 }).toBe(268);
  const sessionBeforeRestart = (await activeSession())!;
  const currentWordId = sessionBeforeRestart.queue[0] || sessionBeforeRestart.wordIds[sessionBeforeRestart.position];
  const bookmarksBefore = await bookmarkCount();
  const wasBookmarked = await page.getByRole("button", { name: /즐겨찾기 (추가|해제)/ }).getAttribute("aria-pressed") === "true";
  await page.keyboard.press("f");
  const bookmarksAfterToggle = bookmarksBefore + (wasBookmarked ? -1 : 1);
  await expect.poll(bookmarkCount, { timeout: 15_000 }).toBe(bookmarksAfterToggle);
  await page.getByRole("button", { name: "모르는 카드 반복" }).click();
  await expect(page.getByRole("button", { name: "모르는 카드 반복" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("a");
  await expect(term).not.toHaveText(firstTerm || "");
  const transitionDuration = await page.evaluate(() => performance.getEntriesByName("study-card-transition").at(-1)?.duration || 0);
  expect(transitionDuration).toBeLessThan(200);
  await expect.poll(reviewCount, { timeout: 15_000 }).toBeGreaterThan(0);
  const eventsBeforeRestart = await reviewCount();
  const stateBeforeRestart = ((await (await request.get("/api/bootstrap")).json()) as { reviewStates: Array<{ wordId: string; dueAt: string | null; lastRating: string | null }> }).reviewStates.find((state) => state.wordId === currentWordId);
  expect(stateBeforeRestart).toBeTruthy();

  await page.getByRole("button", { name: "학습 처음부터 시작" }).click();
  const restartDialog = page.getByRole("dialog");
  await expect(restartDialog.getByRole("heading", { name: "학습을 처음부터 시작할까요?" })).toBeVisible();
  await restartDialog.getByRole("button", { name: "취소" }).click();
  await expect(page.getByText("1 / 268", { exact: true })).toBeVisible();
  expect(await reviewCount()).toBe(eventsBeforeRestart);

  await page.getByRole("button", { name: "학습 처음부터 시작" }).click();
  await page.keyboard.press("Escape");
  await expect(restartDialog).toBeHidden();
  await expect(page.getByText("1 / 268", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /ひらがな/ }).click();
  await page.getByRole("button", { name: "학습 처음부터 시작" }).click();
  await restartDialog.getByRole("button", { name: "처음부터 시작", exact: true }).click();
  await expect(term).toBeVisible();
  await expect(page.getByText("1 / 268", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "모르는 카드 반복" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("group", { name: "히라가나 텍스트 필드" }).locator("span")).toBeHidden();
  await expect.poll(async () => (await activeSession())?.id, { timeout: 15_000 }).not.toBe(sessionBeforeRestart.id);
  const bootstrapAfterRestart = (await (await request.get("/api/bootstrap")).json()) as { activeSessions: ActiveSession[]; reviewStates: Array<{ wordId: string; dueAt: string | null; lastRating: string | null }> };
  const restartedSession = bootstrapAfterRestart.activeSessions.find((session) => session.status === "active")!;
  expect(restartedSession).toMatchObject({ results: [], position: 0 });
  expect(restartedSession.id).not.toBe(sessionBeforeRestart.id);
  expect(restartedSession.wordIds).not.toEqual(sessionBeforeRestart.wordIds);
  expect([...restartedSession.wordIds].sort()).toEqual([...sessionBeforeRestart.wordIds].sort());
  expect(bootstrapAfterRestart.reviewStates.find((state) => state.wordId === currentWordId)).toMatchObject({ dueAt: stateBeforeRestart?.dueAt, lastRating: stateBeforeRestart?.lastRating });
  expect(await bookmarkCount()).toBe(bookmarksAfterToggle);
  expect(await reviewCount()).toBe(eventsBeforeRestart);

  await page.getByRole("button", { name: /공부하겠음/ }).click();
  await expect(page.getByText("2 / 268", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "학습 중단" }).click();
  await page.goto("/study");
  await expect(page.getByText("2 / 268", { exact: true })).toBeVisible();
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
    await pageA.goto("/study?books=session-014&start=1");
    await chooseAllCards(pageA);
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
    await page.goto("/study?books=session-015&start=1");
    await chooseAllCards(page);
    await expect(page.getByRole("button", { name: /공부하겠음/ })).toBeVisible();
    await context.setOffline(true);
    await page.getByRole("button", { name: /공부하겠음/ }).click();
    await expect(page.getByText(/2 \/ \d+/, { exact: true })).toBeVisible();
    await context.setOffline(false);
    await page.goto("/stats");
    await expect.poll(count, { timeout: 20_000 }).toBe(before + 1);
    await page.waitForTimeout(1_000);
    expect(await count()).toBe(before + 1);
  } finally { await context.close(); }
});

test("app access login remains absent", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "security journey runs once");
  expect((await request.post("/api/auth/login", { data: {} })).status()).toBe(404);
  expect((await request.post("/api/auth/logout")).status()).toBe(404);
  expect((await request.get("/api/me")).status()).toBe(404);
  expect((await request.post("/api/access/login", { data: {} })).status()).toBe(404);
  expect((await request.post("/api/access/logout")).status()).toBe(404);
  expect((await request.get("/login")).status()).toBe(404);
});

test("production pages and internal APIs stay public without a session", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "public access journey runs once");
  const port = process.env.JLPT_E2E_PORT || "4174";
  const context = await browser.newContext({
    baseURL: `http://127.0.0.1:${port}`,
    extraHTTPHeaders: {},
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  try {
    expect((await context.request.get("/api/bootstrap", { maxRedirects: 0 })).status()).toBe(200);
    expect((await context.request.get("/api/openai/status", { maxRedirects: 0 })).status()).toBe(200);
    await page.goto("/listening");
    await expect(page).toHaveURL(/\/listening$/);
    await expect(page.getByRole("heading", { name: "청해", exact: true })).toBeVisible();
  } finally { await context.close(); }
});
