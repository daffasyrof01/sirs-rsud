import { asc } from "drizzle-orm";

import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import { recordAuditLog } from "@/lib/server/audit-log";
import { fail, ok } from "@/lib/server/http";
import { assertPasswordStrength } from "@/lib/server/password";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { getUserAccountById, mapUserRowToUserAccount, requireRouteRole, serializeSession } from "@/lib/server/session";
import { slugify } from "@/lib/utils";
import type { Role } from "@/lib/types";

export async function GET(request: Request) {
  try {
    await requireRouteRole(request, ["superadmin"]);
    const users = await db.query.user.findMany({
      orderBy: asc(user.name),
    });

    return ok({
      data: users.map(mapUserRowToUserAccount),
    });
  } catch (error) {
    return fail(error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized", error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401);
  }
}

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "users:create",
      limit: 20,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan membuat pengguna. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["superadmin"]);
    const body = (await request.json()) as {
      name: string;
      email: string;
      role: Role;
      department: string;
      temporaryPassword: string;
    };

    const response = await auth.api.createUser({
      body: {
        email: body.email,
        password: assertPasswordStrength(body.temporaryPassword ?? ""),
        name: body.name,
        role: body.role,
        data: {
          department: body.department,
          username: slugify(body.name),
          displayUsername: body.name,
          lastLoginAt: new Date(),
        },
      },
    });

    const created = await getUserAccountById(response.user.id);

    await recordAuditLog({
      action: "user.create",
      entityType: "user",
      entityId: response.user.id,
      actor: serializeSession(session),
      targetId: response.user.id,
      targetLabel: body.email,
      description: `${session.user.name} membuat akun ${body.role} untuk ${body.email}.`,
      request,
    });

    return ok({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    return fail(error instanceof Error ? error.message : "Gagal membuat pengguna.", 400);
  }
}
