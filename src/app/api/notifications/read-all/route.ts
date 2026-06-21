import { eq } from "drizzle-orm";

import { notifications } from "@/db/app-schema";
import { db } from "@/db/client";
import { recordAuditLog } from "@/lib/server/audit-log";
import { fail, ok } from "@/lib/server/http";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteSession, serializeSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const session = await requireRouteSession(request);
    await db
      .update(notifications)
      .set({
        read: true,
      })
      .where(eq(notifications.userId, session.user.id));

    await recordAuditLog({
      action: "notification.read_all",
      entityType: "notification",
      actor: serializeSession(session),
      targetId: session.user.id,
      targetLabel: session.user.email,
      description: `${session.user.name} menandai semua notifikasi sebagai telah dibaca.`,
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
