import { eq } from "drizzle-orm";

import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import { recordAuditLog } from "@/lib/server/audit-log";
import { fail, ok } from "@/lib/server/http";
import { assertPasswordStrength } from "@/lib/server/password";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { getUserAccountById, requireRouteRole, serializeSession } from "@/lib/server/session";
import { slugify } from "@/lib/utils";
import type { Role } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRouteRole(request, ["superadmin"]);
    const { id } = await params;
    const account = await getUserAccountById(id);
    if (!account) return fail("Pengguna tidak ditemukan.", 404);
    return ok({ data: account });
  } catch (error) {
    return fail(error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized", error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "users:update",
      limit: 40,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan memperbarui pengguna. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["superadmin"]);
    const { id } = await params;
    const body = (await request.json()) as {
      name: string;
      role: Role;
      department: string;
      temporaryPassword?: string;
    };

    await db
      .update(user)
      .set({
        name: body.name,
        role: body.role,
        department: body.department,
        username: slugify(body.name),
        displayUsername: body.name,
      })
      .where(eq(user.id, id));

    if (body.temporaryPassword?.trim()) {
      await auth.api.setUserPassword({
        body: {
          userId: id,
          newPassword: assertPasswordStrength(body.temporaryPassword),
        },
      });
    }

    const account = await getUserAccountById(id);

    await recordAuditLog({
      action: "user.update",
      entityType: "user",
      entityId: id,
      actor: serializeSession(session),
      targetId: id,
      targetLabel: account?.email ?? body.name,
      description: `${session.user.name} memperbarui data akun ${account?.email ?? body.name}.`,
      request,
    });

    return ok({ data: account });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    return fail(error instanceof Error ? error.message : "Gagal memperbarui pengguna.", 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "users:delete",
      limit: 20,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan menghapus pengguna. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["superadmin"]);
    const { id } = await params;
    const account = await getUserAccountById(id);
    await db.delete(user).where(eq(user.id, id));

    await recordAuditLog({
      action: "user.delete",
      entityType: "user",
      entityId: id,
      actor: serializeSession(session),
      targetId: id,
      targetLabel: account?.email ?? id,
      description: `${session.user.name} menghapus akun ${account?.email ?? id}.`,
      request,
    });

    return ok({ success: true });
  } catch (error) {
    return fail(error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized", error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401);
  }
}
