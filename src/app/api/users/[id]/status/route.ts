import { eq } from "drizzle-orm";

import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import { recordAuditLog } from "@/lib/server/audit-log";
import { fail, ok } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { getUserAccountById, requireRouteRole, serializeSession } from "@/lib/server/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "users:status",
      limit: 40,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan mengubah status pengguna. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["superadmin"]);
    const { id } = await params;
    const body = (await request.json()) as { status: "active" | "inactive" };

    await db
      .update(user)
      .set({
        banned: body.status === "inactive",
        banReason: body.status === "inactive" ? "Akun dinonaktifkan oleh Super Admin." : null,
      })
      .where(eq(user.id, id));

    const account = await getUserAccountById(id);

    await recordAuditLog({
      action: "user.status.update",
      entityType: "user",
      entityId: id,
      actor: serializeSession(session),
      targetId: id,
      targetLabel: account?.email ?? id,
      description: `${session.user.name} mengubah status akun ${account?.email ?? id} menjadi ${body.status}.`,
      request,
    });

    return ok({ data: account });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    return fail(error instanceof Error ? error.message : "Gagal memperbarui status akun.", 400);
  }
}
