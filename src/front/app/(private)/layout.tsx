import { AppHeader } from "@/components/layout/app-header";
import { SyncProvider } from "@/components/sync/sync-provider";
import { redirect } from "next/navigation";
import { pageAccess } from "@/lib/server/access";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await pageAccess()).allowed) redirect("/login");
  return <SyncProvider>
    <AppHeader />
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 pb-24 sm:py-12">{children}</main>
  </SyncProvider>;
}
