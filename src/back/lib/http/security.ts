export function expectedOrigin(request: Request) {
  const configured = process.env.JLPT_APP_ORIGIN?.replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

export function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const expected = expectedOrigin(request);
  if (origin === expected) return true;
  try {
    const actualUrl = new URL(origin);
    const expectedUrl = new URL(expected);
    const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
    return actualUrl.protocol === "http:"
      && expectedUrl.protocol === "http:"
      && loopbackHosts.has(actualUrl.hostname)
      && loopbackHosts.has(expectedUrl.hostname)
      && actualUrl.port === expectedUrl.port;
  } catch { return false; }
}
