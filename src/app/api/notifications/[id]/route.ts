import { and, eq } from "drizzle-orm";

import { notifications } from "@/db/app-schema";
import { db } from "@/db/client";
import { recordAuditLog } from "@/lib/server/audit-log";
import { fail, ok } from "@/lib/server/http";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteSession, serializeSession } from "@/lib/server/session";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const session = await requireRouteSession(request);
    const { id } = await params;
    const deleted = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))
      .returning({ id: notifications.id });

    if (deleted.length === 0) {
      return fail("Notifikasi tidak ditemukan.", 404);
    }

    await recordAuditLog({
      action: "notification.delete",
      entityType: "notification",
      entityId: id,
      actor: serializeSession(session),
      targetId: id,
      targetLabel: session.user.email,
      description: `${session.user.name} menghapus satu notifikasi.`,
      request,
    });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    return fail("Unauthorized", 401);
  }
}
