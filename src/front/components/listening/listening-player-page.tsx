"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, History, Languages, LoaderCircle, Pause, Pencil, Play, Repeat2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type AudioMetadata = {
  id: string; originalName: string; durationMs: number | null; status: string; streamUrl: string; revision: number;
};
type Segment = {
  id: string; ordinal: number; startMs: number; endMs: number; speaker: string | null; ja: string; ko: string | null; needsReview: boolean;
  reviewNote?: string | null; sourceSegmentIds?: string[];
};
type Script = { id: string; versionNo: number; kind: string; basedOnId?: string | null; createdAt?: string; segments: Segment[] };
type Progress = { positionMs: number; playbackRate: number; completed: boolean; revision: number };

const processingStatuses = new Set(["uploaded", "queued", "transcribing", "transcribed", "correcting"]);
const rates = [0.75, 1, 1.25, 1.5, 2];

export function ListeningPlayerPage({ audioId }: { audioId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scriptRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<Progress>({ positionMs: 0, playbackRate: 1, completed: false, revision: 0 });
  const lastSavedRef = useRef(0);
  const initialSeekRef = useRef<number | null>(null);
  const languageLoadedRef = useRef(false);
  const [audio, setAudio] = useState<AudioMetadata | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [rate, setRate] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [customRange, setCustomRange] = useState<{ startMs: number; endMs: number } | null>(null);
  const [rangeStartMs, setRangeStartMs] = useState<number | null>(null);
  const [showJa, setShowJa] = useState(true);
  const [showKo, setShowKo] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [versions, setVersions] = useState<Script[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { const settings = readLanguageSettings(); languageLoadedRef.current = true; setShowJa(settings.ja); setShowKo(settings.ko); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (languageLoadedRef.current) localStorage.setItem("jlpt:listening-language", JSON.stringify({ ja: showJa, ko: showKo })); }, [showJa, showKo]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [metadataResponse, scriptResponse, progressResponse] = await Promise.all([
        fetch(`/api/listening/audio/${encodeURIComponent(audioId)}/metadata`, { cache: "no-store" }),
        fetch(`/api/listening/audio/${encodeURIComponent(audioId)}/script`, { cache: "no-store" }),
        fetch(`/api/listening/audio/${encodeURIComponent(audioId)}/progress`, { cache: "no-store" }),
      ]);
      if (!metadataResponse.ok) throw new Error(await responseMessage(metadataResponse));
      const metadataBody = await metadataResponse.json() as { audio: AudioMetadata };
      setAudio(metadataBody.audio);
      if (scriptResponse.ok) {
        const body = await scriptResponse.json() as { script: Script | null };
        setScript(body.script);
      }
      if (progressResponse.ok && initialSeekRef.current === null) {
        const body = await progressResponse.json() as { progress: Progress };
        progressRef.current = body.progress;
        initialSeekRef.current = restoreLocalPosition(audioId, body.progress.positionMs);
        setRate(body.progress.playbackRate);
      }
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "음원을 불러오지 못했습니다.");
    } finally { if (!quiet) setLoading(false); }
  }, [audioId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => {
    if (!audio || !processingStatuses.has(audio.status)) return;
    const timer = window.setInterval(() => void load(true), 2_500);
    return () => window.clearInterval(timer);
  }, [audio, load]);

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const response = await fetch(`/api/listening/audio/${encodeURIComponent(audioId)}/script/versions`, { cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      setVersions((await response.json() as { versions: Script[] }).versions);
    } finally { setVersionsLoading(false); }
  }, [audioId]);

  const saveProgress = useCallback(async (force = false) => {
    const element = audioRef.current;
    if (!element) return;
    const nextPosition = Math.max(0, Math.round(element.currentTime * 1_000));
    localStorage.setItem(`jlpt:listening-progress:${audioId}`, String(nextPosition));
    if (!force && Date.now() - lastSavedRef.current < 5_000) return;
    lastSavedRef.current = Date.now();
    const body = { positionMs: nextPosition, playbackRate: element.playbackRate, completed: element.duration > 0 && element.currentTime >= element.duration - 2, revision: progressRef.current.revision };
    try {
      let response = await fetch(`/api/listening/audio/${encodeURIComponent(audioId)}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: force });
      if (response.status === 409) {
        const current = await fetch(`/api/listening/audio/${encodeURIComponent(audioId)}/progress`, { cache: "no-store" });
        if (current.ok) progressRef.current = (await current.json() as { progress: Progress }).progress;
        response = await fetch(`/api/listening/audio/${encodeURIComponent(audioId)}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, revision: progressRef.current.revision }), keepalive: force });
      }
      if (response.ok) progressRef.current = (await response.json() as { progress: Progress }).progress;
    } catch { /* local fallback already persisted */ }
  }, [audioId]);

  useEffect(() => {
    const flush = () => void saveProgress(true);
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, [saveProgress]);

  const segments = useMemo(() => script?.segments || [], [script]);
  useEffect(() => {
    if (!autoFollow || activeIndex < 0) return;
    document.getElementById(`listening-segment-${activeIndex}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex, autoFollow]);

  const seek = useCallback((milliseconds: number, shouldPlay = false) => {
    const element = audioRef.current;
    if (!element) return;
    const nextPosition = Math.max(0, milliseconds);
    element.currentTime = nextPosition / 1_000;
    setPositionMs(nextPosition);
    setActiveIndex(findActiveSegment(segments, nextPosition));
    if (shouldPlay) void element.play();
  }, [segments]);
  const seekBy = useCallback((deltaMs: number) => {
    const element = audioRef.current;
    if (!element) return;
    const measuredDuration = Number.isFinite(element.duration) && element.duration > 0 ? Math.round(element.duration * 1_000) : 0;
    const upperBound = measuredDuration || durationMs || audio?.durationMs || 0;
    const target = Math.max(0, Math.round(element.currentTime * 1_000) + deltaMs);
    seek(upperBound > 0 ? Math.min(target, upperBound) : target, !element.paused);
  }, [audio?.durationMs, durationMs, seek]);
  const moveSegment = (direction: -1 | 1) => {
    if (!segments.length) return;
    const current = activeIndex < 0 ? 0 : activeIndex;
    seek(segments[Math.max(0, Math.min(segments.length - 1, current + direction))].startMs, playing);
  };
  const selectSegment = useCallback((segment: Segment) => {
    setAutoFollow(true);
    seek(segment.startMs, !(audioRef.current?.paused ?? true));
  }, [seek]);
  const togglePlayback = async () => {
    const element = audioRef.current;
    if (!element) return;
    if (element.paused) await element.play(); else element.pause();
  };
  const changeRate = () => {
    const next = rates[(rates.indexOf(rate) + 1) % rates.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
    void saveProgress(true);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input,textarea,select,[contenteditable='true']")) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.code === "Space") { event.preventDefault(); void togglePlayback(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); seekBy(-5_000); }
      else if (event.key === "ArrowRight") { event.preventDefault(); seekBy(5_000); }
      else if (event.key.toLowerCase() === "j") setShowJa((value) => !value);
      else if (event.key.toLowerCase() === "k") setShowKo((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
  const retry = async () => {
    if (!audio) return;
    setActionBusy(true);
    try {
      const endpoint = script ? "reprocess" : "transcribe";
      const response = await fetch(`/api/listening/audio/${encodeURIComponent(audio.id)}/${endpoint}`, { method: "POST", headers: { "Idempotency-Key": `player:${endpoint}:${audio.id}:${Date.now()}` } });
      if (!response.ok) throw new Error(await responseMessage(response));
      await load(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "다시 처리하지 못했습니다."); }
    finally { setActionBusy(false); }
  };

  const onTimeUpdate = () => {
    const element = audioRef.current;
    if (!element) return;
    const currentMs = Math.round(element.currentTime * 1_000);
    setPositionMs(currentMs);
    const repeatRange = customRange || (repeat && activeIndex >= 0 ? { startMs: segments[activeIndex].startMs, endMs: segments[activeIndex].endMs } : null);
    if (repeatRange && currentMs >= repeatRange.endMs - 40) { seek(repeatRange.startMs, true); return; }
    const index = findActiveSegment(segments, currentMs);
    setActiveIndex(index);
    void saveProgress();
  };

  return <div className="fixed inset-0 z-50 flex min-w-80 flex-col bg-app-bg text-app-text">
    <header className="shrink-0 border-b border-app-border bg-app-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
        <Link href="/listening" aria-label="청해 목록으로" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-app-muted hover:bg-app-raised"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-bold">{audio?.originalName || "청해"}</h1><p className="text-[11px] text-app-muted">{audio ? statusText(audio.status, Boolean(script)) : "불러오는 중"}</p></div>
        <button type="button" disabled={!script} onClick={() => { setEditorOpen(true); void loadVersions(); }} aria-label="스크립트 편집과 버전" className="min-h-11 min-w-11 rounded-xl text-app-muted disabled:opacity-30"><Pencil aria-hidden="true" className="mx-auto h-4 w-4" /></button>
        <button type="button" aria-pressed={showJa} onClick={() => setShowJa((value) => !value)} className={`min-h-11 rounded-xl px-3 text-xs font-black ${showJa ? "bg-app-accent-surface text-white" : "text-app-muted"}`}>日</button>
        <button type="button" aria-pressed={showKo} onClick={() => setShowKo((value) => !value)} className={`min-h-11 rounded-xl px-3 text-xs font-black ${showKo ? "bg-app-accent-surface text-white" : "text-app-muted"}`}>한</button>
      </div>
    </header>

    <div ref={scriptRef} onWheel={() => setAutoFollow(false)} onTouchMove={() => setAutoFollow(false)} className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto overscroll-contain px-3 py-4">
      {loading ? <StateMessage icon={<LoaderCircle className="h-7 w-7 animate-spin" />} text="음원과 스크립트를 불러오는 중입니다." /> : null}
      {error ? <StateMessage text={error}><Button onClick={() => void load()}>다시 시도</Button></StateMessage> : null}
      {!loading && !error && !script ? <StateMessage icon={<Languages className="h-8 w-8" />} text={audio?.status === "failed" ? "스크립트 처리에 실패했습니다. 음원은 바로 재생할 수 있습니다." : "스크립트를 준비하고 있습니다. 음원은 먼저 재생할 수 있습니다."}><Button disabled={actionBusy} onClick={() => void retry()}>{actionBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}{audio?.status === "failed" ? "다시 처리" : "처리 요청"}</Button></StateMessage> : null}
      {script ? <div role="list" aria-label="청해 스크립트" className="space-y-1 pb-3">
        {segments.map((segment, index) => <SegmentRow key={segment.id} segment={segment} index={index} active={index === activeIndex} showJa={showJa} showKo={showKo} onSelect={selectSegment} />)}
      </div> : null}
    </div>

    {!autoFollow && script ? <button type="button" onClick={() => setAutoFollow(true)} className="absolute bottom-36 left-1/2 min-h-11 -translate-x-1/2 rounded-full border border-app-border bg-app-raised px-4 text-xs font-bold shadow-lg">현재 문장 따라가기</button> : null}
    <footer className="shrink-0 border-t border-app-border bg-app-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl px-3 pb-2 pt-3">
        <audio ref={audioRef} src={audio?.streamUrl} preload="metadata" onLoadedMetadata={(event) => { const element = event.currentTarget; const restored = Math.min(initialSeekRef.current || 0, Math.max(0, element.duration * 1_000 - 500)); element.currentTime = restored / 1_000; element.playbackRate = rate; setPositionMs(restored); setDurationMs(Math.round(element.duration * 1_000)); }} onDurationChange={(event) => setDurationMs(Math.round(event.currentTarget.duration * 1_000) || audio?.durationMs || 0)} onTimeUpdate={onTimeUpdate} onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); void saveProgress(true); }} onEnded={() => { if (customRange) { seek(customRange.startMs, true); return; } setPlaying(false); void saveProgress(true); }} />
        <label className="sr-only" htmlFor="listening-position">재생 위치</label><input id="listening-position" type="range" min={0} max={Math.max(durationMs, 1)} step={100} value={Math.min(positionMs, Math.max(durationMs, 1))} onChange={(event) => seek(Number(event.target.value))} className="h-6 w-full accent-[var(--accent)]" />
        <div className="-mt-1 flex justify-between text-[10px] tabular-nums text-app-muted"><span>{formatClock(positionMs)}</span><span>{formatClock(durationMs)}</span></div>
        <div className="mt-1 grid grid-cols-5 items-center gap-1">
          <button type="button" onClick={changeRate} aria-label={`재생 속도 ${rate}배, 눌러 변경`} className="min-h-12 rounded-xl text-xs font-black text-app-muted">{rate}×</button>
          <button type="button" onClick={() => seekBy(-5_000)} aria-label="5초 뒤로" className="min-h-12 rounded-xl text-xs font-black text-app-muted hover:bg-app-raised">−5초</button>
          <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? "일시 정지" : "재생"} className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-accent-surface text-white">{playing ? <Pause aria-hidden="true" className="h-6 w-6 fill-current" /> : <Play aria-hidden="true" className="ml-0.5 h-6 w-6 fill-current" />}</button>
          <button type="button" onClick={() => seekBy(5_000)} aria-label="5초 앞으로" className="min-h-12 rounded-xl text-xs font-black text-app-muted hover:bg-app-raised">+5초</button>
          <button type="button" aria-pressed={repeat} onClick={() => { setCustomRange(null); setRangeStartMs(null); setRepeat((value) => !value); }} aria-label="현재 문장 반복" className={`min-h-12 rounded-xl ${repeat ? "text-app-accent" : "text-app-muted"}`}><Repeat2 aria-hidden="true" className="mx-auto h-5 w-5" /></button>
        </div>
        <div className="mt-1 flex min-h-11 flex-wrap items-center justify-center gap-1 text-[11px] text-app-muted">
          <button type="button" onClick={() => moveSegment(-1)} aria-label="이전 문장" className="min-h-11 min-w-11 rounded-xl px-2 hover:bg-app-raised"><ChevronLeft aria-hidden="true" className="mx-auto h-5 w-5" /></button>
          <button type="button" className="min-h-11 px-2" onClick={() => { setRepeat(false); setCustomRange(null); setRangeStartMs(positionMs); }} aria-label="A 구간 시작 설정">A</button>
          <button type="button" disabled={rangeStartMs === null || positionMs <= rangeStartMs} className="min-h-11 px-2 disabled:opacity-30" onClick={() => { if (rangeStartMs !== null && positionMs > rangeStartMs) { setRepeat(false); setCustomRange({ startMs: rangeStartMs, endMs: positionMs }); } }} aria-label="B 구간 끝 설정">B</button>
          <button type="button" onClick={() => moveSegment(1)} aria-label="다음 문장" className="min-h-11 min-w-11 rounded-xl px-2 hover:bg-app-raised"><ChevronRight aria-hidden="true" className="mx-auto h-5 w-5" /></button>
          {customRange ? <button type="button" className="min-h-11 px-2 text-app-accent" onClick={() => { setCustomRange(null); setRangeStartMs(null); }}>A–B {formatClock(customRange.startMs)}–{formatClock(customRange.endMs)}</button> : null}
          {script ? <><Download aria-hidden="true" className="ml-1 h-3 w-3" />{(["json", "txt", "srt"] as const).map((format) => <a key={format} className="min-h-11 px-2 py-3 uppercase hover:text-app-text" href={`/api/listening/audio/${encodeURIComponent(audioId)}/script/export?format=${format}`}>{format}</a>)}</> : null}
        </div>
      </div>
    </footer>
    {audio && script ? <ScriptEditorDialog key={script.id} open={editorOpen} onOpenChange={setEditorOpen} audio={audio} script={script} versions={versions} loadingVersions={versionsLoading} currentPositionMs={positionMs} onChanged={async () => { await load(true); await loadVersions(); }} /> : null}
  </div>;
}

const SegmentRow = memo(function SegmentRow({ segment, index, active, showJa, showKo, onSelect }: { segment: Segment; index: number; active: boolean; showJa: boolean; showKo: boolean; onSelect: (segment: Segment) => void }) {
  return <button id={`listening-segment-${index}`} role="listitem" type="button" onClick={() => onSelect(segment)} className={`block min-h-14 w-full rounded-xl border px-4 py-3 text-left [content-visibility:auto] [contain-intrinsic-size:auto_80px] ${active ? "border-app-accent bg-app-accent-surface/35" : "border-transparent hover:bg-app-surface"}`}>
    <span className="mb-1 flex items-center gap-2 text-[10px] font-bold text-app-muted"><span>{formatClock(segment.startMs)}</span>{segment.speaker ? <span>{segment.speaker}</span> : null}{segment.needsReview ? <span className="text-app-warning">검토 필요</span> : null}</span>
    {showJa ? <span className="jp block text-base leading-7">{segment.ja || "…"}</span> : null}
    {showKo ? <span className={`block leading-6 text-app-muted ${showJa ? "mt-1 text-sm" : "text-base"}`}>{segment.ko || "번역 대기 중"}</span> : null}
    {!showJa && !showKo ? <span className="block text-sm text-app-muted">문장 {index + 1}</span> : null}
  </button>;
});

function ScriptEditorDialog({ open, onOpenChange, audio, script, versions, loadingVersions, currentPositionMs, onChanged }: {
  open: boolean; onOpenChange: (value: boolean) => void; audio: AudioMetadata; script: Script; versions: Script[];
  loadingVersions: boolean; currentPositionMs: number; onChanged: () => Promise<void>;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draft, setDraft] = useState(() => draftFor(script.segments[0]));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const segment = script.segments[Math.min(selectedIndex, Math.max(0, script.segments.length - 1))];

  const apply = async (operations: unknown[]) => {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/listening/audio/${encodeURIComponent(audio.id)}/script`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: audio.revision, operations }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      setMessage("새 수동 편집 버전으로 저장했습니다.");
      await onChanged();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "스크립트를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (!segment) return;
    await apply([{ type: "update", segmentId: segment.id, startMs: Math.round(Number(draft.start) * 1_000), endMs: Math.round(Number(draft.end) * 1_000), speaker: draft.speaker || null, ja: draft.ja, ko: draft.ko || null, needsReview: draft.needsReview }]);
  };
  const split = async () => {
    if (!segment) return;
    if (draft.ja.trim().length < 2 || (draft.ko.trim() && draft.ko.trim().length < 2)) { setMessage("분할하려면 각 문장을 두 부분으로 나눌 수 있어야 합니다."); return; }
    const atMs = currentPositionMs > segment.startMs && currentPositionMs < segment.endMs ? currentPositionMs : Math.round((segment.startMs + segment.endMs) / 2);
    const ja = splitText(draft.ja); const ko = draft.ko ? splitText(draft.ko) : [null, null] as [null, null];
    await apply([{ type: "split", segmentId: segment.id, atMs, ja, ko }]);
  };
  const mergeNext = async () => {
    const next = script.segments[selectedIndex + 1];
    if (!segment || !next) return;
    await apply([{ type: "merge", segmentIds: [segment.id, next.id] }]);
  };
  const activate = async (versionId: string) => {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/listening/audio/${encodeURIComponent(audio.id)}/script/versions/${encodeURIComponent(versionId)}/activate`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: audio.revision }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      setMessage("선택한 버전을 활성화했습니다.");
      await onChanged();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "버전을 복원하지 못했습니다."); }
    finally { setBusy(false); }
  };
  const raw = versions.find((version) => version.kind === "whisper_raw");
  const processed = versions.find((version) => version.kind === "gpt_processed");

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto">
    <DialogTitle className="pr-12 text-xl font-black">스크립트 편집</DialogTitle>
    <DialogDescription className="mt-1 text-sm text-app-muted">수정할 때마다 기존 버전을 보존한 새 수동 편집 버전이 생성됩니다.</DialogDescription>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="편집할 문장">{script.segments.map((item, index) => <button key={item.id} type="button" onClick={() => { setSelectedIndex(index); setDraft(draftFor(item)); setMessage(null); }} aria-pressed={index === selectedIndex} className={`min-h-11 shrink-0 rounded-lg px-3 text-xs font-bold ${index === selectedIndex ? "bg-app-accent-surface" : "bg-app-raised text-app-muted"}`}>{index + 1} · {formatClock(item.startMs)}</button>)}</div>
    {segment ? <div className="mt-4 space-y-3 rounded-xl border border-app-border p-3">
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">시작(초)<Input type="number" min="0" step="0.001" className="mt-1" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label><label className="text-xs font-bold">끝(초)<Input type="number" min="0" step="0.001" className="mt-1" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label></div>
      <label className="block text-xs font-bold">화자<Input className="mt-1" maxLength={50} value={draft.speaker} onChange={(event) => setDraft({ ...draft, speaker: event.target.value })} /></label>
      <label className="block text-xs font-bold">일본어<textarea className="mt-1 min-h-24 w-full rounded-xl border border-app-border bg-app-bg p-3 text-base leading-7" value={draft.ja} onChange={(event) => setDraft({ ...draft, ja: event.target.value })} /></label>
      <label className="block text-xs font-bold">한국어<textarea className="mt-1 min-h-20 w-full rounded-xl border border-app-border bg-app-bg p-3 text-sm leading-6" value={draft.ko} onChange={(event) => setDraft({ ...draft, ko: event.target.value })} placeholder="번역이 없으면 비워 둡니다." /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={draft.needsReview} onChange={(event) => setDraft({ ...draft, needsReview: event.target.checked })} />검토 필요</label>
      <div className="grid grid-cols-3 gap-2"><Button disabled={busy} onClick={() => void save()}>저장</Button><Button variant="outline" disabled={busy || segment.endMs - segment.startMs < 2} onClick={() => void split()}>현재 위치 분할</Button><Button variant="outline" disabled={busy || selectedIndex >= script.segments.length - 1} onClick={() => void mergeNext()}>다음과 합치기</Button></div>
      <p className="text-[11px] text-app-muted">분할 위치가 현재 문장 안이면 재생 위치를, 아니면 문장 중간을 사용합니다. 분할된 텍스트는 저장 후 각각 다시 편집할 수 있습니다.</p>
    </div> : null}
    {raw || processed ? <section className="mt-5"><h3 className="text-sm font-black">원본과 GPT 비교</h3><div className="mt-2 grid gap-2 sm:grid-cols-2"><CompareVersion label="Whisper 원본" version={raw} index={selectedIndex} /><CompareVersion label="GPT 교정·번역" version={processed} index={selectedIndex} /></div></section> : null}
    <section className="mt-5"><h3 className="flex items-center gap-2 text-sm font-black"><History aria-hidden="true" className="h-4 w-4" />버전 기록</h3>{loadingVersions ? <p className="mt-2 text-sm text-app-muted">버전을 불러오는 중...</p> : <div className="mt-2 space-y-2">{versions.map((version) => <div key={version.id} className="flex items-center gap-3 rounded-xl bg-app-raised p-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">v{version.versionNo} · {versionKind(version.kind)}</p><p className="text-[11px] text-app-muted">{version.segments.length}문장{version.createdAt ? ` · ${new Date(version.createdAt).toLocaleString("ko-KR")}` : ""}</p></div>{version.id === script.id ? <span className="text-xs font-bold text-app-accent">사용 중</span> : <Button size="sm" variant="outline" disabled={busy} onClick={() => void activate(version.id)}>복원</Button>}</div>)}</div>}</section>
    {message ? <p role="status" className={`mt-4 text-sm ${message.includes("못") || message.includes("확인") || message.includes("변경") ? "text-red-300" : "text-app-accent"}`}>{message}</p> : null}
  </DialogContent></Dialog>;
}

function CompareVersion({ label, version, index }: { label: string; version?: Script; index: number }) {
  const segment = version?.segments[index];
  return <div className="min-h-28 rounded-xl border border-app-border p-3"><p className="text-xs font-black text-app-muted">{label}</p>{segment ? <><p className="jp mt-2 text-sm leading-6">{segment.ja}</p><p className="mt-1 text-xs leading-5 text-app-muted">{segment.ko || "번역 없음"}</p></> : <p className="mt-2 text-xs text-app-muted">대응 문장이 없습니다.</p>}</div>;
}

function StateMessage({ icon, text, children }: { icon?: React.ReactNode; text: string; children?: React.ReactNode }) {
  return <div className="flex min-h-64 flex-col items-center justify-center gap-4 px-6 text-center text-sm text-app-muted">{icon}<p>{text}</p>{children}</div>;
}

export function findActiveSegment(segments: Array<Pick<Segment, "startMs" | "endMs">>, positionMs: number) {
  let low = 0; let high = segments.length - 1; let candidate = -1;
  while (low <= high) { const middle = (low + high) >> 1; if (segments[middle].startMs <= positionMs) { candidate = middle; low = middle + 1; } else high = middle - 1; }
  return candidate >= 0 && positionMs < segments[candidate].endMs ? candidate : -1;
}
function restoreLocalPosition(audioId: string, serverPosition: number) { const local = Number(localStorage.getItem(`jlpt:listening-progress:${audioId}`)); return Number.isFinite(local) && local >= 0 ? Math.max(local, serverPosition) : serverPosition; }
function readLanguageSettings() {
  if (typeof window === "undefined") return { ja: true, ko: false };
  try { const value = JSON.parse(localStorage.getItem("jlpt:listening-language") || "null") as { ja?: boolean; ko?: boolean } | null; return { ja: value?.ja !== false, ko: value?.ko === true }; }
  catch { return { ja: true, ko: false }; }
}
function formatClock(milliseconds: number) { if (!Number.isFinite(milliseconds)) return "0:00"; const seconds = Math.max(0, Math.floor(milliseconds / 1_000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function splitText(value: string): [string, string] {
  const midpoint = Math.max(1, Math.min(value.length - 1, Math.round(value.length / 2)));
  const candidates = [value.lastIndexOf("。", midpoint), value.lastIndexOf("、", midpoint), value.lastIndexOf(" ", midpoint)].filter((index) => index > 0);
  const splitAt = candidates.length ? Math.max(...candidates) + 1 : midpoint;
  const first = value.slice(0, splitAt).trim(); const second = value.slice(splitAt).trim();
  return [first || value.slice(0, midpoint).trim(), second || value.slice(midpoint).trim()];
}
function draftFor(segment?: Segment) { return segment ? { start: String(segment.startMs / 1_000), end: String(segment.endMs / 1_000), speaker: segment.speaker || "", ja: segment.ja, ko: segment.ko || "", needsReview: segment.needsReview } : { start: "0", end: "0", speaker: "", ja: "", ko: "", needsReview: false }; }
function versionKind(value: string) { return ({ whisper_raw: "Whisper 원본", gpt_processed: "GPT 교정", manual_edit: "수동 편집" } as Record<string, string>)[value] || value; }
function statusText(status: string, hasScript: boolean) { if (hasScript) return "스크립트 준비됨"; return ({ uploaded: "처리 요청 전", queued: "처리 대기 중", transcribing: "음성 인식 중", transcribed: "음성 인식 완료", correcting: "교정·번역 중", failed: "처리 실패", missing: "음원 파일 없음" } as Record<string, string>)[status] || status; }
async function responseMessage(response: Response) { const body = await response.json().catch(() => null) as { error?: { message?: string } } | null; return body?.error?.message || `요청에 실패했습니다 (${response.status}).`; }
