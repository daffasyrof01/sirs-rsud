import { eq } from "drizzle-orm";

import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import { recordAuditLog } from "@/lib/server/audit-log";
import { fail, ok } from "@/lib/server/http";
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

  const body = (await request.json()) as { identifier?: string };
  const identifier = body.identifier?.trim().toLowerCase();

  if (!identifier) {
    return fail("Email atau username wajib diisi.");
  }

  const account =
    (await db.query.user.findFirst({
      where: eq(user.email, identifier),
    })) ??
    (await db.query.user.findFirst({
      where: eq(user.username, identifier),
    }));

  if (account) {
    await recordAuditLog({
      action: "auth.password_reset.request",
      entityType: "auth",
      targetId: account.id,
      targetLabel: account.email,
      description: `Permintaan reset password diajukan untuk akun ${account.email}.`,
      request,
    });
  }

  return ok({
    success: true,
    message: "Jika akun terdaftar, permintaan reset password telah diproses.",
  });
}
