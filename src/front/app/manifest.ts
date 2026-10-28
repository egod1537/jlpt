import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "JLPT 단어장",
    short_name: "JLPT 단어",
    description: "검색하고 복습하는 개인용 JLPT 어휘 학습 도구",
    lang: "ko",
    start_url: "/books",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#047857",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/jlpt-book.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png", purpose: "any" },
      { src: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png", purpose: "any" },
      { src: "/icons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
