import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { pageSession } from "@/lib/server/session";
import { SyncProvider } from "@/components/sync/sync-provider";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!await pageSession()) redirect("/login");
  return <SyncProvider>
    <AppHeader />
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 pb-24 sm:py-12 md:pb-12">{children}</main>
  </SyncProvider>;
}
