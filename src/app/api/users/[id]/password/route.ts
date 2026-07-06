import { fail, ok } from "@/lib/server/http";
import { getUserAccountById, requireRouteRole, serializeSession } from "@/lib/server/session";
import { auth } from "@/lib/auth";
import { recordAuditLog } from "@/lib/server/audit-log";
import { generateTemporaryPassword } from "@/lib/server/password";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "users:password-reset",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak reset password. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["superadmin"]);
    const { id } = await params;
    const temporaryPassword = generateTemporaryPassword();

    await auth.api.setUserPassword({
      body: {
        userId: id,
        newPassword: temporaryPassword,
      },
      headers: request.headers,
    });

    const account = await getUserAccountById(id);

    await recordAuditLog({
      action: "user.password.reset",
      entityType: "user",
      entityId: id,
      actor: serializeSession(session),
      targetId: id,
      targetLabel: account?.email ?? id,
      description: `${session.user.name} mereset password akun ${account?.email ?? id}.`,
      request,
    });

    return ok({ data: { temporaryPassword } });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    return fail(error instanceof Error ? error.message : "Gagal mereset password.", 400);
  }
}
