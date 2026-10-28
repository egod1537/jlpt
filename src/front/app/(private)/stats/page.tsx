import type { Metadata } from "next";
import { StatsPage } from "@/components/stats/stats-page";
export const metadata: Metadata = { title: "통계" };
export default function StatsRoute() { return <StatsPage />; }
