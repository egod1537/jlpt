import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ListeningSegment } from "@back/lib/listening/types";
import { OpenAiListeningFailure, ResponsesGptListeningAdapter, validateGptListeningOutput } from "@/lib/server/openai-listening";

const source: ListeningSegment[] = [
  { id: "s0", ordinal: 0, startMs: 0, endMs: 1_000, speaker: null, ja: "価格は100円です。", ko: null, needsReview: false, reviewNote: null, sourceSegmentIds: ["whisper:0"] },
  { id: "s1", ordinal: 1, startMs: 1_000, endMs: 2_000, speaker: null, ja: "安いですね。", ko: null, needsReview: false, reviewNote: null, sourceSegmentIds: ["whisper:1"] },
];

describe("OpenAI listening correction", () => {
  it("uses OAuth Responses streaming constraints and validates structured output", async () => {
    const resultPayload = {
      segments: [{
        sourceSegmentIds: ["whisper:0", "whisper:1"], startMs: 0, endMs: 2_000, speaker: null,
        ja: "価格は100円です。安いですね。", ko: "가격은 100엔입니다. 싸네요.", needsReview: false, reviewNote: null,
      }],
    };
    const encoded = JSON.stringify(resultPayload);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      `data: ${JSON.stringify({ type: "response.output_text.delta", delta: encoded.slice(0, 20) })}\r\n\r\n` +
      `data: ${JSON.stringify({ type: "response.output_text.delta", delta: encoded.slice(20) })}\r\n\r\n` +
      `data: ${JSON.stringify({ type: "response.completed", response: { id: "resp_test" } })}\r\n\r\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    const adapter = new ResponsesGptListeningAdapter("gpt-test", fetcher, async () => "oauth-token");
    const result = await adapter.process(source);

    expect(result.segments).toMatchObject([{ startMs: 0, endMs: 2_000, ja: "価格は100円です。安いですね。", ko: "가격은 100엔입니다. 싸네요." }]);
    const [, init] = fetcher.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer oauth-token");
    const requestBody = JSON.parse(String(init?.body));
    expect(requestBody).toMatchObject({ model: "gpt-test", store: false, stream: true, text: { format: { type: "json_schema", strict: true } } });
    expect(requestBody).not.toHaveProperty("background");
    expect(requestBody).not.toHaveProperty("previous_response_id");
    expect(String(init?.body)).not.toContain("audio bytes");
  });

  it("rejects invented sources, timings, changed numbers, and omitted translations", () => {
    const base = { sourceSegmentIds: ["whisper:0"], startMs: 0, endMs: 1_000, speaker: null, ja: "価格は100円です。", ko: "가격은 100엔입니다.", needsReview: false, reviewNote: null };
    expect(() => validateGptListeningOutput({ segments: [{ ...base, sourceSegmentIds: ["unknown"] }] }, source)).toThrowError(OpenAiListeningFailure);
    expect(() => validateGptListeningOutput({ segments: [{ ...base, endMs: 900 }, { ...base, sourceSegmentIds: ["whisper:1"], startMs: 1_000, endMs: 2_000, ja: "安いですね。" }] }, source)).toThrow(/타임스탬프/);
    expect(() => validateGptListeningOutput({ segments: [{ ...base, ja: "価格は200円です。" }, { ...base, sourceSegmentIds: ["whisper:1"], startMs: 1_000, endMs: 2_000, ja: "安いですね。" }] }, source)).toThrow(/숫자/);
    expect(() => validateGptListeningOutput({ segments: [{ ...base, ko: null }] }, [source[0]])).toThrow(/검토 필요/);
  });

  it("classifies rate limits as retryable without exposing upstream content", async () => {
    const adapter = new ResponsesGptListeningAdapter("gpt-test", vi.fn<typeof fetch>().mockResolvedValue(new Response("secret upstream body", { status: 429 })), async () => "oauth-token");
    await expect(adapter.process(source)).rejects.toMatchObject({ code: "OPENAI_HTTP_429", retryable: true, waitingAuth: false });
  });
});
