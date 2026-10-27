import { eq } from "drizzle-orm";

import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import type { Role, SessionUser, UserAccount } from "@/lib/types";

type BetterAuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function getRequestSession(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export function serializeSession(session: BetterAuthSession): SessionUser {
  const user = session.user as BetterAuthSession["user"] & {
    role?: Role | null;
    department?: string | null;
    username?: string | null;
    emailVerified?: boolean | null;
    lastLoginAt?: Date | null;
  };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    username: user.username ?? user.email.split("@")[0],
    role: ((user.role as Role | null) ?? "staff") as Role,
    department: user.department ?? "Umum",
    lastLoginAt: (user.lastLoginAt ?? user.createdAt).toISOString(),
  };
}

export function mapUserRowToUserAccount(row: typeof user.$inferSelect): UserAccount {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username ?? row.email.split("@")[0],
    role: ((row.role as Role | null) ?? "staff") as Role,
    department: row.department ?? "Umum",
    status: row.banned ? "inactive" : "active",
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: (row.lastLoginAt ?? row.createdAt).toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getUserAccountById(id: string) {
  const row = await db.query.user.findFirst({
    where: eq(user.id, id),
  });

  return row ? mapUserRowToUserAccount(row) : null;
}

export async function requireRouteSession(request: Request) {
  const session = await getRequestSession(request);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRouteRole(request: Request, roles: Role[]) {
  const session = await requireRouteSession(request);
  const role = (((session.user as BetterAuthSession["user"] & { role?: Role | null }).role as Role | null) ?? "staff") as Role;
  if (!roles.includes(role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
