import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/app-header";

export const metadata: Metadata = { title: { default: "JLPT 단어", template: "%s | JLPT 단어" }, description: "원본 단어장을 보존하며 검색하고 복습하는 JLPT 어휘 학습 도구" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><AppHeader /><main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 pb-24 sm:py-12 md:pb-12">{children}</main></body></html>;
}
