"use client";

export async function listRegisteredDepartments() {
  const response = await fetch("/api/departments", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { data?: string[]; message?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? "Gagal memuat daftar departemen.");
  }

  return payload?.data ?? [];
}
