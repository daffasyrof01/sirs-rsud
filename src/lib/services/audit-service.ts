"use client";

import type { AuditLogItem } from "@/lib/types";

async function parse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as { data?: T; message?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? "Permintaan gagal.");
  }
  if (!payload || !("data" in payload)) {
    throw new Error("Respons server tidak valid.");
  }
  return payload.data as T;
}

export async function listAuditLogs(limit = 8) {
  const response = await fetch(`/api/audit-logs?limit=${limit}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parse<AuditLogItem[]>(response);
}
