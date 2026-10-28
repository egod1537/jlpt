import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  serverExternalPackages: ["argon2", "better-sqlite3"],
  images: { unoptimized: true },
};

export default nextConfig;
