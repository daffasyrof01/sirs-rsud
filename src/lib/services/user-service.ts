"use client";

import type { AccountStatus, Role, UserAccount } from "@/lib/types";

async function parse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as { data?: T; message?: string; imported?: number } | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? "Permintaan gagal.");
  }
  if (!payload) {
    throw new Error("Respons server tidak valid.");
  }
  return payload;
}

export async function listUsers() {
  const response = await fetch("/api/users", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const payload = await parse<UserAccount[]>(response);
  return payload.data ?? [];
}

export async function getUserById(id: string) {
  const response = await fetch(`/api/users/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const payload = await parse<UserAccount>(response);
  return payload.data ?? null;
}

export async function createUser(values: {
  name: string;
  email: string;
  role: Role;
  department: string;
  temporaryPassword: string;
}) {
  const response = await fetch("/api/users", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });
  const payload = await parse<UserAccount>(response);
  return payload.data!;
}

export async function updateUser(id: string, values: {
  name: string;
  role: Role;
  department: string;
  temporaryPassword?: string;
}) {
  const response = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });
  const payload = await parse<UserAccount>(response);
  return payload.data!;
}

export async function setUserStatus(id: string, status: AccountStatus) {
  const response = await fetch(`/api/users/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  const payload = await parse<UserAccount>(response);
  return payload.data!;
}

export async function deleteUser(id: string) {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parse(response);
}

export async function resetUserPassword(id: string) {
  const response = await fetch(`/api/users/${id}/password`, {
    method: "PATCH",
    credentials: "include",
  });
  const payload = await parse<{ temporaryPassword: string }>(response);
  return payload.data!.temporaryPassword;
}

export async function importUsers() {
  const response = await fetch("/api/users/import", {
    method: "POST",
    credentials: "include",
  });
  const payload = await parse<{ success: boolean }>(response);
  return payload.imported ?? 0;
}
