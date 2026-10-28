import type { Metadata } from "next";
import { DuePage } from "@/components/due/due-page";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata: Metadata = { title: "복습 예정" };
export default function DueRoute() { return <><PageHeading eyebrow="간격 반복 일정" title="복습 예정" description="평가 후 예정 시각이 지난 단어만 표시합니다. 아직 학습하지 않은 단어와 미래 일정은 포함하지 않습니다." /><DuePage /></>; }
