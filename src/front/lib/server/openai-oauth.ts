import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { createRemoteJWKSet, jwtVerify } from "jose";

const issuer = "https://auth.openai.com";
const authorizationEndpoint = `${issuer}/api/accounts/authorize`;
const tokenEndpoint = `${issuer}/api/accounts/oauth/token`;
const resource = "https://api.openai.com/v1";
const requiredScope = "chatgpt.tokens.use.direct";
const requestedScopes = ["openid", "profile", "email", "offline_access", "resource.invoke", requiredScope];
const dynamicClientId = "dynamic_agent_client";
const pendingLifetimeMs = 10 * 60 * 1_000;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

type PendingAuthorization = {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  expectedSubject?: string;
  createdAt: string;
};

type StoredAccount = {
  clientId: string;
  subject: string;
  email?: string;
  name?: string;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  scopes: string[];
  expiresAt?: string;
};

type AuthStore = {
  version: 1;
  hostId: string;
  activeClientId?: string;
  accounts: Record<string, StoredAccount>;
  pending?: PendingAuthorization;
};

type TokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  id_token?: unknown;
  expires_in?: unknown;
  scope?: unknown;
  token_type?: unknown;
};

export type OpenAiAuthStatus = {
  connected: boolean;
  canUseResponses: boolean;
  account?: { email?: string; name?: string; expiresAt?: string };
};

export class OpenAiAuthError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) { super(message); }
}

export class OpenAiUpstreamError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly requestId?: string,
  ) { super(message); }
}

const openAiGlobal = globalThis as typeof globalThis & { __jlptOpenAiStoreQueue?: Promise<void> };
openAiGlobal.__jlptOpenAiStoreQueue ||= Promise.resolve();
let discoveryPromise: Promise<{ revocation_endpoint: string }> | undefined;

function withStore<T>(operation: (store: AuthStore) => Promise<T>): Promise<T> {
  const run = openAiGlobal.__jlptOpenAiStoreQueue!.then(async () => {
    const store = await readStore();
    return operation(store);
  });
  openAiGlobal.__jlptOpenAiStoreQueue = run.then(() => undefined, () => undefined);
  return run;
}

function authFilePath() {
  if (process.env.JLPT_OPENAI_AUTH_PATH) return process.env.JLPT_OPENAI_AUTH_PATH;
  if (process.env.JLPT_DB_PATH) return path.join(path.dirname(process.env.JLPT_DB_PATH), "openai-auth.json");
  return path.resolve(process.cwd(), "..", "..", "var", "openai-auth.json");
}

function newStore(): AuthStore {
  return { version: 1, hostId: `urn:uuid:${randomUUID()}`, accounts: {} };
}

async function readStore(): Promise<AuthStore> {
  try {
    const parsed = JSON.parse(await readFile(/* turbopackIgnore: true */ authFilePath(), "utf8")) as Partial<AuthStore>;
    if (parsed.version !== 1 || typeof parsed.hostId !== "string" || !parsed.hostId || !parsed.accounts || typeof parsed.accounts !== "object") {
      throw new OpenAiAuthError("INVALID_AUTH_STORE", "저장된 OpenAI 인증 정보를 읽을 수 없습니다.", 500);
    }
    return parsed as AuthStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return newStore();
    if (error instanceof OpenAiAuthError) throw error;
    throw new OpenAiAuthError("INVALID_AUTH_STORE", "저장된 OpenAI 인증 정보를 읽을 수 없습니다.", 500);
  }
}

async function writeStore(store: AuthStore) {
  const target = authFilePath();
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
  try { await chmod(target, 0o600); } catch { /* Windows does not implement POSIX owner-only modes. */ }
}

function randomBase64Url(bytes = 32) { return randomBytes(bytes).toString("base64url"); }
function pkceChallenge(verifier: string) { return createHash("sha256").update(verifier).digest("base64url"); }

function activeAccount(store: AuthStore) {
  return store.activeClientId ? store.accounts[store.activeClientId] : undefined;
}

async function getDiscovery() {
  discoveryPromise ||= fetch(`${issuer}/.well-known/openid-configuration`, { cache: "force-cache" }).then(async (response) => {
    if (!response.ok) throw new OpenAiUpstreamError(response.status, "OpenAI OAuth 설정을 불러오지 못했습니다.");
    const value = await response.json() as { revocation_endpoint?: unknown };
    if (typeof value.revocation_endpoint !== "string" || new URL(value.revocation_endpoint).origin !== issuer) {
      throw new OpenAiAuthError("INVALID_DISCOVERY", "OpenAI OAuth 설정이 올바르지 않습니다.", 502);
    }
    return { revocation_endpoint: value.revocation_endpoint };
  });
  return discoveryPromise;
}

export function resolveOpenAiRedirectUri(requestUrl: string, requestHost?: string | null) {
  const requestOrigin = requestHost ? `http://${requestHost}` : requestUrl;
  const redirectUri = process.env.JLPT_OPENAI_OAUTH_REDIRECT_URI || new URL("/api/openai/oauth/callback", requestOrigin).toString();
  const parsed = new URL(redirectUri);
  if (parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1") {
    throw new OpenAiAuthError("LOOPBACK_REQUIRED", "ChatGPT 요금제 연결은 127.0.0.1 로컬 주소에서만 시작할 수 있습니다.", 400);
  }
  return parsed.toString();
}

export async function beginOpenAiAuthorization(redirectUri: string, registerNew = false) {
  return withStore(async (store) => {
    const account = registerNew ? undefined : activeAccount(store);
    const state = randomBase64Url();
    const nonce = randomBase64Url();
    const codeVerifier = randomBase64Url(48);
    const clientId = account?.clientId || dynamicClientId;
    store.pending = {
      state,
      nonce,
      codeVerifier,
      redirectUri,
      clientId,
      expectedSubject: account?.subject,
      createdAt: new Date().toISOString(),
    };
    await writeStore(store);

    const url = new URL(authorizationEndpoint);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", requestedScopes.join(" "));
    url.searchParams.set("resource", resource);
    url.searchParams.set("state", state);
    url.searchParams.set("nonce", nonce);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", pkceChallenge(codeVerifier));
    url.searchParams.set("ext_agent_host_id", store.hostId);
    if (account) {
      if (account.idToken) url.searchParams.set("id_token_hint", account.idToken);
      if (account.email) url.searchParams.set("login_hint", account.email);
    } else {
      url.searchParams.set("agent_name_hint", process.env.JLPT_OPENAI_AGENT_NAME || "JLPT Study");
    }
    return url;
  });
}

export async function finishOpenAiAuthorization(input: { code?: string; state?: string; clientId?: string; error?: string }) {
  return withStore(async (store) => {
    const pending = store.pending;
    if (!pending || !input.state || input.state !== pending.state) {
      throw new OpenAiAuthError("INVALID_STATE", "OAuth state가 일치하지 않습니다.");
    }
    delete store.pending;
    await writeStore(store);

    if (Date.now() - Date.parse(pending.createdAt) > pendingLifetimeMs) throw new OpenAiAuthError("EXPIRED_STATE", "OAuth 요청이 만료되었습니다.");
    if (input.error) throw new OpenAiAuthError("OAUTH_DENIED", "ChatGPT 연결이 취소되었습니다.");
    if (!input.code) throw new OpenAiAuthError("MISSING_CODE", "OAuth 인증 코드가 없습니다.");

    let issuedClientId = pending.clientId;
    if (pending.clientId === dynamicClientId) {
      if (!input.clientId || input.clientId === dynamicClientId) throw new OpenAiAuthError("MISSING_CLIENT_ID", "발급된 OAuth client ID가 없습니다.");
      issuedClientId = input.clientId;
    } else if (input.clientId && input.clientId !== pending.clientId) {
      throw new OpenAiAuthError("CLIENT_MISMATCH", "OAuth client ID가 일치하지 않습니다.");
    }

    const form = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: issuedClientId,
      code: input.code,
      code_verifier: pending.codeVerifier,
      redirect_uri: pending.redirectUri,
      resource,
    });
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
    });
    const requestId = response.headers.get("openai-request-id") || response.headers.get("x-request-id") || undefined;
    if (!response.ok) throw new OpenAiUpstreamError(response.status, "OpenAI 토큰 교환에 실패했습니다.", requestId);
    const tokens = await response.json() as TokenResponse;
    if (typeof tokens.id_token !== "string" || typeof tokens.access_token !== "string") {
      throw new OpenAiAuthError("INVALID_TOKEN_RESPONSE", "OpenAI 토큰 응답이 올바르지 않습니다.", 502);
    }

    const { payload } = await jwtVerify(tokens.id_token, jwks, {
      issuer,
      audience: issuedClientId,
      requiredClaims: ["sub", "exp", "iat"],
      clockTolerance: 5,
    });
    if (payload.nonce !== pending.nonce || typeof payload.sub !== "string" || !payload.sub) {
      throw new OpenAiAuthError("INVALID_ID_TOKEN", "OpenAI ID 토큰을 검증하지 못했습니다.", 401);
    }
    if (pending.expectedSubject && payload.sub !== pending.expectedSubject) {
      throw new OpenAiAuthError("ACCOUNT_MISMATCH", "선택한 ChatGPT 계정과 인증 결과가 다릅니다.", 401);
    }

    const scopes = typeof tokens.scope === "string" ? tokens.scope.split(/\s+/).filter(Boolean) : [];
    if (!scopes.includes(requiredScope)) {
      throw new OpenAiAuthError("MISSING_DIRECT_SCOPE", "ChatGPT 요금제로 Responses API를 사용할 권한이 승인되지 않았습니다.", 403);
    }
    const expiresIn = typeof tokens.expires_in === "number" && Number.isFinite(tokens.expires_in) ? tokens.expires_in : 3600;
    const account: StoredAccount = {
      clientId: issuedClientId,
      subject: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: typeof tokens.refresh_token === "string" ? tokens.refresh_token : undefined,
      scopes,
      expiresAt: new Date(Date.now() + expiresIn * 1_000).toISOString(),
    };
    store.accounts[issuedClientId] = account;
    store.activeClientId = issuedClientId;
    await writeStore(store);
    return { email: account.email, name: account.name };
  });
}

export async function getOpenAiAuthStatus(): Promise<OpenAiAuthStatus> {
  return withStore(async (store) => {
    const account = activeAccount(store);
    if (!account?.accessToken) return { connected: false, canUseResponses: false, account: account ? { email: account.email, name: account.name } : undefined };
    return {
      connected: true,
      canUseResponses: account.scopes.includes(requiredScope),
      account: { email: account.email, name: account.name, expiresAt: account.expiresAt },
    };
  });
}

export async function getOpenAiAccessToken() {
  return withStore(async (store) => {
    const account = activeAccount(store);
    if (!account?.accessToken || !account.scopes.includes(requiredScope)) {
      throw new OpenAiAuthError("NOT_CONNECTED", "ChatGPT 계정이 연결되지 않았습니다.", 401);
    }
    if (account.expiresAt && Date.parse(account.expiresAt) > Date.now() + 60_000) return account.accessToken;
    if (!account.refreshToken) throw new OpenAiAuthError("REAUTH_REQUIRED", "ChatGPT 계정을 다시 연결해 주세요.", 401);

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: account.clientId,
        refresh_token: account.refreshToken,
        resource,
      }),
      cache: "no-store",
    });
    const requestId = response.headers.get("openai-request-id") || response.headers.get("x-request-id") || undefined;
    if (!response.ok) throw new OpenAiUpstreamError(response.status, "OpenAI 액세스 토큰 갱신에 실패했습니다.", requestId);
    const tokens = await response.json() as TokenResponse;
    if (typeof tokens.access_token !== "string") throw new OpenAiAuthError("INVALID_REFRESH_RESPONSE", "OpenAI 토큰 갱신 응답이 올바르지 않습니다.", 502);
    const expiresIn = typeof tokens.expires_in === "number" && Number.isFinite(tokens.expires_in) ? tokens.expires_in : 3600;
    account.accessToken = tokens.access_token;
    if (typeof tokens.refresh_token === "string") account.refreshToken = tokens.refresh_token;
    if (typeof tokens.id_token === "string") account.idToken = tokens.id_token;
    if (typeof tokens.scope === "string") account.scopes = tokens.scope.split(/\s+/).filter(Boolean);
    account.expiresAt = new Date(Date.now() + expiresIn * 1_000).toISOString();
    await writeStore(store);
    return account.accessToken;
  });
}

export async function disconnectOpenAi() {
  return withStore(async (store) => {
    const account = activeAccount(store);
    if (!account) return { revoked: true };
    let revoked = false;
    if (account.refreshToken) {
      try {
        const discovery = await getDiscovery();
        const response = await fetch(discovery.revocation_endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: account.refreshToken, token_type_hint: "refresh_token", client_id: account.clientId }),
          cache: "no-store",
        });
        revoked = response.ok;
      } catch { revoked = false; }
    } else {
      revoked = true;
    }
    delete account.idToken;
    delete account.accessToken;
    delete account.refreshToken;
    delete account.expiresAt;
    account.scopes = [];
    await writeStore(store);
    return { revoked };
  });
}
