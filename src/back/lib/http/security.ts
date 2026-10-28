export function expectedOrigin(request: Request) {
  const configured = process.env.JLPT_APP_ORIGIN?.replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

export function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === expectedOrigin(request));
}
