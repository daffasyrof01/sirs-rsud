import { authHandler } from "@/lib/auth";
import { fail } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";

export const { GET } = authHandler;

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
  const isSignIn = pathname.endsWith("/sign-in/email") || pathname.endsWith("/sign-in/username");

  if (isSignIn) {
    const limited = rateLimit(request, {
      key: "auth:sign-in",
      limit: 8,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.",
    });
    if (limited) return limited;
  }

  try {
    requireTrustedOrigin(request);
  } catch {
    return fail("Forbidden", 403);
  }

  return authHandler.POST(request);
}
