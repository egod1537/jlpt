"use client";

import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "데이터를 불러오는 중입니다" }: { label?: string }) { return <div className="flex min-h-48 items-center justify-center gap-3 text-slate-600" role="status"><LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />{label}</div>; }
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) { return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900" role="alert"><div className="flex gap-3"><AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">데이터를 불러오지 못했습니다.</p><p className="mt-1 text-sm">{error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}</p>{retry && <Button className="mt-4" variant="outline" onClick={retry}><RefreshCw aria-hidden="true" className="h-4 w-4" />다시 시도</Button>}</div></div></div>; }
export function EmptyState({ title, description }: { title: string; description: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold text-slate-900">{title}</p><p className="mt-2 text-sm text-slate-600">{description}</p></div>; }
