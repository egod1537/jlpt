"use client";

import { Download, HardDrive, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProgress } from "@/hooks/use-progress";
import { dueRecords, exportProgress, parseProgress, resetAppStorage, saveProgress } from "@/lib/progress";
import type { ProgressState } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function SettingsPage() {
  const { progress, refresh } = useProgress();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ProgressState | null>(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const records = Object.values(progress.records);
  const due = useMemo(() => dueRecords(progress).length, [progress]);
  const download = () => {
    const blob = new Blob([exportProgress(progress)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `jlpt-progress-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    setMessage("학습 진도 백업을 내보냈습니다."); setError(null);
  };
  const chooseFile = async (file: File | undefined) => {
    setPreview(null); setMessage(null); setError(null);
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError("백업 파일은 5MB 이하여야 합니다."); return; }
    try { const parsed = parseProgress(JSON.parse(await file.text()) as unknown); setPreview(parsed); setFileName(file.name); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "백업 파일을 읽을 수 없습니다."); }
  };
  const replace = () => {
    if (!preview) return;
    if (!saveProgress(preview)) { setError("브라우저 저장소에 백업을 저장하지 못했습니다."); return; }
    setMessage(`${Object.keys(preview.records).length}개의 학습 기록으로 교체했습니다.`); setError(null); setPreview(null); if (inputRef.current) inputRef.current.value = ""; refresh();
  };
  const reset = () => { resetAppStorage(); setConfirmReset(false); setPreview(null); setMessage("이 사이트의 학습 진도와 중단 세션을 삭제했습니다."); setError(null); refresh(); };
  return <div className="grid gap-5 lg:grid-cols-2">
    <Card><CardHeader><CardTitle>내 기기 학습 현황</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-black">{formatNumber(records.length)}</p><p className="mt-1 text-xs text-slate-600">학습한 단어</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-black">{formatNumber(due)}</p><p className="mt-1 text-xs text-slate-600">복습 예정</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-black">{formatNumber(records.reduce((sum, record) => sum + record.lapses, 0))}</p><p className="mt-1 text-xs text-slate-600">다시 평가</p></div></div><div className="mt-5 flex gap-3 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><HardDrive aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><p>진도는 이 브라우저의 localStorage에만 저장됩니다. 계정·클라우드 동기화·분석 전송은 없습니다.</p></div></CardContent></Card>
    <Card><CardHeader><CardTitle>백업 내보내기</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">단어 원문 없이 단어 ID와 반복 일정만 UTF-8 JSON으로 저장합니다.</p><Button className="mt-4 w-full" onClick={download}><Download aria-hidden="true" className="h-4 w-4" />진도 JSON 다운로드</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>백업 가져오기</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">지원 버전과 ID·수치·날짜를 검증한 뒤 기존 진도를 완전히 교체합니다. 자동 병합하지 않습니다.</p><input ref={inputRef} type="file" accept="application/json,.json" className="mt-4 block w-full text-sm file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:font-semibold" onChange={(event) => void chooseFile(event.target.files?.[0])} />{preview && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-emerald-700" /><p className="font-bold">검증 완료</p></div><p className="mt-2 text-sm">{fileName} · {formatNumber(Object.keys(preview.records).length)}개 기록</p><p className="mt-2 text-sm font-semibold text-red-800">확인하면 현재 학습 진도를 교체합니다.</p><Button className="mt-4" onClick={replace}><Upload aria-hidden="true" className="h-4 w-4" />이 백업으로 교체</Button></div>}</CardContent></Card>
    <Card><CardHeader><CardTitle>이 사이트 데이터 초기화</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">학습 진도와 중단한 세션만 삭제합니다. 같은 출처의 다른 사이트 저장값은 지우지 않습니다.</p>{confirmReset ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-bold text-red-900">백업하지 않은 진도는 복구할 수 없습니다.</p><div className="mt-3 flex gap-2"><Button variant="destructive" onClick={reset}><Trash2 aria-hidden="true" className="h-4 w-4" />정말 삭제</Button><Button variant="outline" onClick={() => setConfirmReset(false)}>취소</Button></div></div> : <Button className="mt-4" variant="outline" onClick={() => setConfirmReset(true)}>초기화 확인</Button>}</CardContent></Card>
    {(message || error) && <div role={error ? "alert" : "status"} className={`rounded-xl p-4 lg:col-span-2 ${error ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-950"}`}>{error ?? message}</div>}
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 lg:col-span-2"><div className="flex flex-wrap gap-2"><Badge variant="warning">주의</Badge><Badge variant="outline">로컬 전용</Badge></div><p className="mt-3 text-sm leading-6 text-amber-950">브라우저 저장소를 지우면 백업하지 않은 진도가 사라집니다. 데이터셋에는 교재·강의·시험 관련 출처가 섞여 있으며, 이 앱은 원자료의 재배포 권리를 보장하지 않습니다.</p></div>
  </div>;
}
