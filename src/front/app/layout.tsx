import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "JLPT 단어", template: "%s | JLPT 단어" },
  description: "원본 단어장을 보존하며 검색하고 복습하는 JLPT 어휘 학습 도구",
  applicationName: "JLPT 단어",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
      { url: "/icons/jlpt-book.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
  appleWebApp: { capable: true, title: "JLPT 단어", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0f1218", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
