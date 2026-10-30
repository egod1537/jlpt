"use client";

import { useEffect, useState } from "react";
import { Bot, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConnectionStatus = {
  connected: boolean;
  canUseResponses: boolean;
  ready: boolean;
  verifiedAt?: string;
  verifiedModel?: string;
  account?: { email?: string; name?: string; expiresAt?: string };
};

const oauthErrors: Record<string, string> = {
  INVALID_STATE: "인증 요청을 확인하지 못했습니다. 다시 연결해 주세요.",
  EXPIRED_STATE: "인증 시간이 만료되었습니다. 다시 연결해 주세요.",
  OAUTH_DENIED: "ChatGPT 연결이 취소되었습니다.",
  MISSING_DIRECT_SCOPE: "Responses API 사용 권한이 승인되지 않았습니다.",
  ACCOUNT_MISMATCH: "선택한 계정과 인증 결과가 달라 연결하지 않았습니다.",
  UPSTREAM: "OpenAI 인증 서버 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  INTERNAL: "ChatGPT 연결을 완료하지 못했습니다.",
};

export function OpenAiConnection() {
  const [status, setStatus] = useState<ConnectionStatus>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const response = await fetch("/api/openai/status", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "연결 상태를 확인하지 못했습니다.");
      setStatus(body);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "연결 상태를 확인하지 못했습니다."); }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const oauthError = query.get("openai_error");
    const timer = window.setTimeout(() => {
      if (oauthError) setError(oauthErrors[oauthError] || "ChatGPT 연결을 완료하지 못했습니다.");
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const disconnect = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/openai/disconnect", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "연결을 해제하지 못했습니다.");
      setStatus({ connected: false, canUseResponses: false, ready: false, account: status?.account });
      if (!body.revoked) setError("로컬 연결은 해제했지만 OpenAI 원격 세션 폐기는 확인하지 못했습니다. ChatGPT 설정에서도 연결을 확인해 주세요.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "연결을 해제하지 못했습니다."); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/openai/verify", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "실제 Responses 호출을 검증하지 못했습니다.");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "실제 Responses 호출을 검증하지 못했습니다."); }
    finally { setBusy(false); }
  };

  return <section className="mt-5 rounded-2xl border border-app-border bg-app-surface p-5">
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-app-raised text-app-accent"><Bot aria-hidden="true" className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="font-black">Responses API OAuth</h2>
        {!status ? <p className="mt-2 text-sm text-app-muted">연결 상태를 확인하는 중입니다…</p> : status.connected ? <>
          <p className="mt-2 truncate text-sm font-bold">{status.account?.name || status.account?.email || "연결된 ChatGPT 계정"}</p>
          {status.account?.name && status.account.email ? <p className="mt-1 truncate text-xs text-app-muted">{status.account.email}</p> : null}
          <p className={`mt-2 text-sm font-bold ${status.ready ? "text-app-accent" : "text-app-warning"}`}>{status.ready ? `GPT 준비됨 · ${status.verifiedModel}` : "OAuth 연결됨 · 실제 모델 호출 미검증"}</p>
          <p className="mt-1 text-xs leading-5 text-app-muted">{status.ready && status.verifiedAt ? `${new Date(status.verifiedAt).toLocaleString("ko-KR")}에 모델 목록과 단일 Responses 스트림을 확인했습니다.` : "검증 버튼은 모델 목록 조회와 짧은 실제 요청을 한 번 실행합니다."}</p>
        </> : <>
          <p className="mt-2 text-sm leading-6 text-app-muted">내 ChatGPT Plus 또는 Pro 계정을 OAuth로 승인해 Responses API를 사용합니다. API 키는 필요하지 않습니다.</p>
          {status.account?.email ? <p className="mt-2 text-xs text-app-muted">이전에 연결한 계정: {status.account.email}</p> : null}
        </>}
      </div>
    </div>
    {error ? <p role="alert" className="mt-4 rounded-xl bg-red-950 p-3 text-sm text-red-200">{error}</p> : null}
    <div className="mt-4 flex flex-wrap gap-2">
      {status?.connected ? <>
        <Button disabled={busy} onClick={() => void verify()}>{busy ? <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}GPT 연결 검증</Button>
        <Button asChild variant="outline"><a href="/api/openai/oauth/start"><RefreshCw aria-hidden="true" className="h-4 w-4" />다시 인증</a></Button>
        <Button asChild variant="ghost"><a href="/api/openai/oauth/start?new=1">다른 계정</a></Button>
        <Button variant="ghost" disabled={busy} onClick={() => void disconnect()}><LogOut aria-hidden="true" className="h-4 w-4" />연결 해제</Button>
      </> : <Button asChild><a href="/api/openai/oauth/start">Continue with ChatGPT</a></Button>}
    </div>
    <p className="mt-4 text-xs leading-5 text-app-muted">OAuth 토큰은 이 서버의 로컬 자격증명 파일에만 저장되며 브라우저와 JLPT 백업에는 포함되지 않습니다.</p>
  </section>;
}
