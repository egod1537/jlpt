import "server-only";

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
  | { type: "update"; segmentId: string; ja?: string; ko?: string | null; speaker?: string | null; needsReview?: boolean; reviewNote?: string | null }
  | { type: "split"; segmentId: string; atMs: number; ja: [string, string]; ko?: [string | null, string | null] }
  | { type: "merge"; segmentIds: string[]; ja?: string; ko?: string | null };

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

export function activateScriptVersion(db: AppDatabase, audioId: string, versionId: string, revision: number) {
  getTranscriptVersion(db, versionId);
  return activateTranscriptVersion(db, audioId, versionId, revision, true);
}

function applyUpdate(segments: ListeningSegment[], operation: Extract<ScriptEditOperation, { type: "update" }>) {
  const index = segments.findIndex((segment) => segment.id === operation.segmentId);
  if (index < 0) throw new ListeningFailure(404, "NOT_FOUND", "수정할 문장을 찾을 수 없습니다.");
  const current = segments[index];
  const next = {
    ...current,
    ja: operation.ja === undefined ? current.ja : validText(operation.ja, "일본어 문장"),
    ko: operation.ko === undefined ? current.ko : operation.ko === null ? null : validText(operation.ko, "한국어 문장", true),
    speaker: operation.speaker === undefined ? current.speaker : validSpeaker(operation.speaker),
    needsReview: operation.needsReview === undefined ? current.needsReview : Boolean(operation.needsReview),
    reviewNote: operation.reviewNote === undefined ? current.reviewNote : operation.reviewNote === null ? null : validText(operation.reviewNote, "검토 메모", true, 500),
  };
  return segments.with(index, next);
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

