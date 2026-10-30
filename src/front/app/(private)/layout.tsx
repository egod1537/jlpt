import { AppHeader } from "@/components/layout/app-header";
import { SyncProvider } from "@/components/sync/sync-provider";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SyncProvider>
    <AppHeader />
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 pb-24 sm:py-12">{children}</main>
  </SyncProvider>;
}
