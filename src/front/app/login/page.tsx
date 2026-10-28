import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { pageSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await pageSession()) redirect("/books");
  return <main className="mx-auto flex min-h-dvh max-w-md items-center px-5 py-12">
    <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <p className="text-sm font-bold text-emerald-700">OWNER ONLY</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">JLPT 단어</h1>
      <p className="mb-8 mt-3 text-sm leading-6 text-slate-600">내 단어장과 학습 기록을 보려면 로그인하세요.</p>
      <LoginForm />
    </section>
  </main>;
}
