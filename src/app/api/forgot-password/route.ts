import { fail } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "auth:forgot-password",
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: "Terlalu banyak permintaan reset password. Coba lagi nanti.",
  });
  if (limited) return limited;

  try {
    requireTrustedOrigin(request);
  } catch {
    return fail("Forbidden", 403);
  }

  return fail("Reset password melalui email belum tersedia. Hubungi Super Admin rumah sakit untuk memulihkan akun.", 501);
}
