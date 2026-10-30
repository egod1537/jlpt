import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { chmod, lstat, mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import type { AppDatabase } from "@back/lib/db/database";
import { registerListeningAudio } from "@back/lib/listening/repository";

const accepted = {
  mp3: { mimeType: "audio/mpeg", extension: ".mp3", formats: ["mp3"] },
  m4a: { mimeType: "audio/mp4", extension: ".m4a", formats: ["mov", "mp4", "m4a", "3gp", "3g2", "mj2"] },
  wav: { mimeType: "audio/wav", extension: ".wav", formats: ["wav"] },
  ogg: { mimeType: "audio/ogg", extension: ".ogg", formats: ["ogg"] },
  webm: { mimeType: "audio/webm", extension: ".webm", formats: ["matroska", "webm"] },
} as const;

type AcceptedKind = keyof typeof accepted;

export type AudioProbe = {
  kind: AcceptedKind;
  mimeType: string;
  durationMs: number | null;
  sampleRate: number | null;
  channels: number | null;
  codecName: string | null;
};

export type StagedAudio = AudioProbe & {
  originalName: string;
  storedKey: string;
  absolutePath: string;
  sizeBytes: number;
  sha256: string;
};

export class AudioStorageFailure extends Error {
  constructor(readonly status: number, readonly code: "VALIDATION" | "TOO_LARGE" | "UNSUPPORTED" | "PROBE_UNAVAILABLE" | "INTERNAL", message: string) {
    super(message);
    this.name = "AudioStorageFailure";
  }
}

export function audioStorageConfig() {
  const base = path.join(process.cwd(), "..", "..", "var", "listening");
  const audioDir = configuredStoragePath(process.env.JLPT_AUDIO_DIR, path.join(base, "audio"), "JLPT_AUDIO_DIR");
  const tmpDir = configuredStoragePath(process.env.JLPT_AUDIO_TMP_DIR, path.join(base, "tmp"), "JLPT_AUDIO_TMP_DIR");
  const configuredMax = Number(process.env.JLPT_MAX_AUDIO_BYTES || 209_715_200);
  const maxBytes = Number.isSafeInteger(configuredMax) && configuredMax > 0 ? configuredMax : 209_715_200;
  return { audioDir, tmpDir, maxBytes };
}

function configuredStoragePath(value: string | undefined, fallback: string, label: string) {
  if (!value?.trim()) return path.normalize(fallback);
  if (!path.isAbsolute(value)) throw new AudioStorageFailure(500, "INTERNAL", `${label}은(는) 절대 경로여야 합니다.`);
  return path.normalize(value);
}

export async function ensureAudioStorage() {
  const config = audioStorageConfig();
  await Promise.all([
    mkdir(config.audioDir, { recursive: true, mode: 0o700 }),
    mkdir(config.tmpDir, { recursive: true, mode: 0o700 }),
  ]);
  await Promise.all([chmod(config.audioDir, 0o700), chmod(config.tmpDir, 0o700)]);
  return config;
}

export async function receiveAudioMultipart(
  request: Request,
  options: { maxFiles?: number; probe?: (filePath: string, detectedKind: AcceptedKind) => Promise<AudioProbe> } = {},
) {
  if (!request.body) throw new AudioStorageFailure(400, "VALIDATION", "업로드 본문이 없습니다.");
  const contentType = request.headers.get("content-type") || "";
  if (!/^multipart\/form-data\s*;/i.test(contentType)) throw new AudioStorageFailure(415, "UNSUPPORTED", "multipart/form-data 업로드가 필요합니다.");
  const config = await ensureAudioStorage();
  const maxFiles = Math.min(20, Math.max(1, options.maxFiles ?? 20));
  const parser = Busboy({
    headers: Object.fromEntries(request.headers),
    limits: { files: maxFiles, fileSize: config.maxBytes + 1, fields: 20, parts: maxFiles + 20 },
  });
  const tasks: Array<Promise<StagedAudio>> = [];
  let parserError: Error | undefined;
  parser.on("file", (fieldName, stream, info) => {
    if (fieldName !== "file" || !info.filename) {
      stream.resume();
      return;
    }
    tasks.push(stageAudioStream(stream, info.filename, config, options.probe));
  });
  parser.on("filesLimit", () => { parserError = new AudioStorageFailure(400, "VALIDATION", `파일은 한 번에 ${maxFiles}개까지 업로드할 수 있습니다.`); });
  parser.on("partsLimit", () => { parserError = new AudioStorageFailure(400, "VALIDATION", "multipart 항목이 너무 많습니다."); });

  const source = Readable.from(request.body as unknown as AsyncIterable<Uint8Array>);
  const parsing = new Promise<void>((resolve, reject) => {
    parser.once("close", resolve);
    parser.once("error", reject);
    source.once("error", reject);
  });
  source.pipe(parser);

  try {
    await parsing;
    if (parserError) throw parserError;
    if (!tasks.length) throw new AudioStorageFailure(400, "VALIDATION", "음원 파일이 없습니다.");
    const results = await Promise.all(tasks);
    return results;
  } catch (error) {
    source.destroy();
    const settled = await Promise.allSettled(tasks);
    await Promise.all(settled.flatMap((result) => result.status === "fulfilled" ? [removeStoredAudio(result.value.storedKey)] : []));
    throw error;
  }
}

export async function storeUploadedAudio(db: AppDatabase, setId: string, files: StagedAudio[]) {
  try {
    const createAll = db.transaction(() => files.map((file) => registerListeningAudio(db, {
        setId,
        originalName: file.originalName,
        storedKey: file.storedKey,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        sha256: file.sha256,
        durationMs: file.durationMs,
        sampleRate: file.sampleRate,
        channels: file.channels,
        codecName: file.codecName,
      })));
    return createAll();
  } catch (error) {
    await Promise.all(files.map((file) => removeStoredAudio(file.storedKey)));
    throw error;
  }
}

async function stageAudioStream(
  input: NodeJS.ReadableStream,
  originalName: string,
  config: ReturnType<typeof audioStorageConfig>,
  probe = probeAudioFile,
) {
  const temporaryPath = path.join(config.tmpDir, `${randomUUID()}.part`);
  let sizeBytes = 0;
  const hash = createHash("sha256");
  const signature: Buffer[] = [];
  let signatureBytes = 0;
  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      sizeBytes += chunk.length;
      if (signatureBytes < 32) {
        const portion = chunk.subarray(0, 32 - signatureBytes);
        signature.push(portion);
        signatureBytes += portion.length;
      }
      if (sizeBytes > config.maxBytes) {
        callback(new AudioStorageFailure(413, "TOO_LARGE", "음원 파일이 업로드 제한을 초과했습니다."));
        return;
      }
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  try {
    await pipeline(input, meter, createWriteStream(temporaryPath, { flags: "wx", mode: 0o600 }));
    if (sizeBytes === 0) throw new AudioStorageFailure(400, "VALIDATION", "빈 파일은 업로드할 수 없습니다.");
    const detectedKind = detectAudioKind(Buffer.concat(signature));
    if (!detectedKind) throw new AudioStorageFailure(415, "UNSUPPORTED", "파일 내용이 지원하는 음원 형식이 아닙니다.");
    const metadata = await probe(temporaryPath, detectedKind);
    const sha256 = hash.digest("hex");
    const storedKey = path.posix.join(sha256.slice(0, 2), sha256.slice(2, 4), `${randomUUID()}${accepted[metadata.kind].extension}`);
    const destination = resolveStoredPath(storedKey, config.audioDir);
    await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await rename(temporaryPath, destination);
    await chmod(destination, 0o600);
    return { ...metadata, originalName: safeOriginalName(originalName), storedKey, absolutePath: destination, sizeBytes, sha256 } satisfies StagedAudio;
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

export function detectAudioKind(bytes: Uint8Array): AcceptedKind | null {
  const buffer = Buffer.from(bytes);
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WAVE") return "wav";
  if (buffer.length >= 3 && buffer.toString("ascii", 0, 3) === "ID3") return "mp3";
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return "mp3";
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") return "m4a";
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "OggS") return "ogg";
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "webm";
  return null;
}

export async function probeAudioFile(filePath: string, detectedKind: AcceptedKind): Promise<AudioProbe> {
  const timeoutMs = Math.min(60_000, Math.max(1_000, Number(process.env.JLPT_FFPROBE_TIMEOUT_MS || 15_000)));
  const result = await runProcess(process.env.FFPROBE_PATH || "ffprobe", [
    "-v", "error", "-show_entries", "format=format_name,duration:stream=codec_type,codec_name,sample_rate,channels",
    "-of", "json", filePath,
  ], timeoutMs);
  if (result.spawnError === "ENOENT") throw new AudioStorageFailure(503, "PROBE_UNAVAILABLE", "서버에 ffprobe가 설치되지 않았습니다.");
  if (result.exitCode !== 0) throw new AudioStorageFailure(415, "UNSUPPORTED", "음원 파일을 해석할 수 없습니다.");
  let parsed: { format?: { format_name?: string; duration?: string }; streams?: Array<Record<string, unknown>> };
  try { parsed = JSON.parse(result.stdout) as typeof parsed; } catch { throw new AudioStorageFailure(415, "UNSUPPORTED", "음원 메타데이터를 읽을 수 없습니다."); }
  const audio = parsed.streams?.find((stream) => stream.codec_type === "audio");
  const formats = String(parsed.format?.format_name || "").split(",");
  if (!audio || !accepted[detectedKind].formats.some((format) => formats.includes(format))) throw new AudioStorageFailure(415, "UNSUPPORTED", "파일 시그니처와 실제 음원 형식이 일치하지 않습니다.");
  const durationSeconds = Number(parsed.format?.duration);
  const sampleRate = Number(audio.sample_rate);
  const channels = Number(audio.channels);
  if (Number.isFinite(durationSeconds) && durationSeconds <= 0) throw new AudioStorageFailure(415, "UNSUPPORTED", "길이가 없는 음원은 업로드할 수 없습니다.");
  return {
    kind: detectedKind,
    mimeType: accepted[detectedKind].mimeType,
    durationMs: Number.isFinite(durationSeconds) && durationSeconds > 0 ? Math.round(durationSeconds * 1_000) : null,
    sampleRate: Number.isInteger(sampleRate) && sampleRate > 0 ? sampleRate : null,
    channels: Number.isInteger(channels) && channels > 0 ? channels : null,
    codecName: typeof audio.codec_name === "string" ? audio.codec_name : null,
  };
}

export async function openStoredAudio(storedKey: string) {
  const config = audioStorageConfig();
  const absolutePath = resolveStoredPath(storedKey, config.audioDir);
  const info = await lstat(absolutePath);
  if (!info.isFile() || info.isSymbolicLink()) throw new AudioStorageFailure(404, "VALIDATION", "음원 파일을 찾을 수 없습니다.");
  return { absolutePath, size: info.size };
}

export async function removeStoredAudio(storedKey: string) {
  const config = audioStorageConfig();
  const absolutePath = resolveStoredPath(storedKey, config.audioDir);
  await rm(absolutePath, { force: true });
}

export function createAudioReadStream(absolutePath: string, range?: { start: number; end: number }) {
  return createReadStream(absolutePath, range ? { start: range.start, end: range.end } : undefined);
}

export async function fileSha256(filePath: string) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(filePath), new Transform({ transform(chunk, _encoding, callback) { hash.update(chunk); callback(); } }));
  return hash.digest("hex");
}

export async function storedFileSize(storedKey: string) {
  return (await stat(resolveStoredPath(storedKey, audioStorageConfig().audioDir))).size;
}

function resolveStoredPath(storedKey: string, audioDir: string) {
  if (!storedKey || path.isAbsolute(storedKey) || storedKey.includes("\\") || storedKey.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new AudioStorageFailure(400, "VALIDATION", "저장 경로가 올바르지 않습니다.");
  }
  const resolved = path.resolve(audioDir, ...storedKey.split("/"));
  const prefix = `${path.resolve(audioDir)}${path.sep}`;
  if (!resolved.startsWith(prefix)) throw new AudioStorageFailure(400, "VALIDATION", "저장 경로가 올바르지 않습니다.");
  return resolved;
}

function safeOriginalName(value: string) {
  const base = path.basename(value.replaceAll("\0", "")).trim();
  return [...base].filter((character) => character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127).join("").slice(0, 255) || "audio";
}

function runProcess(command: string, args: string[], timeoutMs: number) {
  return new Promise<{ exitCode: number | null; stdout: string; stderr: string; spawnError?: string }>((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    let spawnError: string | undefined;
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => { if (stdout.length < 1_000_000) stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk: Buffer) => { if (stderr.length < 8_192) stderr += chunk.toString("utf8"); });
    child.on("error", (error: NodeJS.ErrnoException) => { spawnError = error.code; });
    child.on("close", (exitCode) => { clearTimeout(timer); resolve({ exitCode, stdout, stderr, spawnError }); });
  });
}

