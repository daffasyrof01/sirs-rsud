import type { DraftReportForm } from "@/lib/types";

const DRAFTS_KEY = "sirs.report-drafts";

function isClient() {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isClient()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getDraftsStorage() {
  return readJSON<Record<string, DraftReportForm>>(DRAFTS_KEY, {});
}

export function setDraftsStorage(value: Record<string, DraftReportForm>) {
  writeJSON(DRAFTS_KEY, value);
}
