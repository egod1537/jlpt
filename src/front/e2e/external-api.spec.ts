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
