import { expect, test, type Page } from "@playwright/test";

const password = "E2E-only-password-2026!";
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("사용자 이름").fill("owner");
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/books/);
}

test("unauthenticated pages and APIs expose no vocabulary", async ({ page, request }) => {
  await page.goto("/books");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("한끝 단어장1")).toHaveCount(0);
  for (const path of ["/api/bootstrap", "/api/books", "/api/search?q=学&scope=words", "/api/stats/overview", "/api/imports/preview"]) {
    const response = path.endsWith("preview") ? await request.post(path) : await request.get(path);
    expect(response.status(), path).toBe(401);
  }
  expect((await request.get("/data/collections.json")).status()).toBe(404);
  expect((await request.get("/data/wordbooks/session-008.json")).status()).toBe(404);
});

test("owner login, library search, book detail, and logout", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "단어장" })).toBeVisible();
  const search = page.getByPlaceholder("폴더·세트·단어 검색...");
  await search.fill("한끝"); await search.press("Enter");
  const book = page.getByRole("link", { name: /한끝 단어장1/ }).first(); await expect(book).toBeVisible(); await book.click();
  await expect(page.getByRole("heading", { level: 1, name: /한끝 단어장1/ })).toBeVisible();
  await expect(page.locator("ol button").first()).toBeVisible(); await page.locator("ol button").first().click();
  await expect(page.getByRole("heading", { name: "단어 편집" })).toBeVisible(); await page.keyboard.press("Escape");
  await page.goto("/settings"); await page.getByRole("button", { name: /로그아웃/ }).click(); await expect(page).toHaveURL(/\/login/);
  await page.goBack(); await expect(page).toHaveURL(/\/login/);
});

test("folder creation persists and CSRF blocks headerless mutations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "mutation journey runs once");
  await login(page);
  const forbidden = await page.evaluate(async () => (await fetch("/api/sync/mutations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: "e2e", mutations: [] }) })).status);
  expect(forbidden).toBe(403);
  await page.getByRole("button", { name: "추가" }).click(); await page.getByRole("tab", { name: /폴더/ }).click();
  await page.getByLabel("폴더 이름").fill("E2E 폴더"); await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText(/폴더를 저장했습니다/)).toBeVisible(); await page.keyboard.press("Escape");
  await expect(page.getByText("E2E 폴더", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "추가" }).click(); await page.getByRole("tab", { name: /폴더/ }).click();
  await page.getByLabel("폴더 이름").fill("E2E 하위"); await page.getByLabel("위치").selectOption({ label: "E2E 폴더" }); await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText(/폴더를 저장했습니다/)).toBeVisible(); await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "추가" }).click(); await page.getByRole("tab", { name: /세트/ }).click();
  await page.getByLabel("세트 제목").fill("E2E 이동 세트"); await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText(/세트를 저장했습니다/)).toBeVisible(); await page.keyboard.press("Escape");
  const createdBook = page.getByText("E2E 이동 세트", { exact: true }); await expect(createdBook).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "E2E 이동 세트 메뉴" }).click(); await page.getByLabel("위치").selectOption({ label: "E2E 하위" }); await page.getByRole("button", { name: "변경 저장" }).click();
  await page.getByRole("link", { name: /E2E 폴더/ }).click(); await page.getByRole("link", { name: /E2E 하위/ }).click();
  await expect(page.getByText("E2E 이동 세트", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.reload(); await expect(page.getByText("E2E 이동 세트", { exact: true })).toBeVisible();
});

test("original entry edits propagate to search and study", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "mutation journey runs once");
  await login(page); await page.goto("/books/session-013");
  await page.locator("ol button").first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("읽기", { exact: true }).fill("e2e-よみ");
  await dialog.getByLabel("뜻 (한 줄에 하나)").fill("E2E 편집 뜻");
  await dialog.getByLabel("대표 뜻").fill("E2E 편집 뜻");
  await dialog.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("E2E 편집 뜻", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "동기화됨" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/search?q=E2E%20편집%20뜻&scope=words");
  await expect(page.getByText("E2E 편집 뜻", { exact: true })).toBeVisible();
  await page.goto("/study?books=session-013"); await page.getByRole("button", { name: /새 학습 시작/ }).click();
  await page.getByRole("button", { name: /정답 보기/ }).click();
  await expect(page.getByText("e2e-よみ", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E 편집 뜻", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /그만하기/ }).click();
});

test("CSV preview imports a book and JSON export downloads", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "import journey runs once");
  await login(page); await page.getByRole("button", { name: "추가" }).click(); await page.getByRole("tab", { name: /가져오기/ }).click();
  await page.getByLabel("CSV 또는 JSON 파일").setInputFiles({ name: "e2e-import.csv", mimeType: "text/csv", buffer: Buffer.from("term,reading,meanings,tags\n試験語,しけんご,시험용 단어,e2e\n") });
  await page.getByRole("button", { name: "파일 검사" }).click();
  await expect(page.getByText(/총 1행 · 정상 1 · 오류 0/)).toBeVisible();
  await page.getByLabel("세트 제목").fill("E2E CSV 세트"); await page.getByRole("button", { name: "가져오기 확정" }).click();
  await expect(page.getByText("1개 단어를 가져왔습니다.")).toBeVisible(); await page.getByRole("link", { name: "가져온 세트 열기" }).click();
  await expect(page.getByRole("heading", { name: "E2E CSV 세트" })).toBeVisible(); await expect(page.getByText("試験語", { exact: true })).toBeVisible();
  await page.getByText("세트 작업").click();
  const downloadPromise = page.waitForEvent("download"); await page.getByRole("link", { name: "JSON" }).click(); const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});

test("study requires reveal and records exactly one rating", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "study journey runs once");
  await login(page); await page.goto("/study?books=session-013");
  await page.getByRole("button", { name: /새 학습 시작/ }).click(); await expect(page.getByText("1 / 20")).toBeVisible();
  await expect(page.getByRole("button", { name: /알겠음/ })).toBeDisabled(); await page.getByRole("button", { name: /정답 보기/ }).click();
  await page.getByRole("button", { name: /알겠음/ }).click(); await expect(page.getByText("2 / 20")).toBeVisible();
  await page.getByRole("button", { name: /그만하기/ }).click(); await expect(page.getByText("이어서 학습")).toBeVisible();
  await page.getByText("이어서 학습").click(); await expect(page.getByText("2 / 20")).toBeVisible();
});

test("stats render and layout never overflows", async ({ page }) => {
  await login(page); await page.goto("/stats"); await expect(page.getByRole("heading", { name: "통계" })).toBeVisible();
  await expect(page.getByText("평가 횟수", { exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  const targets = await page.locator("button, a, input, select").evaluateAll((elements) => elements.filter((element) => { const rect = element.getBoundingClientRect(); return element.getAttribute("aria-label") !== "Open Next.js Dev Tools" && rect.width > 0 && rect.height > 0 && rect.height < 36; }).length);
  expect(targets).toBe(0);
});

test("a second browser sees a synced rating in server statistics", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "multi-device journey runs once");
  const contextA = await browser.newContext(); const contextB = await browser.newContext();
  const pageA = await contextA.newPage(); const pageB = await contextB.newPage();
  try {
    await login(pageA); await login(pageB);
    const count = (page: Page) => page.evaluate(async () => { const today = new Date(Date.now() + 9 * 60 * 60 * 1_000).toISOString().slice(0, 10); return (await (await fetch(`/api/stats/overview?from=2026-01-01&to=${today}`)).json()).totalReviewEvents as number; });
    const before = await count(pageB);
    await pageA.goto("/study?books=session-014"); await pageA.getByRole("button", { name: /새 학습 시작/ }).click(); await pageA.getByRole("button", { name: /정답 보기/ }).click(); await pageA.getByRole("button", { name: /쉬움/ }).click();
    await expect(pageA.getByRole("button", { name: "동기화됨" })).toBeVisible({ timeout: 15_000 });
    await pageB.reload(); await expect.poll(() => count(pageB), { timeout: 15_000 }).toBe(before + 1);
  } finally { await contextA.close(); await contextB.close(); }
});

test("an offline rating survives reload and syncs exactly once", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "offline journey runs once");
  const context = await browser.newContext(); const page = await context.newPage();
  try {
    await login(page);
    const count = () => page.evaluate(async () => { const today = new Date(Date.now() + 9 * 60 * 60 * 1_000).toISOString().slice(0, 10); return (await (await fetch(`/api/stats/overview?from=2026-01-01&to=${today}`)).json()).totalReviewEvents as number; });
    const before = await count();
    await page.goto("/study?books=session-015"); await page.getByRole("button", { name: /새 학습 시작/ }).click(); await page.getByRole("button", { name: /정답 보기/ }).click();
    await context.setOffline(true); await page.getByRole("button", { name: /어려움/ }).click(); await expect(page.getByText("2 / 20")).toBeVisible();
    await page.reload().catch(() => undefined); await context.setOffline(false); await page.goto("/stats");
    await expect.poll(count, { timeout: 20_000 }).toBe(before + 1);
    await page.waitForTimeout(1_000); expect(await count()).toBe(before + 1);
  } finally { await context.close(); }
});

test("login cookie flags, origin checks, and brute force rate limit", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "security journey runs once");
  const crossOrigin = await request.post("/api/auth/login", { headers: { Origin: "https://evil.example" }, data: { username: "owner", password } });
  expect(crossOrigin.status()).toBe(403);
  const success = await request.post("/api/auth/login", { headers: { Origin: "http://127.0.0.1:4173" }, data: { username: "owner", password } });
  expect(success.status()).toBe(200);
  const cookie = success.headers()["set-cookie"];
  expect(cookie).toContain("HttpOnly"); expect(cookie.toLowerCase()).toContain("samesite=lax");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request.post("/api/auth/login", { headers: { Origin: "http://127.0.0.1:4173" }, data: { username: "nobody", password: "wrong" } });
    expect(response.status()).toBe(401);
  }
  const blocked = await request.post("/api/auth/login", { headers: { Origin: "http://127.0.0.1:4173" }, data: { username: "nobody", password: "wrong" } });
  expect(blocked.status()).toBe(429);
});
