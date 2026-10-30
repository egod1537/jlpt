import { expect, test } from "@playwright/test";

const authorization = { Authorization: "Bearer e2e-external-api-key" };

test("listening player remains usable and fixed across the viewport matrix", async ({ page, request }, testInfo) => {
  const suffix = testInfo.project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const createdSet = await request.post("/api/v1/listening/sets", {
    headers: { ...authorization, "Idempotency-Key": `player-set-${suffix}` },
    data: { title: `플레이어 ${suffix}` },
  });
  expect(createdSet.status()).toBe(201);
  const setId = (await createdSet.json() as { data: { id: string } }).data.id;
  const upload = await request.post(`/api/v1/listening/sets/${setId}/audio`, {
    headers: { ...authorization, "Idempotency-Key": `player-audio-${suffix}` },
    multipart: { file: { name: `player-${suffix}.wav`, mimeType: "audio/wav", buffer: silentWav() } },
  });
  expect(upload.status()).toBe(201);
  const uploaded = (await upload.json() as { data: { audio: { id: string }; jobId: string } }).data;
  await expect.poll(async () => {
    const job = await request.get(`/api/v1/listening/jobs/${uploaded.jobId}`, { headers: authorization });
    return (await job.json() as { data: { state: string } }).data.state;
  }, { timeout: 15_000 }).toBe("completed");

  const scriptResponse = await request.get(`/api/v1/listening/audio/${uploaded.audio.id}/script`, { headers: authorization });
  const script = (await scriptResponse.json() as { data: { revision: number; segments: Array<{ id: string }> } }).data;
  const sourceId = script.segments[0].id;
  const longJa = "長い日本語".repeat(40); const longKo = "긴 한국어 번역".repeat(40);
  const operations: Array<Record<string, unknown>> = [];
  let remainderId = sourceId;
  for (let index = 1; index < 20; index += 1) {
    operations.push({ type: "split", segmentId: remainderId, atMs: index * 25, ja: [index === 1 ? longJa : `文 ${index}`, "残り"], ko: [index === 1 ? longKo : `문장 ${index}`, "나머지"] });
    remainderId = `${remainderId}:b`;
  }
  const edited = await request.patch(`/api/v1/listening/audio/${uploaded.audio.id}/script`, {
    headers: authorization,
    data: { expectedRevision: script.revision, operations },
  });
  expect(edited.status(), await edited.text()).toBe(200);

  await page.goto(`/listening/audio/${uploaded.audio.id}`);
  await expect(page.getByRole("heading", { name: `player-${suffix}.wav` })).toBeVisible();
  const rows = page.getByRole("listitem");
  await expect(rows).toHaveCount(20);
  await expect(page.getByText(longJa)).toBeVisible();
  await expect(page.getByText(longKo)).toHaveCount(0);

  await page.getByRole("button", { name: "한" }).click();
  await expect(page.getByText(longJa)).toBeVisible(); await expect(page.getByText(longKo)).toBeVisible();
  await page.getByRole("button", { name: "日" }).click();
  await expect(page.getByText(longJa)).toHaveCount(0); await expect(page.getByText(longKo)).toBeVisible();
  await page.getByRole("button", { name: "한" }).click();
  await expect(page.getByText(longJa)).toHaveCount(0); await expect(page.getByText(longKo)).toHaveCount(0);
  await expect(rows.first()).toContainText("문장 1");

  const audio = page.locator("audio");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.readyState)).toBeGreaterThanOrEqual(1);
  await rows.nth(8).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeCloseTo(0.2, 1);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
  await page.getByRole("button", { name: "5초 앞으로" }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeCloseTo(5.2, 1);
  await page.getByRole("button", { name: "5초 뒤로" }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeCloseTo(0.2, 1);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeCloseTo(5.2, 1);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeCloseTo(0.2, 1);
  await page.getByRole("button", { name: "이전 문장" }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeCloseTo(0.175, 2);
  await page.getByRole("button", { name: /재생 속도 1배/ }).click();
  await expect(page.getByRole("button", { name: /재생 속도 1.25배/ })).toBeVisible();

  const scriptScroller = page.getByRole("list", { name: "청해 스크립트" }).locator("..");
  await scriptScroller.evaluate((element) => { element.scrollTop = element.scrollHeight; element.dispatchEvent(new WheelEvent("wheel", { bubbles: true })); });
  await expect(page.getByRole("button", { name: "현재 문장 따라가기" })).toBeVisible();
  const footer = page.locator("footer"); const box = await footer.boundingBox();
  expect(box).not.toBeNull(); expect(Math.abs((box!.y + box!.height) - page.viewportSize()!.height)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);

  await page.getByRole("button", { name: "日" }).click();
  await page.reload();
  await expect(page.getByText(longJa)).toBeVisible();
  await expect(page.getByText(longKo)).toHaveCount(0);
});

function silentWav() {
  const sampleRate = 8_000; const samples = sampleRate * 12; const dataBytes = samples * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + dataBytes, 4); buffer.write("WAVE", 8); buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(dataBytes, 40);
  return buffer;
}
