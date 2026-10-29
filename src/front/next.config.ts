import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  serverExternalPackages: ["better-sqlite3"],
  images: { unoptimized: true },
};

export default nextConfig;
