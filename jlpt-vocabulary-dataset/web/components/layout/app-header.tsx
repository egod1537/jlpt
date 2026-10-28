"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, RotateCcw, Search, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "홈", icon: Home },
  { href: "/books", label: "단어장", icon: BookOpen },
  { href: "/search", label: "전체 검색", icon: Search },
  { href: "/study", label: "학습", icon: Sparkles },
  { href: "/due", label: "복습", icon: RotateCcw },
  { href: "/settings", label: "설정", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  return <>
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="rounded-lg text-lg font-black tracking-tight text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">JLPT 단어</Link>
        <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600", active && "bg-emerald-50 text-emerald-900")}><Icon aria-hidden="true" className="h-4 w-4" />{label}</Link>;
          })}
        </nav>
      </div>
    </header>
    <nav aria-label="모바일 주요 메뉴" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600", active && "text-emerald-800")}><Icon aria-hidden="true" className="h-5 w-5" />{label}</Link>;
      })}
    </nav>
  </>;
}
