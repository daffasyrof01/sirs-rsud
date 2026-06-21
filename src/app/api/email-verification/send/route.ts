import { auth } from "@/lib/auth";
import { EMAIL_OTP_ENABLED } from "@/lib/constants/features";
import { fail, ok } from "@/lib/server/http";
import { recordAuditLog } from "@/lib/server/audit-log";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteRole, serializeSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    if (!EMAIL_OTP_ENABLED) {
      return fail("Fitur OTP email sedang dinonaktifkan.", 503);
    }

    requireTrustedOrigin(request);

    const limited = rateLimit(request, {
      key: "email-verification:send",
      limit: 6,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak permintaan kode verifikasi. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["admin", "superadmin"]);

    if (session.user.emailVerified) {
      return ok({ success: true, alreadyVerified: true });
    }

    await auth.api.sendVerificationOTP({
      body: {
        email: session.user.email,
        type: "email-verification",
      },
    });

    await recordAuditLog({
      action: "auth.email_verification.send",
      entityType: "auth",
      entityId: session.user.id,
      actor: serializeSession(session),
      targetId: session.user.id,
      targetLabel: session.user.email,
      description: `${session.user.name} meminta kode verifikasi email.`,
      request,
    });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }
    return fail(error instanceof Error ? error.message : "Gagal mengirim kode verifikasi.", 400);
  }
}
