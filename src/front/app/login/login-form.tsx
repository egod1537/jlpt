"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        setError(body?.error?.message || "로그인하지 못했습니다.");
        return;
      }
      router.replace("/books");
      router.refresh();
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setPending(false);
    }
  }

  return <form action="/api/auth/login" method="post" onSubmit={submit} className="space-y-5">
    <div className="space-y-2">
      <label htmlFor="username" className="block text-sm font-bold text-slate-700">사용자 이름</label>
      <Input id="username" name="username" autoComplete="username" required maxLength={64} autoFocus />
    </div>
    <div className="space-y-2">
      <label htmlFor="password" className="block text-sm font-bold text-slate-700">비밀번호</label>
      <Input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} />
    </div>
    {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p> : null}
    <Button type="submit" className="w-full" disabled={pending}>{pending ? "확인 중…" : "로그인"}</Button>
  </form>;
}
