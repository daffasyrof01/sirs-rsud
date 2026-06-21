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
      key: "email-verification:verify",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan verifikasi. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["admin", "superadmin"]);
    const body = (await request.json().catch(() => null)) as { otp?: string } | null;
    const otp = String(body?.otp ?? "").trim();

    if (!otp) {
      return fail("Kode OTP wajib diisi.");
    }

    const response = await fetch(new URL("/api/auth/email-otp/verify-email", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        email: session.user.email,
        otp,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      return fail(payload?.message ?? "Gagal memverifikasi email.", response.status);
    }

    await recordAuditLog({
      action: "auth.email_verification.success",
      entityType: "auth",
      entityId: session.user.id,
      actor: serializeSession(session),
      targetId: session.user.id,
      targetLabel: session.user.email,
      description: `${session.user.name} berhasil memverifikasi email.`,
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
    return fail(error instanceof Error ? error.message : "Gagal memverifikasi email.", 400);
  }
}
