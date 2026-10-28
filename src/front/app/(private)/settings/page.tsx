import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = { title: "설정과 백업" };
export default function SettingsRoute() { return <SettingsPage />; }
