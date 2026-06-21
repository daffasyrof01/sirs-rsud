"use client";

import { getHomePath } from "@/lib/constants/app";
import type { Role, SessionUser } from "@/lib/types";

const LEGACY_COOKIE_NAME = "sirs-role";

function clearLegacyRoleCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${LEGACY_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? "Terjadi kesalahan pada server.");
  }
  return payload;
}

export async function getSession() {
  const response = await fetch("/api/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const payload = (await response.json()) as { data: SessionUser | null };
  if (!payload.data) {
    clearLegacyRoleCookie();
  }
  return payload.data;
}

export async function login({
  identifier,
  password,
  role,
}: {
  identifier: string;
  password: string;
  role: Role;
}) {
  const cleaned = identifier.trim();
  const endpoint = cleaned.includes("@") ? "/api/auth/sign-in/email" : "/api/auth/sign-in/username";
  const body = cleaned.includes("@")
    ? { email: cleaned, password, rememberMe: true }
    : { username: cleaned, password, rememberMe: true };

  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await parseResponse(response);

  const session = await getSession();
  if (!session) {
    throw new Error("Gagal mengambil sesi pengguna setelah login.");
  }

  if (session.role !== role) {
    await logout();
    throw new Error("Akun ini tidak memiliki akses ke portal yang sedang Anda buka.");
  }

  return {
    session,
    redirectTo: getHomePath(role),
  };
}

export async function logout() {
  await fetch("/api/auth/sign-out", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  }).catch(() => null);

  clearLegacyRoleCookie();
}

export async function requestPasswordReset(identifier: string) {
  const response = await fetch("/api/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { message?: string; success?: boolean } | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? "Akun tidak ditemukan.");
  }

  return {
    success: Boolean(payload?.success),
    message: payload?.message ?? "Tautan reset berhasil dikirim.",
  };
}
