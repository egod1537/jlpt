import "server-only";

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

export type WhisperProviderJob = {
  id: string;
  status: "queued" | "processing" | "pausing" | "paused" | "completed" | "failed" | "canceled";
  phase: string | null;
  error?: { code?: string; message?: string } | null;
};

export type WhisperProviderResult = {
  text?: string;
  languageDetected?: string;
  segments: Array<{
    startMs?: number;
    endMs?: number;
    start?: number;
    end?: number;
    text: string;
    confidence?: number;
  }>;
  providerMetadata?: unknown;
  postProcessingMetadata?: unknown;
  [key: string]: unknown;
};

export interface WhisperAdapter {
  submit(input: { filePath: string; originalName: string; mimeType: string; idempotencyKey: string; signal?: AbortSignal }): Promise<string>;
  getJob(providerJobId: string, signal?: AbortSignal): Promise<WhisperProviderJob>;
  getResult(providerJobId: string, signal?: AbortSignal): Promise<WhisperProviderResult>;
}

export class WhisperProviderFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = "WhisperProviderFailure";
  }
}

export function whisperConfig() {
  const rawBaseUrl = process.env.WHISPER_BASE_URL?.trim();
  if (!rawBaseUrl) throw new WhisperProviderFailure("WHISPER_NOT_CONFIGURED", "Whisper 서버가 설정되지 않았습니다.", false);
  let baseUrl: URL;
  try { baseUrl = new URL(rawBaseUrl); } catch { throw new WhisperProviderFailure("WHISPER_CONFIG_INVALID", "Whisper 서버 주소가 올바르지 않습니다.", false); }
  if (!new Set(["http:", "https:"]).has(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
    throw new WhisperProviderFailure("WHISPER_CONFIG_INVALID", "Whisper 서버 주소가 올바르지 않습니다.", false);
  }
  const allowedHosts = (process.env.WHISPER_ALLOWED_HOSTS || baseUrl.host).split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!allowedHosts.includes(baseUrl.host.toLowerCase())) throw new WhisperProviderFailure("WHISPER_HOST_NOT_ALLOWED", "Whisper 서버가 허용 목록에 없습니다.", false);
  const transcribePath = process.env.WHISPER_TRANSCRIBE_PATH?.trim() || "/api/v1/jobs";
  if (!transcribePath.startsWith("/") || transcribePath.startsWith("//") || transcribePath.includes("..")) throw new WhisperProviderFailure("WHISPER_CONFIG_INVALID", "Whisper 작업 경로가 올바르지 않습니다.", false);
  const timeoutMs = boundedNumber(process.env.WHISPER_TIMEOUT_MS, 600_000, 5_000, 3_600_000);
  return { baseUrl: new URL(baseUrl.pathname.endsWith("/") ? baseUrl : `${baseUrl.toString().replace(/\/$/, "")}/`), transcribePath, timeoutMs, authToken: process.env.WHISPER_AUTH_TOKEN?.trim() || null };
}

export class HttpWhisperAdapter implements WhisperAdapter {
  constructor(
    private readonly config = whisperConfig(),
    private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {}

  async submit(input: { filePath: string; originalName: string; mimeType: string; idempotencyKey: string; signal?: AbortSignal }) {
    const file = await stat(input.filePath);
    const boundary = `jlpt-${crypto.randomUUID()}`;
    const safeName = input.originalName.replace(/[\r\n"]/g, "_").slice(0, 200) || "audio";
    const preamble = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${safeName}"\r\nContent-Type: ${input.mimeType}\r\n\r\n`,
    );
    const fields = Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nja` +
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="formats"\r\n\r\njson` +
      `\r\n--${boundary}--\r\n`,
    );
    const body = Readable.from((async function* () {
      yield preamble;
      for await (const chunk of createReadStream(input.filePath)) yield chunk;
      yield fields;
    })());
    const response = await this.request(this.config.transcribePath, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(preamble.length + file.size + fields.length),
        "Idempotency-Key": input.idempotencyKey,
      },
      body: Readable.toWeb(body) as ReadableStream<Uint8Array>,
      duplex: "half",
      signal: input.signal,
    });
    const payload = await readBoundedJson(response);
    if (!isRecord(payload) || typeof payload.id !== "string" || !payload.id) throw new WhisperProviderFailure("WHISPER_CONTRACT", "Whisper 작업 응답 형식이 올바르지 않습니다.", false);
    return payload.id;
  }

  async getJob(providerJobId: string, signal?: AbortSignal) {
    assertProviderId(providerJobId);
    const response = await this.request(`${this.jobsBasePath()}/${encodeURIComponent(providerJobId)}`, { signal });
    const payload = await readBoundedJson(response);
    if (!isRecord(payload) || typeof payload.id !== "string" || typeof payload.status !== "string") throw new WhisperProviderFailure("WHISPER_CONTRACT", "Whisper 작업 상태 형식이 올바르지 않습니다.", false);
    const statuses = new Set(["queued", "processing", "pausing", "paused", "completed", "failed", "canceled"]);
    if (!statuses.has(payload.status)) throw new WhisperProviderFailure("WHISPER_CONTRACT", "Whisper 작업 상태를 해석할 수 없습니다.", false);
    return {
      id: payload.id,
      status: payload.status as WhisperProviderJob["status"],
      phase: typeof payload.phase === "string" ? payload.phase : null,
      error: isRecord(payload.error) ? { code: stringOrUndefined(payload.error.code), message: stringOrUndefined(payload.error.message) } : null,
    };
  }

  async getResult(providerJobId: string, signal?: AbortSignal) {
    assertProviderId(providerJobId);
    const response = await this.request(`${this.jobsBasePath()}/${encodeURIComponent(providerJobId)}/results/json`, { signal });
    const payload = await readBoundedJson(response);
    if (!isRecord(payload) || !Array.isArray(payload.segments)) throw new WhisperProviderFailure("WHISPER_CONTRACT", "Whisper 결과 형식이 올바르지 않습니다.", false);
    return payload as WhisperProviderResult;
  }

  private jobsBasePath() {
    return this.config.transcribePath.replace(/\/$/, "");
  }

  private async request(pathname: string, init: RequestInit & { duplex?: "half" } = {}) {
    const url = new URL(pathname.replace(/^\//, ""), this.config.baseUrl);
    if (url.origin !== this.config.baseUrl.origin) throw new WhisperProviderFailure("WHISPER_HOST_NOT_ALLOWED", "Whisper 요청 주소가 허용 범위를 벗어났습니다.", false);
    const headers = new Headers(init.headers);
    if (this.config.authToken) headers.set("Authorization", `Bearer ${this.config.authToken}`);
    const timeout = AbortSignal.timeout(this.config.timeoutMs);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    let response: Response;
    try { response = await this.fetcher(url, { ...init, headers, signal } as RequestInit); }
    catch (error) {
      if (signal.aborted) throw new WhisperProviderFailure("WHISPER_TIMEOUT", "Whisper 서버 응답 시간이 초과되었습니다.", true);
      throw new WhisperProviderFailure("WHISPER_UNREACHABLE", "Whisper 서버에 연결할 수 없습니다.", true);
    }
    if (!response.ok) {
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      const code = response.status === 401 || response.status === 403 ? "WHISPER_AUTH" : `WHISPER_HTTP_${response.status}`;
      throw new WhisperProviderFailure(code, response.status === 401 || response.status === 403 ? "Whisper 인증이 거부되었습니다." : "Whisper 서버가 요청을 처리하지 못했습니다.", retryable, response.status);
    }
    return response;
  }
}

export async function waitForWhisperResult(adapter: WhisperAdapter, providerJobId: string, options: {
  timeoutMs?: number;
  pollMs?: number;
  signal?: AbortSignal;
  onPoll?: (job: WhisperProviderJob) => Promise<void> | void;
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
} = {}) {
  const started = Date.now();
  const timeoutMs = options.timeoutMs ?? 600_000;
  const pollMs = options.pollMs ?? 1_500;
  const wait = options.wait ?? delay;
  while (Date.now() - started < timeoutMs) {
    let job: WhisperProviderJob;
    try {
      job = await adapter.getJob(providerJobId, options.signal);
    } catch (error) {
      if (!(error instanceof WhisperProviderFailure) || !error.retryable) throw error;
      await wait(Math.max(pollMs, 5_000), options.signal);
      continue;
    }
    await options.onPoll?.(job);
    if (job.status === "completed") return adapter.getResult(providerJobId, options.signal);
    if (job.status === "failed" || job.status === "canceled") throw new WhisperProviderFailure(job.error?.code || `WHISPER_${job.status.toUpperCase()}`, "Whisper 작업이 완료되지 못했습니다.", job.status === "failed");
    await wait(pollMs, options.signal);
  }
  throw new WhisperProviderFailure("WHISPER_TIMEOUT", "Whisper 작업 대기 시간이 초과되었습니다.", true);
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
  });
}

async function readBoundedJson(response: Response, maxBytes = 10 * 1024 * 1024) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new WhisperProviderFailure("WHISPER_RESPONSE_TOO_LARGE", "Whisper 응답이 너무 큽니다.", false);
  if (!response.body) throw new WhisperProviderFailure("WHISPER_CONTRACT", "Whisper 응답 본문이 없습니다.", false);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new WhisperProviderFailure("WHISPER_RESPONSE_TOO_LARGE", "Whisper 응답이 너무 큽니다.", false); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }
  catch { throw new WhisperProviderFailure("WHISPER_CONTRACT", "Whisper JSON 응답을 해석할 수 없습니다.", false); }
}

function assertProviderId(value: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(value)) throw new WhisperProviderFailure("WHISPER_CONTRACT", "Whisper 작업 ID가 올바르지 않습니다.", false);
}

function boundedNumber(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function stringOrUndefined(value: unknown) { return typeof value === "string" ? value : undefined; }

