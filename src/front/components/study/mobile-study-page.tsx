"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { ArrowLeft, Bookmark, Infinity as InfinityIcon, RotateCcw, Shuffle, Sparkles, Volume2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { clientDatabase } from "@/lib/sync/client-db";
import { useSync } from "@/components/sync/sync-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { nextStudyQueue } from "@/lib/study-queue";

type Rating = "again" | "hard" | "good" | "easy";
type Mode = "all" | "unseen" | "due" | "weak";
type Book = { id: string; title: string; folderId: string | null };
type Folder = { id: string; name: string; parentId: string | null };
type Entry = { entryId: string; bookId: string; wordId: string; term: string; reading: string | null; meanings: string[]; primaryMeaning: string | null; nuance: string | null; partOfSpeech: string[]; examples: Array<{ ja: string; ko?: string | null }>; tags: string[]; status: string; bookTitle: string; bookmarked: boolean; bookmarkRevision: number };
type Card = { wordId: string; representative: Entry; occurrences: Entry[]; review: { dueAt: string | null; lastReviewedAt: string | null; lastRating: string | null } };
type Result = { wordId: string; rating: Rating; occurredAt: string };
type Session = { id: string; bookIds: string[]; mode: Mode; includeReview: boolean; wordIds: string[]; position: number; revealed: boolean; ratings: Record<string, Rating>; queue?: string[]; loopMode?: boolean; results?: Result[]; status: string; revision: number; createdAt: string };
type Phase = "config" | "loading" | "study" | "complete";
type Filters = { minStar: number; bookmarks: boolean; pos: string; chunk: string };

const posOptions = ["명사", "혼동명사", "동사", "イ형용사", "ナ형용사", "부사", "가타카나"];

function formatElapsed(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
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
  const search = useSearchParams();
  const autoStart = search.get("start") === "1";
  const { queue: queueMutation } = useSync();
  const [books, setBooks] = useState<Book[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [scope, setScope] = useState(search.get("folder") ? "folder:" + search.get("folder") : search.get("books") || "");
  const [mode, setMode] = useState<Mode>(search.get("mode") === "due" ? "due" : "all");
  const [size, setSize] = useState("20");
  const [includeReview, setIncludeReview] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [filters, setFilters] = useState<Filters>({ minStar: 0, bookmarks: false, pos: "", chunk: "" });
  const [dueCount, setDueCount] = useState(0);
  const [resume, setResume] = useState<Session | null>(null);
  const [phase, setPhase] = useState<Phase>("config");
  const [cards, setCards] = useState<Card[]>([]);
  const [roundQueue, setRoundQueue] = useState<string[]>([]);
  const [initialWordIds, setInitialWordIds] = useState<string[]>([]);
  const [showReading, setShowReading] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loopMode, setLoopMode] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [sessionStartedAt, setSessionStartedAt] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const revision = useRef(1);
  const ratingLock = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const autoStartHandled = useRef(false);

  const cardByWordId = useMemo(() => new Map(cards.map((card) => [card.wordId, card])), [cards]);
  const card = roundQueue.length ? cardByWordId.get(roundQueue[0]) : undefined;
  const entry = card?.representative;
  const completed = Math.max(0, initialWordIds.length - new Set(roundQueue).size);

  useEffect(() => {
    const active = phase === "loading" || phase === "study" || phase === "complete";
    window.dispatchEvent(new CustomEvent("jlpt-study-active", { detail: { active } }));
    return () => { window.dispatchEvent(new CustomEvent("jlpt-study-active", { detail: { active: false } })); };
  }, [phase]);

  useEffect(() => {
    const speechTimer = window.setTimeout(() => setSpeechAvailable("speechSynthesis" in window && "SpeechSynthesisUtterance" in window), 0);
    void (async () => {
      const db = await clientDatabase();
      const [cachedBooks, cachedFolders, sessions] = await Promise.all([db.getAll("books"), db.getAll("folders"), db.getAll("studySessions")]);
      setBooks(cachedBooks as unknown as Book[]);
      setFolders(cachedFolders as unknown as Folder[]);
      setResume((sessions as unknown as Session[]).filter((session) => session.status === "active" || session.status === "paused").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null);
      try {
        const [bookResponse, folderResponse, dueResponse] = await Promise.all([
          fetch("/api/books?limit=500&sort=name", { cache: "no-store" }),
          fetch("/api/folders", { cache: "no-store" }),
          fetch("/api/study/cards?mode=due&countOnly=true", { cache: "no-store" }),
        ]);
        if (bookResponse.ok) setBooks((await bookResponse.json()).books);
        if (folderResponse.ok) setFolders((await folderResponse.json()).folders);
        if (dueResponse.ok) setDueCount((await dueResponse.json()).totalMatches);
      } catch { /* cached configuration remains available */ }
    })();
    return () => window.clearTimeout(speechTimer);
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
    setPhase("loading"); setMessage(""); setNotice(""); setShowReading(false); setShowMeaning(false); ratingLock.current = false;
    const selectedBooks = existing?.bookIds || booksForScope(scope);
    const selectedMode = existing ? "all" : mode;
    const selectedReview = existing ? true : includeReview;
    const list = await getCards({ bookIds: selectedBooks, mode: selectedMode, includeReview: selectedReview, limit: existing || size === "all" ? 10_000 : Number(size), seed: existing ? 0 : shuffle ? Date.now() : 0, filters: existing ? { minStar: 0, bookmarks: false, pos: "", chunk: "" } : filters });
    const byId = new Map(list.map((item) => [item.wordId, item]));
    const originalIds = existing?.wordIds || list.map((item) => item.wordId);
    const queueIds = existing ? (existing.queue?.length ? existing.queue : existing.wordIds.slice(existing.position || 0)).filter((id) => byId.has(id)) : originalIds;
    const ordered = originalIds.flatMap((id) => byId.get(id) || []);
    if (!ordered.length || !queueIds.length) {
      setMessage(selectedMode === "due" ? "현재 복습할 단어가 없습니다." : "조건에 맞는 학습 카드가 없습니다. 오프라인이라면 먼저 해당 세트를 열어 캐시해 주세요.");
      setPhase("config");
      return;
    }
    if (existing && queueIds.length !== (existing.queue?.length || existing.wordIds.length - existing.position)) setNotice("삭제되었거나 범위에서 빠진 카드는 건너뛰었습니다.");
    setCards(ordered); setRoundQueue(queueIds); setInitialWordIds(originalIds); setResults(existing?.results || []); setLoopMode(existing?.loopMode || false);
    if (existing) {
      setMode(existing.mode);
      setIncludeReview(existing.includeReview);
      setSessionId(existing.id); setSessionStartedAt(existing.createdAt); revision.current = existing.revision;
    } else {
      const id = "study-" + crypto.randomUUID();
      const startedAt = new Date().toISOString();
      try {
        await queueMutation({ type: "session.create", payload: { id, bookIds: selectedBooks, mode: selectedMode, includeReview: selectedReview, wordIds: originalIds, queue: queueIds, loopMode: false, results: [], position: 0, revealed: false, ratings: {}, status: "active" } });
      } catch {
        setMessage("학습 세션을 기기에 저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요."); setPhase("config"); return;
      }
      setSessionId(id); setSessionStartedAt(startedAt); revision.current = 1;
    }
    setPhase("study");
  }, [booksForScope, filters, getCards, includeReview, mode, queueMutation, scope, shuffle, size]);

  useEffect(() => {
    if (!autoStart || autoStartHandled.current) return;
    autoStartHandled.current = true;
    void begin();
  }, [autoStart, begin]);

  const pause = useCallback(async () => {
    try { await saveSession({ queue: roundQueue, loopMode, results, position: results.length, revealed: false, status: "paused" }); }
    catch { setNotice("학습 상태를 저장하지 못해 화면을 닫지 않았습니다."); return; }
    const stored = await (await clientDatabase()).get("studySessions", sessionId) as unknown as Session | undefined;
    setResume(stored || null); setPhase("config");
  }, [loopMode, results, roundQueue, saveSession, sessionId]);

  const toggleLoop = useCallback(async () => {
    const next = !loopMode;
    try { await saveSession({ loopMode: next, queue: roundQueue, results, status: "active" }); setLoopMode(next); }
    catch { setNotice("반복 설정을 저장하지 못했습니다."); }
  }, [loopMode, results, roundQueue, saveSession]);

  const toggleBookmark = useCallback(async () => {
    if (!entry) return;
    const next = !entry.bookmarked;
    try {
      await queueMutation({ type: "bookmark.set", ...(entry.bookmarkRevision ? { expectedRevision: entry.bookmarkRevision } : {}), payload: { entryId: entry.entryId, bookmarked: next } });
      setCards((current) => current.map((item) => item.wordId !== card?.wordId ? item : { ...item, representative: { ...item.representative, bookmarked: next, bookmarkRevision: next ? item.representative.bookmarkRevision : 0 }, occurrences: item.occurrences.map((occurrence) => occurrence.entryId === entry.entryId ? { ...occurrence, bookmarked: next, bookmarkRevision: next ? occurrence.bookmarkRevision : 0 } : occurrence) }));
    } catch { setNotice("북마크를 저장하지 못했습니다."); }
  }, [card?.wordId, entry, queueMutation]);

  const speak = useCallback(() => {
    if (!entry || !speechAvailable) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance((entry.reading || entry.term).split("（")[0]);
    utterance.lang = "ja-JP"; utterance.rate = 0.9;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang?.startsWith("ja"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, [entry, speechAvailable]);

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
  }, [card, loopMode, mode, queueMutation, results, roundQueue, saveSession, sessionId]);

  const restart = useCallback(async (onlyWrong: boolean) => {
    const latest = new Map(results.map((item) => [item.wordId, item.rating]));
    const nextCards = onlyWrong ? cards.filter((item) => ["again", "hard"].includes(latest.get(item.wordId) || "")) : cards;
    if (!nextCards.length) { setPhase("config"); setResume(null); return; }
    const id = "study-" + crypto.randomUUID();
    const wordIds = nextCards.map((item) => item.wordId);
    const bookIds = [...new Set(nextCards.flatMap((item) => item.occurrences.map((occurrence) => occurrence.bookId)))];
    await queueMutation({ type: "session.create", payload: { id, bookIds, mode: onlyWrong ? "weak" : "all", includeReview: true, wordIds, queue: wordIds, loopMode: false, results: [], position: 0, revealed: false, ratings: {}, status: "active" } });
    setCards(nextCards); setRoundQueue(wordIds); setInitialWordIds(wordIds); setResults([]); setLoopMode(false); setShowMeaning(false); setShowReading(false); setSessionId(id); setSessionStartedAt(new Date().toISOString()); revision.current = 1; ratingLock.current = false; setPhase("study");
  }, [cards, queueMutation, results]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (phase !== "study" || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || target?.closest("input,select,textarea,[contenteditable=true]")) return;
      const code = event.code;
      if (code === "KeyQ" || event.key === "1") setShowMeaning((value) => !value);
      else if (code === "KeyW" || event.key === "2") setShowReading((value) => !value);
      else if (code === "KeyA" || event.key === "ArrowLeft") void rate("again");
      else if (code === "KeyS" || event.key === "ArrowRight") void rate("good");
      else if (code === "KeyB") void toggleBookmark();
      else if (code === "Space") speak();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase, rate, speak, toggleBookmark]);

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

  if (phase === "loading") return <div className="fixed inset-0 z-50 bg-app-bg px-4 pt-8"><div className="mx-auto max-w-[480px] space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-app-border" /><div className="h-[70dvh] animate-pulse rounded-3xl bg-app-surface" /></div></div>;
  if (phase === "study" && card && entry) {
    const priority = sourcePriority(entry);
    return <section className="fixed inset-0 z-50 bg-app-bg text-app-text">
      <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col overflow-hidden">
        {notice ? <p role="alert" className="mx-3 mt-[max(8px,env(safe-area-inset-top))] rounded-lg border border-amber-900 bg-amber-950 p-2 text-xs text-amber-200">{notice}</p> : null}
        <header className="flex shrink-0 items-center gap-2 px-3 pt-[max(8px,env(safe-area-inset-top))]">
          <button aria-label="학습 중단" onClick={() => void pause()} className="flex h-11 w-11 items-center justify-center rounded-lg text-app-muted"><ArrowLeft className="h-5 w-5" /></button>
          <strong className="min-w-0 flex-1 truncate text-sm">{entry.bookTitle}</strong>
          <span className="text-xs tabular-nums text-app-muted">{completed + 1} / {initialWordIds.length}</span>
        </header>
        <div className="shrink-0 text-center text-xs tabular-nums text-app-muted" aria-label="경과 시간">{formatElapsed(elapsed)}</div>
        <div className="flex shrink-0 items-center justify-center gap-2 py-2">
          <button aria-pressed={entry.bookmarked} aria-label={entry.bookmarked ? "북마크 해제" : "북마크"} onClick={() => void toggleBookmark()} className={"flex h-11 w-11 items-center justify-center rounded-full border " + (entry.bookmarked ? "border-app-warning text-app-warning" : "border-app-border text-app-muted")}><Bookmark className={"h-4 w-4 " + (entry.bookmarked ? "fill-current" : "")} /></button>
          <button aria-pressed={loopMode} aria-label="모르는 카드 반복" onClick={() => void toggleLoop()} className={"flex h-11 w-11 items-center justify-center rounded-full border " + (loopMode ? "border-app-accent text-app-accent" : "border-app-border text-app-muted")}><InfinityIcon className="h-5 w-5" /></button>
          <span className="flex h-11 min-w-11 items-center justify-center rounded-full border border-app-border px-3 text-xs font-bold" aria-label={"남은 카드 " + roundQueue.length + "개"}>{roundQueue.length}</span>
          <button aria-label="일본어 발음 듣기" disabled={!speechAvailable} onClick={speak} className="flex h-11 w-11 items-center justify-center rounded-full border border-app-border text-app-muted disabled:opacity-30"><Volume2 className="h-4 w-4" /></button>
        </div>
        <article onTouchStart={touchBegin} onTouchEnd={touchEnd} className="flex min-h-0 flex-1 touch-pan-y flex-col items-center justify-center overflow-y-auto px-5 text-center">
          <p className="min-h-5 text-xs text-app-muted">{entry.partOfSpeech.join(" · ")} {priority ? <span className="ml-1 text-app-warning" aria-label={"출처 중요도 " + priority}>{"★".repeat(priority)}</span> : null}</p>
          <h1 className={"jp mt-1 font-light leading-tight text-app-accent " + (entry.term.length > 7 ? "text-[clamp(34px,10vw,54px)]" : "text-[clamp(48px,16vw,80px)]")}>{entry.term}</h1>
          {entry.nuance ? <p className="mt-2 text-sm font-medium text-app-warning">{entry.nuance}</p> : null}
          {entry.examples[0] ? <p className="jp mt-4 max-w-full text-[clamp(14px,4vw,17px)] leading-7 text-app-muted">{highlightedExample(entry.examples[0].ja)}</p> : null}
          <div className="my-4 h-px w-3/5 bg-app-border" />
          <div className="flex min-h-20 flex-col items-center gap-2">
            {showMeaning ? <><p className="text-[clamp(15px,4.5vw,19px)] font-medium text-app-meaning">{entry.meanings.join(", ") || "뜻 미확인"}</p>{entry.examples[0]?.ko ? <p className="text-sm leading-6 text-orange-400">{entry.examples[0].ko}</p> : null}</> : null}
            {showReading ? <p className="jp text-[clamp(14px,4vw,18px)] font-medium text-app-meaning">{entry.reading || "읽기 미확인"}</p> : null}
          </div>
        </article>
        <div className="shrink-0 px-4">
          <div className="h-[5px] overflow-hidden rounded-full bg-app-raised"><div className="h-full bg-app-accent transition-[width] duration-200" style={{ width: String(initialWordIds.length ? completed / initialWordIds.length * 100 : 0) + "%" }} /></div>
          <div className="mt-1 flex justify-between text-[11px] text-app-muted"><span>완료 {completed}</span><span>남음 {roundQueue.length}</span></div>
        </div>
        <footer className="shrink-0 space-y-2 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button aria-pressed={showMeaning} onClick={() => toggleHint("meaning")} className={"min-h-14 rounded-xl border px-2 font-medium " + (showMeaning ? "border-app-accent bg-app-accent-surface" : "border-app-border bg-app-raised")}>한국어 <kbd className="ml-1 text-[10px] opacity-60">Q/1</kbd></button>
            <button aria-pressed={showReading} onClick={() => toggleHint("reading")} className={"jp min-h-14 rounded-xl border px-2 font-medium " + (showReading ? "border-app-accent bg-app-accent-surface" : "border-app-border bg-app-raised")}>ひらがな <kbd className="ml-1 text-[10px] opacity-60">W/2</kbd></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => void rate("again")} className="min-h-14 rounded-xl bg-[var(--study)] px-2 font-bold text-white"><span className="text-app-warning">✎</span> 공부하겠음 <kbd className="ml-1 text-[10px] opacity-60">A/←</kbd></button>
            <button onClick={() => void rate("good")} className="min-h-14 rounded-xl bg-[var(--known)] px-2 font-bold text-white">✓ 알고있음 <kbd className="ml-1 text-[10px] opacity-60">S/→</kbd></button>
          </div>
        </footer>
      </div>
    </section>;
  }
  if (phase === "complete") {
    const latest = new Map(results.map((item) => [item.wordId, item.rating]));
    const wrong = [...latest.values()].filter((rating) => rating === "again" || rating === "hard").length;
    const known = [...latest.values()].filter((rating) => rating === "good" || rating === "easy").length;
    return <section className="fixed inset-0 z-50 flex bg-app-bg px-4 text-app-text"><div className="m-auto w-full max-w-[480px] rounded-3xl border border-app-border bg-app-surface p-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-accent-surface text-2xl text-app-accent">✓</div><h1 className="mt-5 text-2xl font-black">학습을 마쳤습니다</h1><div className="mt-5 grid grid-cols-3 gap-3"><div><b className="block text-2xl text-app-accent">{known}</b><span className="text-xs text-app-muted">알고 있음</span></div><div><b className="block text-2xl text-app-warning">{wrong}</b><span className="text-xs text-app-muted">다시 학습</span></div><div><b className="block text-2xl">{formatElapsed(elapsed)}</b><span className="text-xs text-app-muted">소요 시간</span></div></div>{wrong ? <Button className="mt-7 w-full" onClick={() => void restart(true)}><RotateCcw className="h-4 w-4" />모르는 것만 다시 ({wrong})</Button> : null}<Button variant="outline" className="mt-3 w-full" onClick={() => void restart(false)}>처음부터 다시</Button><Button variant="ghost" className="mt-2 w-full" onClick={() => { setPhase("config"); setResume(null); }}>세트 선택으로</Button></div></section>;
  }

  return <div className="mx-auto max-w-xl"><h1 className="text-2xl font-black">학습</h1><p className="mt-1 text-sm text-app-muted">오늘 복습 {dueCount}개</p>
    {resume ? <button onClick={() => void begin(resume)} className="mt-5 flex w-full items-center justify-between rounded-2xl border border-app-accent bg-app-accent-surface p-5 text-left"><span><span className="block font-black">이어서 학습</span><span className="mt-1 block text-sm text-cyan-100">남은 카드 {resume.queue?.length ?? Math.max(0, resume.wordIds.length - resume.position)}개</span></span><RotateCcw className="h-5 w-5 text-app-accent" /></button> : null}
    <button onClick={() => { setMode("due"); setSize("20"); }} className="mt-3 flex min-h-16 w-full items-center justify-between rounded-2xl border border-app-border bg-app-surface px-5 text-left"><span><span className="font-black">복습 시작</span><span className="ml-2 text-sm text-app-muted">{dueCount}개 대기</span></span><Sparkles className="h-5 w-5 text-app-accent" /></button>
    <section className="mt-6 rounded-2xl border border-app-border bg-app-surface p-5"><h2 className="font-black">새 학습 설정</h2><div className="mt-5 space-y-4">
      <label className="block text-sm font-bold">범위<Select className="mt-2 w-full" value={scope} onChange={(event) => setScope(event.target.value)}><option value="">전체 단어장</option>{folders.length ? <optgroup label="폴더">{folders.map((folder) => <option key={folder.id} value={"folder:" + folder.id}>{folder.name}</option>)}</optgroup> : null}<optgroup label="세트">{books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</optgroup></Select></label>
      <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-bold">모드<Select className="mt-2 w-full" value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option value="all">모든 단어</option><option value="unseen">미학습</option><option value="due">복습 대기</option><option value="weak">틀린 단어</option></Select></label><label className="block text-sm font-bold">개수<Select className="mt-2 w-full" value={size} onChange={(event) => setSize(event.target.value)}><option>10</option><option>20</option><option>50</option><option value="all">전체</option></Select></label></div>
      <details className="rounded-xl border border-app-border bg-app-raised p-3"><summary className="min-h-11 cursor-pointer py-2 text-sm font-bold">HTML 카드 필터</summary><div className="grid grid-cols-2 gap-3 pt-2"><label className="text-xs font-bold">중요도<Select className="mt-1 w-full" value={filters.minStar} onChange={(event) => setFilters((value) => ({ ...value, minStar: Number(event.target.value) }))}><option value="0">전체</option><option value="1">★ 이상</option><option value="2">★★ 이상</option></Select></label><label className="text-xs font-bold">품사<Select className="mt-1 w-full" value={filters.pos} onChange={(event) => setFilters((value) => ({ ...value, pos: event.target.value }))}><option value="">전체</option>{posOptions.map((pos) => <option key={pos}>{pos}</option>)}</Select></label><label className="text-xs font-bold">50장 묶음<Select className="mt-1 w-full" value={filters.chunk} onChange={(event) => setFilters((value) => ({ ...value, chunk: event.target.value }))}><option value="">전체</option>{[1,2,3,4,5,6].map((chunk) => <option key={chunk} value={chunk}>{(chunk - 1) * 50 + 1}–{Math.min(chunk * 50, 268)}</option>)}</Select></label><label className="flex min-h-11 items-end gap-2 pb-2 text-xs font-bold"><input type="checkbox" checked={filters.bookmarks} onChange={(event) => setFilters((value) => ({ ...value, bookmarks: event.target.checked }))} className="h-5 w-5" /><Bookmark className="h-4 w-4" />북마크만</label></div></details>
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} className="h-5 w-5" /><Shuffle className="h-4 w-4" />순서 섞기</label><label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={includeReview} onChange={(event) => setIncludeReview(event.target.checked)} className="h-5 w-5" />검수 필요 포함</label>
    </div>{message ? <p role="alert" className="mt-4 rounded-xl bg-amber-950 p-3 text-sm text-amber-200">{message}</p> : null}<Button size="lg" className="mt-5 w-full" onClick={() => void begin()}><Sparkles className="h-5 w-5" />새 학습 시작</Button></section>
  </div>;
}
