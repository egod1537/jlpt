import { redirect } from "next/navigation";
import { pageSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  redirect(await pageSession() ? "/books" : "/login");
}
