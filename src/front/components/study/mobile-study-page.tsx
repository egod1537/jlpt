"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { ArrowLeft, Infinity as InfinityIcon, RotateCcw, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientDatabase } from "@/lib/sync/client-db";
import { useSync } from "@/components/sync/sync-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { nextStudyQueue } from "@/lib/study-queue";
import { resolveStudyTitle } from "@/lib/study-title";
import { FittedStudyTerm, FittedStudyDetails } from "@/components/study/fitted-study-term";

type Rating = "again" | "hard" | "good" | "easy";
type Mode = "all" | "unseen" | "due" | "weak";
type Book = { id: string; title: string; folderId: string | null };
type Folder = { id: string; name: string; parentId: string | null };
type Entry = { entryId: string; bookId: string; wordId: string; term: string; reading: string | null; meanings: string[]; primaryMeaning: string | null; nuance: string | null; partOfSpeech: string[]; examples: Array<{ ja: string; ko?: string | null }>; tags: string[]; status: string; bookTitle: string; bookmarked: boolean; bookmarkRevision: number };
type Card = { wordId: string; representative: Entry; occurrences: Entry[]; review: { dueAt: string | null; lastReviewedAt: string | null; lastRating: string | null } };
type Result = { wordId: string; rating: Rating; occurredAt: string };
type Session = { id: string; bookIds: string[]; mode: Mode; includeReview: boolean; wordIds: string[]; position: number; revealed: boolean; ratings: Record<string, Rating>; queue?: string[]; loopMode?: boolean; results?: Result[]; status: string; revision: number; createdAt: string; updatedAt?: string };
type Phase = "initializing" | "loading" | "range" | "study" | "complete" | "empty";
type Filters = { minStar: number; bookmarks: boolean; pos: string; chunk: string };
type CardRange = { start: number; end: number; count: number };
type RangeMenu = { cards: Card[]; bookIds: string[]; mode: Mode; includeReview: boolean };

function formatElapsed(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}

function cardRanges(total: number, size: number): CardRange[] {
  return Array.from({ length: Math.ceil(total / size) }, (_, index) => {
    const start = index * size;
    const end = Math.min(start + size, total);
    return { start, end, count: end - start };
  });
}

function sessionUpdatedAt(session: Session) {
  return session.updatedAt || session.createdAt;
}

function sortSessions(sessions: Session[]) {
  const activeRank = (session: Session) => session.status === "active" ? 2 : session.status === "paused" ? 1 : 0;
  return [...sessions].sort((a, b) => sessionUpdatedAt(b).localeCompare(sessionUpdatedAt(a)) || activeRank(b) - activeRank(a));
}

function mergeSessions(...groups: Session[][]) {
  const merged = new Map<string, Session>();
  for (const session of groups.flat()) {
    const current = merged.get(session.id);
    if (!current || session.revision > current.revision || (session.revision === current.revision && sessionUpdatedAt(session) > sessionUpdatedAt(current))) merged.set(session.id, session);
  }
  return sortSessions([...merged.values()]);
}

function sameIds(left: string[], right: string[], orderMatters = true) {
  if (left.length !== right.length) return false;
  const a = orderMatters ? left : [...left].sort();
  const b = orderMatters ? right : [...right].sort();
  return a.every((value, index) => value === b[index]);
}

function sessionForRange(sessions: Session[], bookIds: string[], mode: Mode, includeReview: boolean, wordIds: string[], resumableOnly = false) {
  return sessions.find((session) => (!resumableOnly || session.status === "active" || session.status === "paused")
    && sameIds(session.bookIds, bookIds, false)
    && session.mode === mode
    && session.includeReview === includeReview
    && sameIds(session.wordIds, wordIds));
}

function sessionProgress(session: Session | undefined, total: number) {
  if (!session) return 0;
  if (session.status === "completed") return total;
  const remaining = new Set(session.queue?.length ? session.queue : session.wordIds.slice(session.position || 0)).size;
  return Math.max(0, Math.min(total, total - remaining));
}

function highlightedExample(value: string): ReactNode[] {
  const pieces = value.split(/(【[^】]+】)/g);
  return pieces.filter(Boolean).map((piece, index) => piece.startsWith("【") && piece.endsWith("】")
    ? <mark key={index} className="bg-transparent font-medium text-app-accent underline decoration-1 underline-offset-4">{piece.slice(1, -1)}</mark>
    : <span key={index}>{piece}</span>);
}

function sourcePriority(entry: Entry) {
  const tag = entry.tags.find((value) => value.startsWith("source-star:"));
  return tag ? Number(tag.slice("source-star:".length)) : 0;
}

function sourceIndex(entry: Entry) {
  const tag = entry.tags.find((value) => value.startsWith("source-index:"));
  return tag ? Number(tag.slice("source-index:".length)) : null;
}

export function MobileStudyPage() {
  const router = useRouter();
  const search = useSearchParams();
  const requestedScope = search.get("folder") ? "folder:" + search.get("folder") : search.get("books") || "";
  const requestedMode = (["unseen", "due", "weak"].includes(search.get("mode") || "") ? search.get("mode") : "all") as Mode;
  const explicitStart = search.get("start") === "1" || Boolean(requestedScope) || search.has("mode");
  const requestedLimitValue = search.get("limit");
  const requestedLimit = requestedLimitValue === null || requestedLimitValue === "all" ? 10_000 : Math.min(Math.max(Number(requestedLimitValue) || 1, 1), 10_000);
  const requestedIncludeReview = search.get("includeReview") !== "false";
  const requestedRangeStart = Number(search.get("rangeStart"));
  const requestedRangeSize = Number(search.get("rangeSize"));
  const hasRequestedRange = search.get("range") === "all" || (Number.isInteger(requestedRangeStart) && requestedRangeStart >= 0 && Number.isInteger(requestedRangeSize) && requestedRangeSize > 0);
  const requestedFilters = useMemo<Filters>(() => ({
    minStar: Math.min(Math.max(Number(search.get("minStar") || 0) || 0, 0), 3),
    bookmarks: search.get("bookmarks") === "true",
    pos: search.get("pos") || "",
    chunk: search.get("chunk") || "",
  }), [search]);
  const { queue: queueMutation } = useSync();
  const [books, setBooks] = useState<Book[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [studySessions, setStudySessions] = useState<Session[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [phase, setPhase] = useState<Phase>("initializing");
  const [rangeMenu, setRangeMenu] = useState<RangeMenu | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [roundQueue, setRoundQueue] = useState<string[]>([]);
  const [initialWordIds, setInitialWordIds] = useState<string[]>([]);
  const [showReading, setShowReading] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loopMode, setLoopMode] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [mode, setMode] = useState<Mode>(requestedMode);
  const [includeReview, setIncludeReview] = useState(requestedIncludeReview);
  const [sessionId, setSessionId] = useState("");
  const [sessionTitle, setSessionTitle] = useState("학습 카드");
  const [sessionStartedAt, setSessionStartedAt] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [restartOpen, setRestartOpen] = useState(false);
  const [restartPending, setRestartPending] = useState(false);
  const revision = useRef(1);
  const ratingLock = useRef(false);
  const startLock = useRef(false);
  const restartLock = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const initializationHandled = useRef(false);

  const cardByWordId = useMemo(() => new Map(cards.map((card) => [card.wordId, card])), [cards]);
  const resumableSessions = useMemo(() => studySessions.filter((session) => session.status === "active" || session.status === "paused"), [studySessions]);
  const card = roundQueue.length ? cardByWordId.get(roundQueue[0]) : undefined;
  const entry = card?.representative;
  const completed = Math.max(0, initialWordIds.length - new Set(roundQueue).size);
  const rangeTitle = resolveStudyTitle({ scope: requestedScope, bookIds: [], mode: requestedMode, books, folders });

  useEffect(() => {
    const active = phase === "loading" || phase === "range" || phase === "study" || phase === "complete";
    window.dispatchEvent(new CustomEvent("jlpt-study-active", { detail: { active } }));
    return () => { window.dispatchEvent(new CustomEvent("jlpt-study-active", { detail: { active: false } })); };
  }, [phase]);

  useEffect(() => {
    void (async () => {
      const db = await clientDatabase();
      const [cachedBooks, cachedFolders, cachedSessions] = await Promise.all([db.getAll("books"), db.getAll("folders"), db.getAll("studySessions")]);
      let nextBooks = cachedBooks as unknown as Book[];
      let nextFolders = cachedFolders as unknown as Folder[];
      let nextSessions = sortSessions(cachedSessions as unknown as Session[]);
      try {
        const response = await fetch("/api/bootstrap", { cache: "no-store" });
        if (response.ok) {
          const bootstrap = await response.json() as { books: Book[]; folders: Folder[]; activeSessions: Session[]; studySessions?: Session[] };
          nextBooks = bootstrap.books;
          nextFolders = bootstrap.folders;
          nextSessions = mergeSessions(nextSessions, bootstrap.studySessions || [], bootstrap.activeSessions);
        }
      } catch { /* offline cache remains available */ }
      setBooks(nextBooks);
      setFolders(nextFolders);
      setStudySessions(nextSessions);
      setInitialized(true);
    })();
  }, []);

  useEffect(() => {
    if (phase !== "study" || !sessionStartedAt) return;
    const tick = () => setElapsed(Date.now() - Date.parse(sessionStartedAt));
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [phase, sessionStartedAt]);

  const getCards = useCallback(async (config: { bookIds: string[]; mode: Mode; includeReview: boolean; limit: number; seed: number; filters: Filters }) => {
    const query = new URLSearchParams({ mode: config.mode, includeReview: String(config.includeReview), limit: String(config.limit), seed: String(config.seed) });
    if (config.bookIds.length) query.set("books", config.bookIds.join(","));
    if (config.filters.minStar) query.set("minStar", String(config.filters.minStar));
    if (config.filters.bookmarks) query.set("bookmarks", "true");
    if (config.filters.pos) query.set("pos", config.filters.pos);
    if (config.filters.chunk) query.set("chunk", config.filters.chunk);
    try {
      const response = await fetch("/api/study/cards?" + query, { cache: "no-store" });
      if (!response.ok) throw new Error();
      return (await response.json() as { cards: Card[] }).cards;
    } catch {
      const db = await clientDatabase();
      const entries = await db.getAll("entries") as unknown as Entry[];
      const states = new Map((await db.getAll("reviewStates") as Array<Record<string, unknown>>).map((state) => [String(state.wordId), state]));
      const bookmarks = new Set((await db.getAll("bookmarks")).map((bookmark) => String(bookmark.entryId)));
      const groups = new Map<string, Entry[]>();
      entries.filter((item) => !config.bookIds.length || config.bookIds.includes(item.bookId)).forEach((item) => {
        const hydrated = { ...item, bookmarked: bookmarks.has(item.entryId), bookmarkRevision: 0 };
        if (config.filters.bookmarks && !hydrated.bookmarked) return;
        if (config.filters.minStar && sourcePriority(hydrated) < config.filters.minStar) return;
        if (config.filters.pos && !hydrated.partOfSpeech.includes(config.filters.pos)) return;
        if (config.filters.chunk) {
          const chunk = Number(config.filters.chunk);
          const index = sourceIndex(hydrated);
          if (index === null || index < (chunk - 1) * 50 + 1 || index > Math.min(chunk * 50, 268)) return;
        }
        groups.set(item.wordId, [...(groups.get(item.wordId) || []), hydrated]);
      });
      return [...groups.entries()].flatMap(([wordId, occurrences]) => {
        const ready = occurrences.find((item) => item.status === "ready");
        if (!ready && !config.includeReview) return [];
        const state = states.get(wordId);
        if (config.mode === "unseen" && state?.lastReviewedAt) return [];
        if (config.mode === "due" && (!state?.dueAt || Date.parse(String(state.dueAt)) > Date.now())) return [];
        if (config.mode === "weak" && !new Set(["again", "hard"]).has(String(state?.lastRating))) return [];
        return [{ wordId, representative: ready || occurrences[0], occurrences, review: { dueAt: state?.dueAt as string || null, lastReviewedAt: state?.lastReviewedAt as string || null, lastRating: state?.lastRating as string || null } }];
      }).slice(0, config.limit);
    }
  }, []);

  const booksForScope = useCallback((value: string) => {
    if (!value) return [];
    if (!value.startsWith("folder:")) return [value];
    const root = value.slice(7);
    const included = new Set([root]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const folder of folders) if (folder.parentId && included.has(folder.parentId) && !included.has(folder.id)) { included.add(folder.id); changed = true; }
    }
    return books.filter((book) => book.folderId && included.has(book.folderId)).map((book) => book.id);
  }, [books, folders]);

  const saveSession = useCallback(async (payload: Record<string, unknown>) => {
    if (!sessionId) return;
    const expected = revision.current;
    await queueMutation({ type: "session.update", targetId: sessionId, expectedRevision: expected, payload });
    revision.current = expected + 1;
  }, [queueMutation, sessionId]);

  const begin = useCallback(async (existing?: Session) => {
    if (startLock.current) return;
    startLock.current = true;
    setPhase("loading"); setMessage(""); setNotice(""); setShowReading(false); setShowMeaning(false); ratingLock.current = false;
    try {
      const selectedBooks = existing?.bookIds || booksForScope(requestedScope);
      const selectedMode = existing ? "all" : requestedMode;
      const selectedReview = existing ? true : requestedIncludeReview;
      if (!existing && requestedScope.startsWith("folder:") && !selectedBooks.length) {
        setMessage("이 폴더에는 학습할 단어장이 없습니다.");
        setPhase("empty");
        return;
      }
      const available = await getCards({ bookIds: selectedBooks, mode: selectedMode, includeReview: selectedReview, limit: existing ? 10_000 : requestedLimit, seed: existing ? 0 : search.get("shuffle") === "true" ? Date.now() : 0, filters: existing ? { minStar: 0, bookmarks: false, pos: "", chunk: "" } : requestedFilters });
      if (!existing && !hasRequestedRange && available.length > 50) {
        setRangeMenu({ cards: available, bookIds: selectedBooks, mode: requestedMode, includeReview: selectedReview });
        setPhase("range");
        return;
      }
      const list = !existing && search.get("range") !== "all" && hasRequestedRange ? available.slice(requestedRangeStart, requestedRangeStart + requestedRangeSize) : available;
      const matchingSession = existing || sessionForRange(studySessions, selectedBooks, requestedMode, selectedReview, list.map((item) => item.wordId), true);
      const byId = new Map(list.map((item) => [item.wordId, item]));
      const originalIds = matchingSession?.wordIds || list.map((item) => item.wordId);
      const queueIds = matchingSession ? (matchingSession.queue?.length ? matchingSession.queue : matchingSession.wordIds.slice(matchingSession.position || 0)).filter((id) => byId.has(id)) : originalIds;
      const ordered = originalIds.flatMap((id) => byId.get(id) || []);
      if (!ordered.length || !queueIds.length) {
        setMessage(selectedMode === "due" ? "현재 복습할 단어가 없습니다." : "조건에 맞는 학습 카드가 없습니다. 오프라인이라면 먼저 해당 단어장을 열어 캐시해 주세요.");
        setPhase("empty");
        return;
      }
      if (matchingSession && queueIds.length !== (matchingSession.queue?.length || matchingSession.wordIds.length - matchingSession.position)) setNotice("삭제되었거나 범위에서 빠진 카드는 건너뛰었습니다.");
      setSessionTitle(resolveStudyTitle({ scope: existing ? "" : requestedScope, bookIds: selectedBooks, mode: matchingSession?.mode || requestedMode, books, folders }));
      setRangeMenu(null); setCards(ordered); setRoundQueue(queueIds); setInitialWordIds(originalIds); setResults(matchingSession?.results || []); setLoopMode(matchingSession?.loopMode || false);
      const changedAt = new Date().toISOString();
      const otherActiveSessions = studySessions.filter((session) => session.status === "active" && session.id !== matchingSession?.id);
      for (const activeSession of otherActiveSessions) {
        await queueMutation({ type: "session.update", targetId: activeSession.id, expectedRevision: activeSession.revision, payload: { status: "paused" } });
      }
      if (matchingSession) {
        let nextRevision = matchingSession.revision;
        if (matchingSession.status !== "active") {
          await queueMutation({ type: "session.update", targetId: matchingSession.id, expectedRevision: matchingSession.revision, payload: { status: "active" } });
          nextRevision += 1;
        }
        setStudySessions((current) => sortSessions(current.map((session) => {
          if (session.id === matchingSession.id && matchingSession.status !== "active") return { ...session, status: "active", revision: nextRevision, updatedAt: changedAt };
          if (otherActiveSessions.some((activeSession) => activeSession.id === session.id)) return { ...session, status: "paused", revision: session.revision + 1, updatedAt: changedAt };
          return session;
        })));
        setMode(matchingSession.mode);
        setIncludeReview(matchingSession.includeReview);
        setSessionId(matchingSession.id); setSessionStartedAt(matchingSession.createdAt); revision.current = nextRevision;
      } else {
        const id = "study-" + crypto.randomUUID();
        const startedAt = changedAt;
        const payload = { id, bookIds: selectedBooks, mode: requestedMode, includeReview: selectedReview, wordIds: originalIds, queue: queueIds, loopMode: false, results: [], position: 0, revealed: false, ratings: {}, status: "active" };
        await queueMutation({ type: "session.create", payload });
        setStudySessions((current) => sortSessions([
          { ...payload, revision: 1, createdAt: startedAt, updatedAt: startedAt } as Session,
          ...current.map((session) => otherActiveSessions.some((activeSession) => activeSession.id === session.id) ? { ...session, status: "paused", revision: session.revision + 1, updatedAt: changedAt } : session),
        ]));
        setMode(requestedMode);
        setIncludeReview(selectedReview);
        setSessionId(id); setSessionStartedAt(startedAt); setElapsed(0); revision.current = 1;
      }
      if (explicitStart) window.history.replaceState(window.history.state, "", "/study");
      setPhase("study");
    } catch {
      setMessage("학습 세션을 기기에 저장하지 못했습니다. 저장 공간과 동기화 상태를 확인한 뒤 다시 시도해 주세요.");
      setPhase("empty");
    } finally {
      startLock.current = false;
    }
  }, [books, booksForScope, explicitStart, folders, getCards, hasRequestedRange, queueMutation, requestedFilters, requestedIncludeReview, requestedLimit, requestedMode, requestedRangeSize, requestedRangeStart, requestedScope, search, setCards, setElapsed, setIncludeReview, setInitialWordIds, setLoopMode, setMessage, setMode, setNotice, setPhase, setRangeMenu, setResults, setRoundQueue, setSessionId, setSessionStartedAt, setSessionTitle, setShowMeaning, setShowReading, setStudySessions, studySessions]);

  useEffect(() => {
    if (!initialized || initializationHandled.current) return;
    initializationHandled.current = true;
    const timer = window.setTimeout(() => {
      if (explicitStart) void begin();
      else if (resumableSessions[0]) void begin(resumableSessions[0]);
      else router.replace("/books");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [begin, explicitStart, initialized, resumableSessions, router]);

  const pause = useCallback(async () => {
    try { await saveSession({ queue: roundQueue, loopMode, results, position: results.length, revealed: false, status: "paused" }); }
    catch { setNotice("학습 상태를 저장하지 못해 화면을 닫지 않았습니다."); return; }
    router.push("/books");
  }, [loopMode, results, roundQueue, router, saveSession, setNotice]);

  const toggleLoop = useCallback(async () => {
    const next = !loopMode;
    try { await saveSession({ loopMode: next, queue: roundQueue, results, status: "active" }); setLoopMode(next); }
    catch { setNotice("반복 설정을 저장하지 못했습니다."); }
  }, [loopMode, results, roundQueue, saveSession, setLoopMode, setNotice]);

  const toggleFavorite = useCallback(async () => {
    if (!entry) return;
    const next = !entry.bookmarked;
    try {
      await queueMutation({ type: "bookmark.set", ...(entry.bookmarkRevision ? { expectedRevision: entry.bookmarkRevision } : {}), payload: { entryId: entry.entryId, bookmarked: next } });
      setCards((current) => current.map((item) => item.wordId !== card?.wordId ? item : { ...item, representative: { ...item.representative, bookmarked: next, bookmarkRevision: next ? item.representative.bookmarkRevision : 0 }, occurrences: item.occurrences.map((occurrence) => occurrence.entryId === entry.entryId ? { ...occurrence, bookmarked: next, bookmarkRevision: next ? occurrence.bookmarkRevision : 0 } : occurrence) }));
    } catch { setNotice("즐겨찾기를 저장하지 못했습니다."); }
  }, [card?.wordId, entry, queueMutation, setCards, setNotice]);

  const rate = useCallback(async (rating: Rating) => {
    if (!card || ratingLock.current) return;
    ratingLock.current = true; setNotice("");
    const occurredAt = new Date().toISOString();
    const result = { wordId: card.wordId, rating, occurredAt };
    const nextResults = [...results, result];
    const nextQueue = nextStudyQueue(roundQueue, card.wordId, rating, loopMode);
    const latestRatings = Object.fromEntries(nextResults.map((item) => [item.wordId, item.rating]));
    try {
      await queueMutation({ operationId: crypto.randomUUID(), occurredAt, type: "review.rate", payload: { wordId: card.wordId, rating, sessionId, context: mode === "due" ? "scheduled" : card.review.lastReviewedAt ? "manual" : "new" } });
      await saveSession({ queue: nextQueue, loopMode, results: nextResults, position: nextResults.length, revealed: false, ratings: latestRatings, status: nextQueue.length ? "active" : "completed" });
    } catch {
      setNotice("평가 또는 학습 큐를 영구 저장하지 못했습니다. 다시 누르지 말고 페이지를 새로 열어 상태를 확인해 주세요.");
      return;
    }
    performance.mark("study-card-transition-start");
    setResults(nextResults); setRoundQueue(nextQueue); setShowMeaning(false); setShowReading(false);
    requestAnimationFrame(() => { performance.mark("study-card-transition-end"); performance.measure("study-card-transition", "study-card-transition-start", "study-card-transition-end"); });
    if (!nextQueue.length) setPhase("complete");
    ratingLock.current = false;
  }, [card, loopMode, mode, queueMutation, results, roundQueue, saveSession, sessionId, setNotice, setPhase, setResults, setRoundQueue, setShowMeaning, setShowReading]);

  const restart = useCallback(async (onlyWrong: boolean) => {
    if (restartLock.current || !sessionId) return;
    const latest = new Map(results.map((item) => [item.wordId, item.rating]));
    const nextCards = onlyWrong ? cards.filter((item) => ["again", "hard"].includes(latest.get(item.wordId) || "")) : cards;
    if (!nextCards.length) { router.push("/books"); return; }
    restartLock.current = true;
    setRestartPending(true);
    const id = "study-" + crypto.randomUUID();
    const wordIds = nextCards.map((item) => item.wordId);
    const bookIds = [...new Set(nextCards.flatMap((item) => item.occurrences.map((occurrence) => occurrence.bookId)))];
    try {
      await queueMutation({ type: "session.restart", targetId: sessionId, expectedRevision: revision.current, payload: { id, bookIds, mode: onlyWrong ? "weak" : mode, includeReview: onlyWrong ? true : includeReview, wordIds, queue: wordIds, loopMode: false, results: [], position: 0, revealed: false, ratings: {}, status: "active" } });
      setCards(nextCards); setRoundQueue(wordIds); setInitialWordIds(wordIds); setResults([]); setLoopMode(false); setShowMeaning(false); setShowReading(false); setSessionId(id); setSessionStartedAt(new Date().toISOString()); setElapsed(0); revision.current = 1; ratingLock.current = false; setRestartOpen(false); setNotice(""); setPhase("study");
    } catch {
      setNotice("새 라운드를 저장하지 못했습니다. 현재 학습 상태는 그대로 유지됩니다.");
    } finally {
      restartLock.current = false;
      setRestartPending(false);
    }
  }, [cards, includeReview, mode, queueMutation, results, router, sessionId, setCards, setElapsed, setInitialWordIds, setLoopMode, setNotice, setPhase, setRestartOpen, setRestartPending, setResults, setRoundQueue, setSessionId, setSessionStartedAt, setShowMeaning, setShowReading]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (phase !== "study" || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || target?.closest("input,select,textarea,[contenteditable=true]")) return;
      const code = event.code;
      if (code === "KeyQ" || event.key === "1") setShowMeaning((value) => !value);
      else if (code === "KeyW" || event.key === "2") setShowReading((value) => !value);
      else if (code === "KeyA" || event.key === "ArrowLeft") void rate("again");
      else if (code === "KeyS" || event.key === "ArrowRight") void rate("good");
      else if (code === "KeyB" || code === "KeyF") void toggleFavorite();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase, rate, toggleFavorite]);

  function touchBegin(event: TouchEvent) {
    const touch = event.changedTouches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY };
  }
  function touchEnd(event: TouchEvent) {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x; const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
    void rate(dx < 0 ? "again" : "good");
  }

  function toggleHint(kind: "meaning" | "reading") {
    const start = "study-hint-" + kind + "-start";
    const end = "study-hint-" + kind + "-end";
    performance.mark(start);
    if (kind === "meaning") setShowMeaning((value) => !value); else setShowReading((value) => !value);
    requestAnimationFrame(() => { performance.mark(end); performance.measure("study-hint-" + kind, start, end); });
  }

  if (phase === "initializing" || phase === "loading") return <div className="fixed inset-0 z-50 bg-app-bg px-4 pt-8"><div className="mx-auto max-w-[480px] space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-app-border" /><div className="h-[70dvh] animate-pulse rounded-3xl bg-app-surface" /></div></div>;
  if (phase === "range" && rangeMenu && rangeMenu.cards.length > 50) return <StudyRangeMenu title={rangeTitle} rangeMenu={rangeMenu} baseQuery={search.toString()} sessions={studySessions} />;
  if (phase === "study" && card && entry) {
    const priority = sourcePriority(entry);
    return <><section className="fixed inset-0 z-50 bg-app-bg text-app-text">
      <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col overflow-hidden">
        {notice ? <p role="alert" className="mx-3 mt-[max(8px,env(safe-area-inset-top))] rounded-lg border border-amber-900 bg-amber-950 p-2 text-xs text-amber-200">{notice}</p> : null}
        <header className="flex shrink-0 items-center gap-2 px-3 pt-[max(8px,env(safe-area-inset-top))]">
          <button aria-label="학습 중단" onClick={() => void pause()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-muted"><ArrowLeft className="h-5 w-5" /></button>
          <strong aria-label="학습 범위" className="min-w-0 flex-1 truncate text-sm">{sessionTitle}</strong>
          <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-app-muted">{completed + 1} / {initialWordIds.length}</span>
          <button aria-label="학습 처음부터 시작" onClick={() => setRestartOpen(true)} className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-app-muted hover:bg-app-raised hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"><RotateCcw className="h-4 w-4" /><span>처음부터</span></button>
        </header>
        <div className="shrink-0 text-center text-xs tabular-nums text-app-muted" aria-label="경과 시간">{formatElapsed(elapsed)}</div>
        <div className="flex shrink-0 items-center justify-center gap-2 py-2">
          <button aria-pressed={entry.bookmarked} aria-label={entry.bookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"} title={entry.bookmarked ? "즐겨찾기 해제 (F)" : "즐겨찾기 추가 (F)"} onClick={() => void toggleFavorite()} className={"flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus " + (entry.bookmarked ? "border-app-warning bg-app-warning/10 text-app-warning" : "border-app-border text-app-muted hover:border-app-warning hover:text-app-warning")}><Star className={"h-5 w-5 " + (entry.bookmarked ? "fill-current" : "")} /></button>
          <button aria-pressed={loopMode} aria-label="모르는 카드 반복" onClick={() => void toggleLoop()} className={"flex h-11 w-11 items-center justify-center rounded-full border " + (loopMode ? "border-app-accent text-app-accent" : "border-app-border text-app-muted")}><InfinityIcon className="h-5 w-5" /></button>
          <span className="flex h-11 min-w-11 items-center justify-center rounded-full border border-app-border px-3 text-xs font-bold" aria-label={"남은 카드 " + roundQueue.length + "개"}>{roundQueue.length}</span>
        </div>
        <article onTouchStart={touchBegin} onTouchEnd={touchEnd} className="study-card flex min-h-0 flex-1 touch-pan-y flex-col items-center justify-start overflow-hidden px-5 py-1 text-center">
          <p className="h-5 shrink-0 overflow-hidden text-xs text-app-muted">{entry.partOfSpeech.join(" · ")} {priority ? <span className="ml-1 text-app-warning" aria-label={"출처 중요도 " + priority}>{"★".repeat(priority)}</span> : null}</p>
          <FittedStudyTerm term={entry.term} />
          <FittedStudyDetails contentKey={JSON.stringify([entry.reading, entry.meanings, entry.nuance, entry.examples[0]])}>
            <p role="group" aria-label="히라가나 텍스트 필드" aria-live="polite" aria-atomic="true" className="jp font-medium text-app-meaning">
              <span lang="ja" className={showReading ? "" : "invisible"}>{entry.reading || "읽기 미확인"}</span>
            </p>
            <p role="group" aria-label="한국어 뜻 텍스트 필드" aria-live="polite" aria-atomic="true" className="font-medium text-app-meaning">
              <span className={showMeaning ? "" : "invisible"}>{entry.meanings.join(", ") || "뜻 미확인"}</span>
            </p>
            {entry.nuance ? <p data-testid="study-nuance-slot" className="text-app-warning">{entry.nuance}</p> : null}
            {entry.examples[0] ? <p data-testid="study-example-slot" lang="ja" className="jp">{highlightedExample(entry.examples[0].ja)}</p> : null}
            {entry.examples[0]?.ko ? <p className={"text-orange-400 " + (showMeaning ? "" : "invisible")}>{entry.examples[0].ko}</p> : null}
          </FittedStudyDetails>
        </article>
        <div className="shrink-0 px-4">
          <div className="h-[5px] overflow-hidden rounded-full bg-app-raised"><div className="h-full bg-app-accent transition-[width] duration-200" style={{ width: String(initialWordIds.length ? completed / initialWordIds.length * 100 : 0) + "%" }} /></div>
          <div className="mt-1 flex justify-between text-[11px] text-app-muted"><span>완료 {completed}</span><span>남음 {roundQueue.length}</span></div>
        </div>
        <footer className="study-controls shrink-0 space-y-2 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button aria-pressed={showMeaning} onClick={() => toggleHint("meaning")} className={"min-h-14 rounded-xl border px-2 font-medium " + (showMeaning ? "border-app-accent bg-app-accent-surface" : "border-app-border bg-app-raised")}>한국어 <kbd className="ml-1 text-[10px] opacity-60">Q/1</kbd></button>
            <button lang="ja" aria-pressed={showReading} onClick={() => toggleHint("reading")} className={"jp min-h-14 rounded-xl border px-2 font-medium " + (showReading ? "border-app-accent bg-app-accent-surface" : "border-app-border bg-app-raised")}>ひらがな <kbd className="ml-1 text-[10px] opacity-60">W/2</kbd></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => void rate("again")} className="min-h-14 rounded-xl bg-[var(--study)] px-2 font-bold text-white"><span className="text-app-warning">✎</span> 공부하겠음 <kbd className="ml-1 text-[10px] opacity-60">A/←</kbd></button>
            <button onClick={() => void rate("good")} className="min-h-14 rounded-xl bg-[var(--known)] px-2 font-bold text-white">✓ 알고있음 <kbd className="ml-1 text-[10px] opacity-60">S/→</kbd></button>
          </div>
        </footer>
      </div>
    </section><RestartDialog open={restartOpen} pending={restartPending} onOpenChange={setRestartOpen} onConfirm={() => void restart(false)} /></>;
  }
  if (phase === "complete") {
    const latest = new Map(results.map((item) => [item.wordId, item.rating]));
    const wrong = [...latest.values()].filter((rating) => rating === "again" || rating === "hard").length;
    const known = [...latest.values()].filter((rating) => rating === "good" || rating === "easy").length;
    return <><section className="fixed inset-0 z-50 flex bg-app-bg px-4 text-app-text"><div className="m-auto w-full max-w-[480px] rounded-3xl border border-app-border bg-app-surface p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-accent-surface text-2xl text-app-accent">✓</div><h1 className="mt-5 text-2xl font-black">학습을 마쳤습니다</h1><div className="mt-5 grid grid-cols-3 gap-3"><div><b className="block text-2xl text-app-accent">{known}</b><span className="text-xs text-app-muted">알고 있음</span></div><div><b className="block text-2xl text-app-warning">{wrong}</b><span className="text-xs text-app-muted">다시 학습</span></div><div><b className="block text-2xl">{formatElapsed(elapsed)}</b><span className="text-xs text-app-muted">소요 시간</span></div></div>{notice ? <p role="alert" className="mt-4 rounded-xl border border-amber-900 bg-amber-950 p-3 text-sm text-amber-200">{notice}</p> : null}{wrong ? <Button className="mt-7 w-full" onClick={() => void restart(true)}><RotateCcw className="h-4 w-4" />모르는 것만 다시 ({wrong})</Button> : null}<Button variant="outline" className="mt-3 w-full" onClick={() => setRestartOpen(true)}>처음부터 다시</Button><Button variant="ghost" className="mt-2 w-full" onClick={() => router.push("/books")}>단어장으로</Button></div></section><RestartDialog open={restartOpen} pending={restartPending} onOpenChange={setRestartOpen} onConfirm={() => void restart(false)} /></>;
  }

  return <div className="mx-auto max-w-md rounded-2xl border border-app-border bg-app-surface p-6 text-center"><p role="alert" className="text-sm text-app-muted">{message || "학습할 카드를 찾지 못했습니다."}</p><Button asChild variant="outline" className="mt-5 w-full"><Link href="/books">단어장으로</Link></Button></div>;
}

function rangeHref(baseQuery: string, range: CardRange | null) {
  const query = new URLSearchParams(baseQuery);
  query.delete("range"); query.delete("rangeStart"); query.delete("rangeSize");
  if (range) { query.set("rangeStart", String(range.start)); query.set("rangeSize", String(range.count)); }
  else query.set("range", "all");
  return "/study?" + query.toString();
}

function StudyRangeMenu({ title, rangeMenu, baseQuery, sessions }: { title: string; rangeMenu: RangeMenu; baseQuery: string; sessions: Session[] }) {
  const total = rangeMenu.cards.length;
  const fifty = cardRanges(total, 50);
  const oneFifty = cardRanges(total, 150);
  return <section className="fixed inset-0 z-50 overflow-y-auto bg-app-bg text-app-text">
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))]">
      <header className="flex min-h-11 items-center gap-2">
        <Link href="/books" aria-label="단어장으로" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="min-w-0">
          <p className="truncate text-xs text-app-muted">{title}</p>
          <h1 className="text-xl font-black">학습 범위 선택</h1>
        </div>
      </header>
      <div className="mt-5 rounded-2xl border border-app-border bg-app-surface p-5">
        <p className="text-sm text-app-muted">학습할 카드 묶음을 선택하세요.</p>
        <p className="mt-2 text-3xl font-black text-app-accent">총 {total}장</p>
      </div>
      <RangeGroup title="50장씩" description="짧게 나누어 학습" ranges={fifty} baseQuery={baseQuery} rangeMenu={rangeMenu} sessions={sessions} />
      <RangeGroup title="150장씩" description="길게 이어서 학습" ranges={oneFifty} baseQuery={baseQuery} rangeMenu={rangeMenu} sessions={sessions} />
      <section aria-labelledby="range-all-heading" className="mt-6">
        <h2 id="range-all-heading" className="text-sm font-black">전체 세트</h2>
        <RangeLink range={null} baseQuery={baseQuery} rangeMenu={rangeMenu} sessions={sessions} featured />
      </section>
    </div>
  </section>;
}

function RangeGroup({ title, description, ranges, baseQuery, rangeMenu, sessions }: { title: string; description: string; ranges: CardRange[]; baseQuery: string; rangeMenu: RangeMenu; sessions: Session[] }) {
  const headingId = title === "50장씩" ? "range-50-heading" : "range-150-heading";
  return <section aria-labelledby={headingId} className="mt-6">
    <div className="flex items-end justify-between gap-3"><h2 id={headingId} className="text-sm font-black">{title}</h2><p className="text-xs text-app-muted">{description}</p></div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      {ranges.map((range) => <RangeLink range={range} baseQuery={baseQuery} rangeMenu={rangeMenu} sessions={sessions} key={range.start} />)}
    </div>
  </section>;
}

function RangeLink({ range, baseQuery, rangeMenu, sessions, featured = false }: { range: CardRange | null; baseQuery: string; rangeMenu: RangeMenu; sessions: Session[]; featured?: boolean }) {
  const cards = range ? rangeMenu.cards.slice(range.start, range.end) : rangeMenu.cards;
  const total = cards.length;
  const session = sessionForRange(sessions, rangeMenu.bookIds, rangeMenu.mode, rangeMenu.includeReview, cards.map((card) => card.wordId));
  const progress = sessionProgress(session, total);
  const state = progress >= total ? "완료" : progress ? "진행" : "미학습";
  const label = range ? `${range.start + 1}–${range.end}` : "전체 학습";
  const ariaLabel = range ? `${label} ${total}장 학습, ${state} ${progress}/${total}` : `전체 ${total}장 학습, ${state} ${progress}/${total}`;
  return <a href={rangeHref(baseQuery, range)} aria-label={ariaLabel} className={(featured ? "mt-3 min-h-[84px] rounded-2xl border-app-accent bg-app-accent-surface px-5" : "min-h-[84px] rounded-xl border-app-border bg-app-surface px-4 hover:border-app-accent") + " flex w-full flex-col justify-center border text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"}>
    <span className="flex items-center justify-between gap-2"><span className="font-black tabular-nums">{label}</span><span className={"text-xs font-bold " + (state === "완료" ? "text-app-accent" : "text-app-muted")}>{state} {progress}/{total}</span></span>
    <span className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-raised" aria-hidden="true"><span className="block h-full rounded-full bg-app-accent" style={{ width: `${total ? progress / total * 100 : 0}%` }} /></span>
  </a>;
}

function RestartDialog({ open, pending, onOpenChange, onConfirm }: { open: boolean; pending: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next); }}><DialogContent className="sm:max-w-md"><DialogTitle className="pr-10 text-xl font-black">학습을 처음부터 시작할까요?</DialogTitle><DialogDescription className="mt-2 text-sm leading-6 text-app-muted">현재 진행 중인 이 세트의 카드 위치와 이번 라운드 결과를 초기화합니다. 이전에 저장된 단어 복습 기록과 통계는 유지됩니다.</DialogDescription><div className="mt-6 grid grid-cols-2 gap-3"><Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>취소</Button><Button variant="destructive" disabled={pending} onClick={onConfirm}>{pending ? "시작 중…" : "처음부터 시작"}</Button></div></DialogContent></Dialog>;
}
