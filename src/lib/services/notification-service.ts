"use client";

import type { NotificationItem } from "@/lib/types";

export async function listNotifications() {
  const response = await fetch("/api/notifications", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal memuat notifikasi.");
  }

  const payload = (await response.json()) as { data: NotificationItem[] };
  return payload.data;
}

export async function markAllNotificationsRead() {
  const response = await fetch("/api/notifications/read-all", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Gagal memperbarui notifikasi.");
  }
}

export async function deleteNotification(id: string) {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Gagal menghapus notifikasi.");
  }
}

export async function deleteAllNotifications() {
  const response = await fetch("/api/notifications", {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Gagal menghapus semua notifikasi.");
  }
}
