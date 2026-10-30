import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { pageAccess, accessSecret } from "@/lib/server/access";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if ((await pageAccess()).allowed) redirect("/books");
  const { error } = await searchParams;
  const configured = Boolean(accessSecret());
  return <main className="flex min-h-dvh items-center justify-center bg-app-bg px-4 py-10 text-app-text">
    <section className="w-full max-w-sm rounded-2xl border border-app-border bg-app-surface p-6 shadow-xl">
      <LockKeyhole aria-hidden="true" className="h-8 w-8 text-app-accent" />
      <h1 className="mt-4 text-2xl font-black">JLPT 개인 서버</h1>
      <p className="mt-2 text-sm leading-6 text-app-muted">서버 관리자가 설정한 접근 암호를 입력하세요. 암호는 URL이나 브라우저 저장소에 남기지 않습니다.</p>
      {configured ? <form action="/api/access/login" method="post" className="mt-6 space-y-4"><input type="hidden" name="next" value="/books" /><label className="block text-sm font-bold">접근 암호<input type="password" name="accessToken" required autoComplete="current-password" className="mt-2 min-h-12 w-full rounded-xl border border-app-border bg-app-bg px-3" /></label>{error === "invalid" ? <p role="alert" className="rounded-xl bg-red-950 p-3 text-sm text-red-200">접근 암호가 올바르지 않습니다.</p> : null}<button type="submit" className="min-h-12 w-full rounded-xl bg-app-accent-surface px-4 font-bold text-white">접속</button></form> : <p role="alert" className="mt-6 rounded-xl bg-amber-950 p-4 text-sm leading-6 text-amber-200">외부 접속이 비활성화되었습니다. 서버에 16자 이상의 <code>JLPT_ACCESS_TOKEN</code>을 설정하고 다시 시작하세요. 개발 모드의 loopback 접속만 자동 허용됩니다.</p>}
    </section>
  </main>;
}
