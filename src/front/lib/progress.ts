import { initialRecord, schedule } from "@/lib/review-scheduler";
import type { ProgressState, Rating, StudyRecord, StudySessionState } from "@/lib/types";

export const PROGRESS_KEY = "jlpt-vocab:progress:v1";
export const SESSION_KEY = "jlpt-vocab:session:v1";
export const PROGRESS_EVENT = "jlpt-vocab:progress-change";
export const SESSION_EVENT = "jlpt-vocab:session-change";
const wordIdPattern = /^word-[a-f0-9]{12}$/;

export const emptyProgress = (): ProgressState => ({ schemaVersion: 1, updatedAt: new Date(0).toISOString(), records: {} });

function validDate(value: unknown, nullable = false): value is string | null {
  return nullable && value === null || typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function parseProgress(value: unknown): ProgressState {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("백업 파일은 JSON 객체여야 합니다.");
  const data = value as Partial<ProgressState>;
  if (data.schemaVersion !== 1) throw new Error("지원하지 않는 백업 버전입니다.");
  if (!validDate(data.updatedAt) || !data.records || typeof data.records !== "object" || Array.isArray(data.records)) throw new Error("백업 메타데이터가 올바르지 않습니다.");
  const records: Record<string, StudyRecord> = {};
  for (const [wordId, raw] of Object.entries(data.records)) {
    if (!wordIdPattern.test(wordId) || !raw || typeof raw !== "object") throw new Error("잘못된 단어 ID가 포함되어 있습니다.");
    const record = raw as StudyRecord;
    const numeric = [record.repetitions, record.intervalDays, record.easeFactor, record.lapses];
    if (record.wordId !== wordId || numeric.some((item) => typeof item !== "number" || !Number.isFinite(item) || item < 0) || record.easeFactor < 1.3 || record.easeFactor > 3 || !Number.isInteger(record.repetitions) || !Number.isInteger(record.intervalDays) || !Number.isInteger(record.lapses)) throw new Error(`${wordId}의 학습 수치가 올바르지 않습니다.`);
    if (!validDate(record.dueAt, true) || !validDate(record.lastReviewedAt, true) || ![null, "again", "hard", "good", "easy"].includes(record.lastRating)) throw new Error(`${wordId}의 날짜 또는 평가가 올바르지 않습니다.`);
    if (record.knownFlag !== undefined && typeof record.knownFlag !== "boolean") throw new Error(`${wordId}의 완료 상태가 올바르지 않습니다.`);
    records[wordId] = { wordId, repetitions: record.repetitions, intervalDays: record.intervalDays, easeFactor: record.easeFactor, dueAt: record.dueAt, lastReviewedAt: record.lastReviewedAt, lastRating: record.lastRating, lapses: record.lapses, ...(record.knownFlag === undefined ? {} : { knownFlag: record.knownFlag }) };
  }
  return { schemaVersion: 1, updatedAt: data.updatedAt, records };
}

export function loadProgress(storage: Pick<Storage, "getItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage): ProgressState {
  if (!storage) return emptyProgress();
  try {
    const raw = storage.getItem(PROGRESS_KEY);
    return raw ? parseProgress(JSON.parse(raw) as unknown) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState, storage: Pick<Storage, "setItem"> | undefined = typeof window === "undefined" ? undefined : window.localStorage): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(state));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(PROGRESS_EVENT));
    return true;
  } catch { return false; }
}

export function rateWord(wordId: string, rating: Rating, now = new Date()): { state: ProgressState; persisted: boolean } {
  const current = loadProgress();
  const previous = current.records[wordId] ?? initialRecord(wordId);
  const record = { ...schedule(previous, rating, now), wordId };
  const state = { schemaVersion: 1 as const, updatedAt: now.toISOString(), records: { ...current.records, [wordId]: record } };
  return { state, persisted: saveProgress(state) };
}

export function exportProgress(state = loadProgress()): string {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function dueRecords(state: ProgressState, now = new Date()): StudyRecord[] {
  return Object.values(state.records).filter((record) => record.dueAt !== null && Date.parse(record.dueAt) <= now.getTime()).sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
}

export function resetAppStorage(storage: Pick<Storage, "removeItem"> = window.localStorage) {
  storage.removeItem(PROGRESS_KEY);
  storage.removeItem(SESSION_KEY);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PROGRESS_EVENT));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
}

export function saveSession(session: StudySessionState): boolean {
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(session)); window.dispatchEvent(new Event(SESSION_EVENT)); return true; } catch { return false; }
}

export function parseSession(raw: unknown): StudySessionState {
  if (!raw || typeof raw !== "object") throw new Error("세션 데이터가 올바르지 않습니다.");
  const value = raw as Partial<StudySessionState>;
  if (value.schemaVersion !== 1 || !Array.isArray(value.wordIds) || value.wordIds.some((id) => typeof id !== "string" || !wordIdPattern.test(id)) || typeof value.position !== "number" || value.position < 0 || !Array.isArray(value.books) || !validDate(value.updatedAt) || !["all", "unseen", "due"].includes(value.mode ?? "") || typeof value.includeReview !== "boolean" || typeof value.revealed !== "boolean" || !value.ratings || typeof value.ratings !== "object") throw new Error("세션 데이터가 올바르지 않습니다.");
  return value as StudySessionState;
}

export function loadSession(): StudySessionState | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(SESSION_KEY); return raw ? parseSession(JSON.parse(raw) as unknown) : null; }
  catch { return null; }
}
