import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/data-state";
import { PageHeading } from "@/components/layout/page-heading";
import { StudyPage } from "@/components/study/study-page";

export const metadata: Metadata = { title: "플래시카드 학습" };
export default function StudyRoute() { return <><PageHeading eyebrow="로컬 학습 세션" title="플래시카드 학습" description="단어장을 골라 카드를 뒤집고 기억 정도를 평가하세요. 평가는 같은 단어 ID의 모든 출처에 공유됩니다." /><Suspense fallback={<LoadingState />}><StudyPage /></Suspense></>; }
