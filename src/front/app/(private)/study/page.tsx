import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/data-state";
import { MobileStudyPage } from "@/components/study/mobile-study-page";

export const metadata: Metadata = { title: "학습" };
export default function StudyRoute() { return <Suspense fallback={<LoadingState />}><MobileStudyPage /></Suspense>; }
