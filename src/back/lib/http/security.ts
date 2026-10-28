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
  const forwarded = trustProxy ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : undefined;
  const direct = request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${forwarded || direct}\0${username.trim().toLocaleLowerCase()}`).digest("hex");
}
