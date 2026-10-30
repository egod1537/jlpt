"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Languages, LoaderCircle, Pause, Play, Repeat2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AudioMetadata = {
  id: string; originalName: string; durationMs: number | null; status: string; streamUrl: string; revision: number;
};
type Segment = {
  id: string; ordinal: number; startMs: number; endMs: number; speaker: string | null; ja: string; ko: string | null; needsReview: boolean;
};
type Script = { id: string; versionNo: number; kind: string; segments: Segment[] };
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
  const [showJa, setShowJa] = useState(true);
  const [showKo, setShowKo] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

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
    element.currentTime = Math.max(0, milliseconds) / 1_000;
    setPositionMs(Math.max(0, milliseconds));
    if (shouldPlay) void element.play();
  }, []);
  const moveSegment = (direction: -1 | 1) => {
    if (!segments.length) return;
    const current = activeIndex < 0 ? 0 : activeIndex;
    seek(segments[Math.max(0, Math.min(segments.length - 1, current + direction))].startMs, playing);
  };
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
    if (repeat && activeIndex >= 0 && currentMs >= segments[activeIndex].endMs - 40) { seek(segments[activeIndex].startMs, true); return; }
    const index = findActiveSegment(segments, currentMs);
    setActiveIndex(index);
    void saveProgress();
  };

  return <div className="fixed inset-0 z-50 flex min-w-80 flex-col bg-app-bg text-app-text">
    <header className="shrink-0 border-b border-app-border bg-app-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
        <Link href="/listening" aria-label="청해 목록으로" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-app-muted hover:bg-app-raised"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-bold">{audio?.originalName || "청해"}</h1><p className="text-[11px] text-app-muted">{audio ? statusText(audio.status, Boolean(script)) : "불러오는 중"}</p></div>
        <button type="button" aria-pressed={showJa} onClick={() => setShowJa((value) => !value)} className={`min-h-11 rounded-xl px-3 text-xs font-black ${showJa ? "bg-app-accent-surface text-white" : "text-app-muted"}`}>日</button>
        <button type="button" aria-pressed={showKo} onClick={() => setShowKo((value) => !value)} className={`min-h-11 rounded-xl px-3 text-xs font-black ${showKo ? "bg-app-accent-surface text-white" : "text-app-muted"}`}>한</button>
      </div>
    </header>

    <div ref={scriptRef} onWheel={() => setAutoFollow(false)} onTouchMove={() => setAutoFollow(false)} className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto overscroll-contain px-3 py-4">
      {loading ? <StateMessage icon={<LoaderCircle className="h-7 w-7 animate-spin" />} text="음원과 스크립트를 불러오는 중입니다." /> : null}
      {error ? <StateMessage text={error}><Button onClick={() => void load()}>다시 시도</Button></StateMessage> : null}
      {!loading && !error && !script ? <StateMessage icon={<Languages className="h-8 w-8" />} text={audio?.status === "failed" ? "스크립트 처리에 실패했습니다. 음원은 바로 재생할 수 있습니다." : "스크립트를 준비하고 있습니다. 음원은 먼저 재생할 수 있습니다."}><Button disabled={actionBusy} onClick={() => void retry()}>{actionBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}{audio?.status === "failed" ? "다시 처리" : "처리 요청"}</Button></StateMessage> : null}
      {script ? <div role="list" aria-label="청해 스크립트" className="space-y-1 pb-3">
        {segments.map((segment, index) => <button id={`listening-segment-${index}`} role="listitem" key={segment.id} type="button" onClick={() => { setAutoFollow(true); seek(segment.startMs, true); }} className={`block min-h-14 w-full rounded-xl border px-4 py-3 text-left [content-visibility:auto] [contain-intrinsic-size:auto_80px] ${index === activeIndex ? "border-app-accent bg-app-accent-surface/35" : "border-transparent hover:bg-app-surface"}`}>
          <span className="mb-1 flex items-center gap-2 text-[10px] font-bold text-app-muted"><span>{formatClock(segment.startMs)}</span>{segment.speaker ? <span>{segment.speaker}</span> : null}{segment.needsReview ? <span className="text-app-warning">검토 필요</span> : null}</span>
          {showJa ? <span className="jp block text-base leading-7">{segment.ja || "…"}</span> : null}
          {showKo ? <span className={`block leading-6 text-app-muted ${showJa ? "mt-1 text-sm" : "text-base"}`}>{segment.ko || "번역 대기 중"}</span> : null}
          {!showJa && !showKo ? <span className="block text-sm text-app-muted">문장 {index + 1}</span> : null}
        </button>)}
      </div> : null}
    </div>

    {!autoFollow && script ? <button type="button" onClick={() => setAutoFollow(true)} className="absolute bottom-36 left-1/2 min-h-11 -translate-x-1/2 rounded-full border border-app-border bg-app-raised px-4 text-xs font-bold shadow-lg">현재 문장 따라가기</button> : null}
    <footer className="shrink-0 border-t border-app-border bg-app-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl px-3 pb-2 pt-3">
        <audio ref={audioRef} src={audio?.streamUrl} preload="metadata" onLoadedMetadata={(event) => { const element = event.currentTarget; const restored = Math.min(initialSeekRef.current || 0, Math.max(0, element.duration * 1_000 - 500)); element.currentTime = restored / 1_000; element.playbackRate = rate; setPositionMs(restored); setDurationMs(Math.round(element.duration * 1_000)); }} onDurationChange={(event) => setDurationMs(Math.round(event.currentTarget.duration * 1_000) || audio?.durationMs || 0)} onTimeUpdate={onTimeUpdate} onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); void saveProgress(true); }} onEnded={() => { setPlaying(false); void saveProgress(true); }} />
        <label className="sr-only" htmlFor="listening-position">재생 위치</label><input id="listening-position" type="range" min={0} max={Math.max(durationMs, 1)} step={100} value={Math.min(positionMs, Math.max(durationMs, 1))} onChange={(event) => seek(Number(event.target.value))} className="h-6 w-full accent-[var(--accent)]" />
        <div className="-mt-1 flex justify-between text-[10px] tabular-nums text-app-muted"><span>{formatClock(positionMs)}</span><span>{formatClock(durationMs)}</span></div>
        <div className="mt-1 grid grid-cols-5 items-center gap-1">
          <button type="button" onClick={changeRate} aria-label={`재생 속도 ${rate}배, 눌러 변경`} className="min-h-12 rounded-xl text-xs font-black text-app-muted">{rate}×</button>
          <button type="button" onClick={() => moveSegment(-1)} aria-label="이전 문장" className="min-h-12 rounded-xl text-app-muted hover:bg-app-raised"><ChevronLeft aria-hidden="true" className="mx-auto h-6 w-6" /></button>
          <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? "일시 정지" : "재생"} className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-accent-surface text-white">{playing ? <Pause aria-hidden="true" className="h-6 w-6 fill-current" /> : <Play aria-hidden="true" className="ml-0.5 h-6 w-6 fill-current" />}</button>
          <button type="button" onClick={() => moveSegment(1)} aria-label="다음 문장" className="min-h-12 rounded-xl text-app-muted hover:bg-app-raised"><ChevronRight aria-hidden="true" className="mx-auto h-6 w-6" /></button>
          <button type="button" aria-pressed={repeat} onClick={() => setRepeat((value) => !value)} aria-label="현재 문장 반복" className={`min-h-12 rounded-xl ${repeat ? "text-app-accent" : "text-app-muted"}`}><Repeat2 aria-hidden="true" className="mx-auto h-5 w-5" /></button>
        </div>
        {script ? <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-app-muted"><Download aria-hidden="true" className="h-3 w-3" />{(["json", "txt", "srt"] as const).map((format) => <a key={format} className="min-h-11 px-2 py-3 uppercase hover:text-app-text" href={`/api/listening/audio/${encodeURIComponent(audioId)}/script/export?format=${format}`}>{format}</a>)}</div> : null}
      </div>
    </footer>
  </div>;
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
function statusText(status: string, hasScript: boolean) { if (hasScript) return "스크립트 준비됨"; return ({ uploaded: "처리 요청 전", queued: "처리 대기 중", transcribing: "음성 인식 중", transcribed: "음성 인식 완료", correcting: "교정·번역 중", failed: "처리 실패", missing: "음원 파일 없음" } as Record<string, string>)[status] || status; }
async function responseMessage(response: Response) { const body = await response.json().catch(() => null) as { error?: { message?: string } } | null; return body?.error?.message || `요청에 실패했습니다 (${response.status}).`; }
