import { defineConfig, devices } from "@playwright/test";
import { createHmac } from "node:crypto";

const e2ePort = Number(process.env.JLPT_E2E_PORT || 4174);
const accessSecret = "e2e-host-access-secret";
const accessCookie = createHmac("sha256", accessSecret).update("jlpt-access-session-v1").digest("base64url");
const authenticatedStorage = {
  cookies: [{
    name: "jlpt_access",
    value: accessCookie,
    domain: "127.0.0.1",
    path: "/",
    expires: -1,
    httpOnly: true,
    secure: false,
    sameSite: "Lax" as const,
  }],
  origins: [],
};

export default defineConfig({
  testDir: "./e2e",
  outputDir: "/tmp/jlpt-playwright-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: `http://127.0.0.1:${e2ePort}`, trace: "retain-on-failure", storageState: authenticatedStorage },
  webServer: { command: "tsx scripts/e2e-server.ts", url: `http://127.0.0.1:${e2ePort}/healthz`, reuseExistingServer: false, timeout: 120_000 },
  projects: [
    { name: "desktop-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 900 } } },
    { name: "mobile-320", use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 320, height: 700 } } },
    { name: "mobile-360", use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 360, height: 800 } } },
    { name: "mobile-390", use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 390, height: 844 } } },
    { name: "mobile-430", use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 430, height: 932 } } },
  ],
});
