import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getHomePath } from "@/lib/constants/app";
import { serializeSession } from "@/lib/server/session";
import type { Role, SessionUser } from "@/lib/types";

export async function getServerSessionUser(): Promise<SessionUser | null> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  return session ? serializeSession(session) : null;
}

export async function requireServerSession(redirectTo = "/"): Promise<SessionUser> {
  const session = await getServerSessionUser();
  if (!session) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireServerRole(role: Role): Promise<SessionUser> {
  const session = await requireServerSession(`/login/${role}`);
  if (session.role !== role) {
    redirect(getHomePath(session.role));
  }

  return session;
}

export async function redirectAuthenticatedUser() {
  const session = await getServerSessionUser();
  if (session) {
    redirect(getHomePath(session.role));
  }
}
