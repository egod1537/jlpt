import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";

function getGitCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  define: {
    __APP_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
