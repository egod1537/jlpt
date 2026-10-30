import { expect, test } from "@playwright/test";

const authorization = { Authorization: "Bearer e2e-external-api-key" };

test("external API creates and reads a complete book idempotently", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "external API journey runs once");

  const unauthorized = await request.get("/api/v1/books");
  expect(unauthorized.status()).toBe(401);
  expect(await unauthorized.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });

  const payload = {
    id: "book-external-api-e2e",
    title: "외부 API E2E",
    category: "자동 연동",
    words: [
      {
        term: "気配",
        reading: "けはい",
        meanings: ["기척", "낌새"],
        nuance: "보이지 않지만 느껴지는 조짐",
        examples: [{ ja: "人の【気配】を感じる。", ko: "사람의 기척을 느끼다." }],
        jlptLevels: ["N1"],
      },
      { term: "兆し", reading: "きざし", meanings: ["조짐"] },
    ],
  };
  const headers = { ...authorization, "Idempotency-Key": "external-api-e2e-create" };
  const created = await request.post("/api/v1/books", { headers, data: payload });
  expect(created.status()).toBe(201);
  expect(created.headers().location).toBe("/api/v1/books/book-external-api-e2e");
  expect(await created.json()).toMatchObject({ data: { book: { id: payload.id, entryCount: 2 }, entries: [{ term: "気配" }, { term: "兆し" }] } });

  const replayed = await request.post("/api/v1/books", { headers, data: payload });
  expect(replayed.status()).toBe(200);
  expect(replayed.headers()["idempotency-replayed"]).toBe("true");

  const listed = await request.get("/api/v1/books?q=외부%20API&limit=1", { headers: authorization });
  expect(await listed.json()).toMatchObject({ data: [{ id: payload.id }], pagination: { limit: 1, nextCursor: null } });

  const detail = await request.get(`/api/v1/books/${payload.id}`, { headers: authorization });
  expect(detail.status()).toBe(200);
  expect(await detail.json()).toMatchObject({ data: { id: payload.id, title: payload.title, entryCount: 2 } });

  const entries = await request.get(`/api/v1/books/${payload.id}/entries?limit=1`, { headers: authorization });
  expect(await entries.json()).toMatchObject({ data: [{ term: "気配" }], pagination: { limit: 1, nextCursor: "0" } });
  const nextEntries = await request.get(`/api/v1/books/${payload.id}/entries?limit=1&cursor=0`, { headers: authorization });
  expect(await nextEntries.json()).toMatchObject({ data: [{ term: "兆し" }], pagination: { limit: 1, nextCursor: null } });
});

test("external listening API uploads, polls, streams, scripts, exports, and replays safely", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280", "external listening journey runs once");

  expect((await request.get("/api/v1/listening/sets")).status()).toBe(401);
  const folderResponse = await request.post("/api/v1/listening/folders", { headers: { ...authorization, "Idempotency-Key": "listening-folder-e2e" }, data: { name: "외부 청해" } });
  expect(folderResponse.status()).toBe(201);
  const folder = (await folderResponse.json() as { data: { id: string } }).data;
  const setResponse = await request.post("/api/v1/listening/sets", { headers: { ...authorization, "Idempotency-Key": "listening-set-e2e" }, data: { title: "외부 API 청해", folderId: folder.id } });
  expect(setResponse.status()).toBe(201);
  const set = (await setResponse.json() as { data: { id: string; revision: number } }).data;

  const renamed = await request.patch(`/api/v1/listening/sets/${set.id}`, { headers: { ...authorization, "If-Match": `W/\"${set.revision}\"` }, data: { title: "외부 API 청해 수정" } });
  expect(renamed.status()).toBe(200);
  const conflict = await request.patch(`/api/v1/listening/sets/${set.id}`, { headers: { ...authorization, "If-Match": `W/\"${set.revision}\"` }, data: { title: "충돌" } });
  expect(conflict.status()).toBe(409);

  const wav = silentWav();
  const uploadHeaders = { ...authorization, "Idempotency-Key": "listening-audio-e2e" };
  const upload = await request.post(`/api/v1/listening/sets/${set.id}/audio`, { headers: uploadHeaders, multipart: { file: { name: "e2e.wav", mimeType: "audio/wav", buffer: wav } } });
  expect(upload.status()).toBe(201);
  const uploaded = (await upload.json() as { data: { audio: { id: string }; jobId: string; autoTranscribe: boolean } }).data;
  expect(uploaded.autoTranscribe).toBe(true);
  const replay = await request.post(`/api/v1/listening/sets/${set.id}/audio`, { headers: uploadHeaders, multipart: { file: { name: "e2e.wav", mimeType: "audio/wav", buffer: wav } } });
  expect(replay.status()).toBe(200);
  expect(replay.headers()["idempotency-replayed"]).toBe("true");
  expect((await replay.json() as { data: { audio: { id: string } } }).data.audio.id).toBe(uploaded.audio.id);

  await expect.poll(async () => {
    const response = await request.get(`/api/v1/listening/jobs/${uploaded.jobId}`, { headers: authorization });
    return (await response.json() as { data: { state: string } }).data.state;
  }, { timeout: 15_000 }).toBe("completed");
  const metadata = await request.get(`/api/v1/listening/audio/${uploaded.audio.id}`, { headers: authorization });
  expect(metadata.status()).toBe(200);
  expect(JSON.stringify(await metadata.json())).not.toMatch(/storedKey|WHISPER|refresh_token/);

  const range = await request.get(`/api/v1/listening/audio/${uploaded.audio.id}/stream`, { headers: { ...authorization, Range: "bytes=0-31" } });
  expect(range.status()).toBe(206);
  expect(range.headers()["content-range"]).toMatch(/^bytes 0-31\//);
  expect((await range.body()).byteLength).toBe(32);

  const script = await request.get(`/api/v1/listening/audio/${uploaded.audio.id}/script`, { headers: authorization });
  expect(await script.json()).toMatchObject({ data: { audioId: uploaded.audio.id, segments: [{ ja: "明日の会議は何時ですか。", startMs: 0, endMs: 500 }] } });
  const exported = await request.get(`/api/v1/listening/audio/${uploaded.audio.id}/export?format=srt&lang=ja`, { headers: authorization });
  expect(exported.status()).toBe(200);
  expect(await exported.text()).toContain("00:00:00,000 --> 00:00:00,500");

  const detail = await request.get(`/api/v1/listening/sets/${set.id}`, { headers: authorization });
  expect((await detail.json() as { data: { audio: unknown[] } }).data.audio).toHaveLength(1);
});

function silentWav() {
  const sampleRate = 8_000; const samples = sampleRate; const dataBytes = samples * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + dataBytes, 4); buffer.write("WAVE", 8); buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(dataBytes, 40);
  return buffer;
}
