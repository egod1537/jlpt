import { createHash } from "node:crypto";

export function expectedOrigin(request: Request) {
  const configured = process.env.JLPT_APP_ORIGIN?.replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

export function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === expectedOrigin(request));
}

export function loginAttemptKey(request: Request, username: string) {
  const trustProxy = process.env.JLPT_TRUST_PROXY === "true";
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const networkKey = trustProxy ? forwarded || request.headers.get("x-real-ip") || "proxy-unknown" : "direct-client";
  return createHash("sha256").update(`${networkKey}\0${username.trim().toLocaleLowerCase()}`).digest("hex");
}
