const ALLOWED_ORIGINS = new Set(
  [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().replace(/\/+$/, "")),
);

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function requireTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const requestOrigin = normalizeOrigin(new URL(request.url).origin);

  const candidateOrigin = origin
    ? normalizeOrigin(origin)
    : referer
      ? normalizeOrigin(new URL(referer).origin)
      : null;

  if (!candidateOrigin) {
    throw new Error("FORBIDDEN");
  }

  if (candidateOrigin === requestOrigin || ALLOWED_ORIGINS.has(candidateOrigin)) {
    return;
  }

  throw new Error("FORBIDDEN");
}
