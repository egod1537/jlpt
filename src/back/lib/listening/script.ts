import "server-only";

import { createHash } from "node:crypto";
import type { AppDatabase } from "@back/lib/db/database";
import {
  activateTranscriptVersion,
  createTranscriptVersion,
  getActiveTranscript,
  getListeningAudio,
  getTranscriptVersion,
  ListeningFailure,
} from "@back/lib/listening/repository";
import type { ListeningSegment } from "@back/lib/listening/types";

export type ScriptEditOperation =
  | { type: "update"; segmentId: string; startMs?: number; endMs?: number; ja?: string; ko?: string | null; speaker?: string | null; needsReview?: boolean; reviewNote?: string | null }
  | { type: "split"; segmentId: string; atMs: number; ja: [string, string]; ko?: [string | null, string | null] }
  | { type: "merge"; segmentIds: string[]; ja?: string; ko?: string | null };

export type ScriptUploadFormat = "json" | "srt" | "txt";
export const MAX_SCRIPT_UPLOAD_BYTES = 2 * 1024 * 1024;

export function editListeningScript(db: AppDatabase, audioId: string, input: { revision: number; operations: ScriptEditOperation[] }) {
  const { audio, script } = getActiveTranscript(db, audioId);
  if (!script) throw new ListeningFailure(409, "CONFLICT", "편집할 스크립트가 없습니다.");
  if (!Number.isInteger(input.revision) || input.revision !== audio.revision) throw new ListeningFailure(409, "CONFLICT", "스크립트가 다른 곳에서 변경되었습니다.");
  if (!Array.isArray(input.operations) || input.operations.length < 1 || input.operations.length > 500) throw new ListeningFailure(400, "VALIDATION", "편집 작업을 확인해 주세요.");
  let segments = script.segments.map((segment) => ({ ...segment, sourceSegmentIds: [...segment.sourceSegmentIds] }));
  for (const operation of input.operations) {
    if (!operation || typeof operation !== "object") throw new ListeningFailure(400, "VALIDATION", "편집 작업을 확인해 주세요.");
    if (operation.type === "update") segments = applyUpdate(segments, operation);
    else if (operation.type === "split") segments = applySplit(segments, operation);
    else if (operation.type === "merge") segments = applyMerge(segments, operation);
    else throw new ListeningFailure(400, "VALIDATION", "지원하지 않는 편집 작업입니다.");
  }
  validateEditedSegments(segments, audio.durationMs);
  const version = createTranscriptVersion(db, {
    audioId,
    kind: "manual_edit",
    basedOnId: script.id,
    language: script.language,
    rawPayload: { operationCount: input.operations.length },
    segments: segments.map(({ id: _id, ordinal: _ordinal, ...segment }) => segment),
  });
  const activation = activateTranscriptVersion(db, audioId, version.id, input.revision);
  return { audio: activation.audio, script: version };
}

export function exportListeningScript(db: AppDatabase, audioId: string, format: "json" | "txt" | "srt", lang: "ja" | "ko" | "bilingual" = "bilingual") {
  const { audio, script } = getActiveTranscript(db, audioId);
  if (!script) throw new ListeningFailure(404, "NOT_FOUND", "내보낼 스크립트가 없습니다.");
  const baseName = safeExportName(audio.originalName.replace(/\.[^.]+$/, "") || "transcript");
  if (format === "json") {
    return {
      body: `${JSON.stringify({ audio: { id: audio.id, originalName: audio.originalName, durationMs: audio.durationMs }, version: { id: script.id, versionNo: script.versionNo, kind: script.kind, language: script.language, modelName: script.modelName, promptVersion: script.promptVersion }, segments: script.segments }, null, 2)}\n`,
      contentType: "application/json; charset=utf-8",
      filename: `${baseName}.json`,
    };
  }
  if (format === "txt") {
    const body = script.segments.map((segment) => {
      const lines = lang === "ko" ? [`[${formatClock(segment.startMs)}] ${segment.speaker ? `${segment.speaker}: ` : ""}${segment.ko || ""}`] : [`[${formatClock(segment.startMs)}] ${segment.speaker ? `${segment.speaker}: ` : ""}${segment.ja}`];
      if (lang === "bilingual" && segment.ko !== null) lines.push(segment.ko);
      return lines.join("\n");
    }).join("\n\n");
    return { body: `${body}\n`, contentType: "text/plain; charset=utf-8", filename: `${baseName}.txt` };
  }
  const body = script.segments.map((segment, index) => {
    const primary = lang === "ko" ? segment.ko || "" : segment.ja;
    const lines = [String(index + 1), `${formatSrtTime(segment.startMs)} --> ${formatSrtTime(segment.endMs)}`, `${segment.speaker ? `${segment.speaker}: ` : ""}${primary}`];
    if (lang === "bilingual" && segment.ko !== null) lines.push(segment.ko);
    return lines.join("\n");
  }).join("\n\n");
  return { body: `${body}\n`, contentType: "application/x-subrip; charset=utf-8", filename: `${baseName}.srt` };
}

export function importListeningScript(db: AppDatabase, audioId: string, input: {
  revision: number;
  content: string;
  format: ScriptUploadFormat;
  filename?: string;
  source?: "ui_upload" | "external_api";
}) {
  if (typeof input.content !== "string" || !input.content.trim()) throw new ListeningFailure(400, "VALIDATION", "스크립트 파일이 비어 있습니다.");
  if (Buffer.byteLength(input.content, "utf8") > MAX_SCRIPT_UPLOAD_BYTES) throw new ListeningFailure(413, "TOO_LARGE", "스크립트 파일은 2MB까지 업로드할 수 있습니다.");
  const segments = input.format === "json" ? parseJsonScript(input.content) : input.format === "srt" ? parseSrtScript(input.content) : parseTxtScript(input.content);
  return replaceListeningScript(db, audioId, {
    revision: input.revision,
    segments,
    source: input.source ?? "ui_upload",
    format: input.format,
    filename: input.filename,
    contentHash: createHash("sha256").update(input.content).digest("hex"),
  });
}

export function replaceListeningScript(db: AppDatabase, audioId: string, input: {
  revision: number;
  segments: unknown;
  source?: "ui_upload" | "external_api";
  format?: ScriptUploadFormat;
  filename?: string;
  contentHash?: string;
}) {
  const { audio, script } = getActiveTranscript(db, audioId);
  if (!Number.isInteger(input.revision) || input.revision !== audio.revision) throw new ListeningFailure(409, "CONFLICT", "스크립트가 다른 곳에서 변경되었습니다.");
  const source = input.source ?? "external_api";
  const contentHash = input.contentHash || createHash("sha256").update(JSON.stringify(input.segments)).digest("hex");
  const segments = normalizeUploadedSegments(input.segments, `upload:${contentHash.slice(0, 16)}`);
  const last = segments.at(-1);
  if (input.format === "txt" && last && audio.durationMs !== null && audio.durationMs > last.startMs) {
    segments[segments.length - 1] = { ...last, endMs: audio.durationMs };
  }
  validateEditedSegments(segments, audio.durationMs);
  const version = createTranscriptVersion(db, {
    audioId,
    kind: "manual_edit",
    basedOnId: script?.id ?? null,
    language: segments.some((segment) => segment.ko !== null) ? "ja-ko" : "ja",
    rawPayload: {
      source,
      format: input.format ?? "json",
      filename: safeUploadName(input.filename),
      sha256: contentHash,
      segmentCount: segments.length,
    },
    segments,
  });
  const activation = activateTranscriptVersion(db, audioId, version.id, input.revision);
  return { audio: activation.audio, script: version };
}

export function detectScriptUploadFormat(filename: string, content: string): ScriptUploadFormat {
  const extension = /\.([^.]+)$/.exec(filename.trim().toLowerCase())?.[1];
  if (extension === "json" || extension === "srt" || extension === "txt") return extension;
  const normalized = content.replace(/^\uFEFF/, "").trimStart();
  if (normalized.startsWith("{") || normalized.startsWith("[")) return "json";
  if (/\d{1,3}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(normalized)) return "srt";
  if (/^\[\d+:\d{2}[,.]\d{3}\]/m.test(normalized)) return "txt";
  throw new ListeningFailure(400, "VALIDATION", "JSON, SRT 또는 TXT 스크립트 파일을 업로드해 주세요.");
}

export function activateScriptVersion(db: AppDatabase, audioId: string, versionId: string, revision: number) {
  getTranscriptVersion(db, versionId);
  return activateTranscriptVersion(db, audioId, versionId, revision, true);
}

function parseJsonScript(content: string) {
  let parsed: unknown;
  try { parsed = JSON.parse(content.replace(/^\uFEFF/, "")); }
  catch { throw new ListeningFailure(400, "VALIDATION", "스크립트 JSON 형식이 올바르지 않습니다."); }
  if (Array.isArray(parsed)) return parsed;
  if (isRecord(parsed) && Array.isArray(parsed.segments)) return parsed.segments;
  if (isRecord(parsed) && isRecord(parsed.data) && Array.isArray(parsed.data.segments)) return parsed.data.segments;
  throw new ListeningFailure(400, "VALIDATION", "JSON에 segments 배열이 필요합니다.");
}

function parseSrtScript(content: string) {
  const blocks = normalizedUploadText(content).split(/\n{2,}/).filter(Boolean);
  const segments = blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trimEnd());
    if (/^\d+$/.test(lines[0]?.trim() || "")) lines.shift();
    const timing = /^(\d{1,3}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,3}:\d{2}:\d{2}[,.]\d{3})(?:\s+.*)?$/.exec(lines.shift()?.trim() || "");
    if (!timing) throw new ListeningFailure(400, "VALIDATION", `SRT ${index + 1}번 문장의 시간 형식을 확인해 주세요.`);
    const textLines = lines.map((line) => line.trim()).filter(Boolean);
    if (!textLines.length) throw new ListeningFailure(400, "VALIDATION", `SRT ${index + 1}번 문장이 비어 있습니다.`);
    const primary = extractSpeaker(textLines[0]);
    return {
      startMs: parseSrtTimestamp(timing[1]), endMs: parseSrtTimestamp(timing[2]), speaker: primary.speaker,
      ja: primary.text, ko: textLines.length > 1 ? textLines.slice(1).join("\n") : null,
      needsReview: false, reviewNote: null,
    };
  });
  if (!segments.length) throw new ListeningFailure(400, "VALIDATION", "SRT 문장을 찾을 수 없습니다.");
  return segments;
}

function parseTxtScript(content: string) {
  const blocks = normalizedUploadText(content).split(/\n{2,}/).filter(Boolean);
  const parsed = blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timestamp = /^\[(\d+):(\d{2})[.,](\d{3})\]\s*(.*)$/.exec(lines.shift() || "");
    if (!timestamp || !timestamp[4].trim()) throw new ListeningFailure(400, "VALIDATION", `TXT ${index + 1}번 문장의 시간 또는 일본어를 확인해 주세요.`);
    const primary = extractSpeaker(timestamp[4]);
    return {
      startMs: Number(timestamp[1]) * 60_000 + Number(timestamp[2]) * 1_000 + Number(timestamp[3]),
      speaker: primary.speaker, ja: primary.text, ko: lines.length ? lines.join("\n") : null,
    };
  });
  if (!parsed.length) throw new ListeningFailure(400, "VALIDATION", "TXT 문장을 찾을 수 없습니다.");
  return parsed.map((segment, index) => ({
    ...segment,
    endMs: index + 1 < parsed.length ? parsed[index + 1].startMs : segment.startMs + 5_000,
    needsReview: false,
    reviewNote: null,
  }));
}

function normalizeUploadedSegments(value: unknown, sourcePrefix: string): Array<Omit<ListeningSegment, "id" | "ordinal">> {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10_000) throw new ListeningFailure(400, "VALIDATION", "스크립트 문장 수가 올바르지 않습니다.");
  return value.map((item, index) => {
    if (!isRecord(item)) throw new ListeningFailure(400, "VALIDATION", `${index + 1}번 문장 형식을 확인해 주세요.`);
    const speaker = item.speaker === undefined || item.speaker === null ? null : validSpeaker(item.speaker);
    const ko = item.ko === undefined || item.ko === null || item.ko === "" ? null : validText(item.ko, "한국어 문장", false);
    const reviewNote = item.reviewNote === undefined || item.reviewNote === null || item.reviewNote === "" ? null : validText(item.reviewNote, "검토 메모", false, 500);
    return {
      startMs: Number(item.startMs),
      endMs: Number(item.endMs),
      speaker,
      ja: validText(item.ja, "일본어 문장"),
      ko,
      needsReview: typeof item.needsReview === "boolean" ? item.needsReview : false,
      reviewNote,
      sourceSegmentIds: [`${sourcePrefix}:${index}`],
    };
  });
}

function parseSrtTimestamp(value: string) {
  const match = /^(\d{1,3}):(\d{2}):(\d{2})[,.](\d{3})$/.exec(value);
  if (!match || Number(match[2]) > 59 || Number(match[3]) > 59) throw new ListeningFailure(400, "VALIDATION", "SRT 시간 형식을 확인해 주세요.");
  return Number(match[1]) * 3_600_000 + Number(match[2]) * 60_000 + Number(match[3]) * 1_000 + Number(match[4]);
}

function normalizedUploadText(value: string) { return value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim(); }
function extractSpeaker(value: string) {
  const match = /^([^:：\n]{1,50})[:：]\s+(.+)$/.exec(value.trim());
  return match ? { speaker: match[1].trim(), text: match[2].trim() } : { speaker: null, text: value.trim() };
}
function safeUploadName(value: string | undefined) {
  if (!value) return null;
  const name = value.replaceAll("\0", "").split(/[\\/]/).pop()?.trim() || "";
  return [...name].filter((character) => character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127).join("").slice(0, 255) || null;
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

function applyUpdate(segments: ListeningSegment[], operation: Extract<ScriptEditOperation, { type: "update" }>) {
  const index = segments.findIndex((segment) => segment.id === operation.segmentId);
  if (index < 0) throw new ListeningFailure(404, "NOT_FOUND", "수정할 문장을 찾을 수 없습니다.");
  const current = segments[index];
  const next = {
    ...current,
    startMs: operation.startMs === undefined ? current.startMs : operation.startMs,
    endMs: operation.endMs === undefined ? current.endMs : operation.endMs,
    ja: operation.ja === undefined ? current.ja : validText(operation.ja, "일본어 문장"),
    ko: operation.ko === undefined ? current.ko : operation.ko === null ? null : validText(operation.ko, "한국어 문장", true),
    speaker: operation.speaker === undefined ? current.speaker : validSpeaker(operation.speaker),
    needsReview: operation.needsReview === undefined ? current.needsReview : Boolean(operation.needsReview),
    reviewNote: operation.reviewNote === undefined ? current.reviewNote : operation.reviewNote === null ? null : validText(operation.reviewNote, "검토 메모", true, 500),
  };
  return segments.with(index, next);
}

function validateEditedSegments(segments: Array<Pick<ListeningSegment, "startMs" | "endMs">>, durationMs: number | null) {
  let previousStart = -1;
  for (const segment of segments) {
    if (!Number.isInteger(segment.startMs) || !Number.isInteger(segment.endMs) || segment.startMs < 0 || segment.endMs <= segment.startMs || segment.startMs < previousStart) {
      throw new ListeningFailure(400, "VALIDATION", "문장 시간 범위를 확인해 주세요.");
    }
    if (durationMs !== null && segment.endMs > durationMs + 1_500) throw new ListeningFailure(400, "VALIDATION", "문장 시간이 음원 길이를 벗어났습니다.");
    previousStart = segment.startMs;
  }
}

function applySplit(segments: ListeningSegment[], operation: Extract<ScriptEditOperation, { type: "split" }>) {
  const index = segments.findIndex((segment) => segment.id === operation.segmentId);
  if (index < 0) throw new ListeningFailure(404, "NOT_FOUND", "나눌 문장을 찾을 수 없습니다.");
  const current = segments[index];
  if (!Number.isInteger(operation.atMs) || operation.atMs <= current.startMs || operation.atMs >= current.endMs || !Array.isArray(operation.ja) || operation.ja.length !== 2) {
    throw new ListeningFailure(400, "VALIDATION", "문장 분할 위치를 확인해 주세요.");
  }
  const ko = operation.ko && Array.isArray(operation.ko) && operation.ko.length === 2 ? operation.ko : [null, null];
  const first = { ...current, id: `${current.id}:a`, endMs: operation.atMs, ja: validText(operation.ja[0], "일본어 문장"), ko: ko[0] === null ? null : validText(ko[0], "한국어 문장", true) };
  const second = { ...current, id: `${current.id}:b`, startMs: operation.atMs, ja: validText(operation.ja[1], "일본어 문장"), ko: ko[1] === null ? null : validText(ko[1], "한국어 문장", true) };
  return [...segments.slice(0, index), first, second, ...segments.slice(index + 1)];
}

function applyMerge(segments: ListeningSegment[], operation: Extract<ScriptEditOperation, { type: "merge" }>) {
  if (!Array.isArray(operation.segmentIds) || operation.segmentIds.length < 2) throw new ListeningFailure(400, "VALIDATION", "합칠 문장을 두 개 이상 선택해 주세요.");
  const indices = operation.segmentIds.map((segmentId) => segments.findIndex((segment) => segment.id === segmentId));
  if (indices.some((index) => index < 0) || indices.some((index, position) => position > 0 && index !== indices[position - 1] + 1)) throw new ListeningFailure(400, "VALIDATION", "연속한 문장만 합칠 수 있습니다.");
  const selected = indices.map((index) => segments[index]);
  const firstIndex = indices[0];
  const speakers = new Set(selected.map((segment) => segment.speaker));
  const merged: ListeningSegment = {
    ...selected[0],
    id: `${selected[0].id}:merged`,
    startMs: selected[0].startMs,
    endMs: selected[selected.length - 1].endMs,
    speaker: speakers.size === 1 ? selected[0].speaker : null,
    ja: operation.ja === undefined ? selected.map((segment) => segment.ja).join("") : validText(operation.ja, "일본어 문장"),
    ko: operation.ko === undefined ? selected.every((segment) => segment.ko !== null) ? selected.map((segment) => segment.ko).join(" ") : null : operation.ko === null ? null : validText(operation.ko, "한국어 문장", true),
    needsReview: selected.some((segment) => segment.needsReview),
    reviewNote: selected.map((segment) => segment.reviewNote).filter(Boolean).join(" / ") || null,
    sourceSegmentIds: [...new Set(selected.flatMap((segment) => segment.sourceSegmentIds))],
  };
  return [...segments.slice(0, firstIndex), merged, ...segments.slice(indices[indices.length - 1] + 1)];
}

function validText(value: unknown, label: string, allowEmpty = false, max = 10_000) {
  if (typeof value !== "string" || (!allowEmpty && !value.trim()) || value.length > max) throw new ListeningFailure(400, "VALIDATION", `${label}을(를) 확인해 주세요.`);
  return value.trim();
}

function validSpeaker(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 50) throw new ListeningFailure(400, "VALIDATION", "화자 정보를 확인해 주세요.");
  return value.trim() || null;
}

function formatSrtTime(milliseconds: number) {
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const ms = milliseconds % 1_000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(ms, 3)}`;
}

function formatClock(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const ms = milliseconds % 1_000;
  return `${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(ms, 3)}`;
}

function pad(value: number, length: number) { return String(value).padStart(length, "0"); }
function safeExportName(value: string) { return [...value].filter((character) => character.charCodeAt(0) > 31 && !/[\\/:*?"<>|]/.test(character)).join("").trim().slice(0, 120) || "transcript"; }

