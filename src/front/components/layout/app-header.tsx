"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Headphones, Plus, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncStatus } from "@/components/sync/sync-status";
import { AddContentDialog } from "@/components/library/add-content-dialog";

const navigation = [
  { href: "/books", label: "단어장", icon: BookOpen },
  { href: "/listening", label: "청해", icon: Headphones },
];

export function AppHeader() {
  const pathname = usePathname();
  const [studyActive, setStudyActive] = useState(false);
  useEffect(() => {
    const changed = (event: Event) => setStudyActive(Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active));
    window.addEventListener("jlpt-study-active", changed);
    return () => window.removeEventListener("jlpt-study-active", changed);
  }, []);
  if (pathname.startsWith("/study") && studyActive) return null;
  return <>
    <header className="sticky top-0 z-40 border-b border-app-border bg-app-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <Link href="/books" className="inline-flex min-h-11 items-center rounded-lg px-1 text-lg font-black tracking-tight text-app-accent">JLPT</Link>
          <div className="hidden sm:block"><SyncStatus /></div>
        </div>
        <nav aria-label="상단 작업" className="flex items-center gap-1">
          <Link href="/search" aria-label="검색" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-app-muted hover:bg-app-raised"><Search aria-hidden="true" className="h-5 w-5" /></Link>
          <AddContentDialog><button type="button" aria-label="추가" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-app-muted hover:bg-app-raised"><Plus aria-hidden="true" className="h-5 w-5" /></button></AddContentDialog>
          <Link href="/settings" aria-label="설정" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-app-muted hover:bg-app-raised"><Settings aria-hidden="true" className="h-5 w-5" /></Link>
        </nav>
      </div>
    </header>
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-40 mx-auto grid grid-cols-2 border-t border-app-border bg-app-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:max-w-md md:rounded-t-2xl md:border-x">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-bold text-app-muted", active && "text-app-accent")}><Icon aria-hidden="true" className="h-5 w-5" />{label}</Link>;
      })}
    </nav>
  </>;
}
