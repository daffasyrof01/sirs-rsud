import { desc, eq } from "drizzle-orm";

import { notifications } from "@/db/app-schema";
import { db } from "@/db/client";
import { recordAuditLog } from "@/lib/server/audit-log";
import { fail, ok } from "@/lib/server/http";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteSession, serializeSession } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    const session = await requireRouteSession(request);
    const items = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id),
      orderBy: desc(notifications.createdAt),
    });

    return ok({
      data: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        title: item.title,
        message: item.message,
        type: item.type,
        createdAt: item.createdAt.toISOString(),
        read: item.read,
      })),
    });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(request: Request) {
  try {
    requireTrustedOrigin(request);
    const session = await requireRouteSession(request);
    await db.delete(notifications).where(eq(notifications.userId, session.user.id));

    await recordAuditLog({
      action: "notification.delete_all",
      entityType: "notification",
      actor: serializeSession(session),
      targetId: session.user.id,
      targetLabel: session.user.email,
      description: `${session.user.name} menghapus semua notifikasi akun.`,
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
