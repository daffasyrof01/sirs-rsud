import { desc, eq } from "drizzle-orm";

import { auditLogs } from "@/db/app-schema";
import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import type { AuditActorRole, AuditEntityType, AuditLogItem, Role, SessionUser } from "@/lib/types";

type AuditActor =
  | Pick<SessionUser, "id" | "name" | "role">
  | {
      id?: string | null;
      name?: string | null;
      role?: AuditActorRole | Role | null;
    }
  | null;

type AuditLogInput = {
  action: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  actor?: AuditActor;
  targetId?: string | null;
  targetLabel?: string | null;
  description: string;
  request?: Request;
};

function extractRequestMetadata(request?: Request) {
  if (!request) {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;
  const userAgent = request.headers.get("user-agent");

  return {
    ipAddress,
    userAgent,
  };
}

function mapAuditLogRow(row: typeof auditLogs.$inferSelect): AuditLogItem {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType as AuditEntityType,
    entityId: row.entityId ?? undefined,
    actorId: row.actorId ?? undefined,
    actorName: row.actorName ?? "Sistem",
    actorRole: (row.actorRole as AuditActorRole | null) ?? undefined,
    targetId: row.targetId ?? undefined,
    targetLabel: row.targetLabel ?? undefined,
    description: row.description,
    ipAddress: row.ipAddress ?? undefined,
    userAgent: row.userAgent ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function recordAuditLog({
  action,
  entityType,
  entityId,
  actor,
  targetId,
  targetLabel,
  description,
  request,
}: AuditLogInput) {
  const { ipAddress, userAgent } = extractRequestMetadata(request);

  try {
    await db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      action,
      entityType,
      entityId: entityId ?? null,
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      actorRole: (actor?.role as string | null) ?? null,
      targetId: targetId ?? null,
      targetLabel: targetLabel ?? null,
      description,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Gagal menulis audit log:", error);
  }
}

export async function recordLoginSuccessAudit(userId: string) {
  const account = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  await recordAuditLog({
    action: "auth.login.success",
    entityType: "auth",
    entityId: userId,
    actor: {
      id: account?.id ?? userId,
      name: account?.name ?? "Pengguna",
      role: ((account?.role as Role | null) ?? "staff") as Role,
    },
    targetId: account?.id ?? userId,
    targetLabel: account?.email ?? userId,
    description: `Login berhasil untuk akun ${account?.email ?? userId}.`,
  });
}

export async function listRecentAuditLogs(limit = 10) {
  const rows = await db.query.auditLogs.findMany({
    orderBy: desc(auditLogs.createdAt),
    limit,
  });

  return rows.map(mapAuditLogRow);
}
