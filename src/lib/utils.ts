import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateTimeForExport(date?: string) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(date));
}

export function toLocalDateTimeInputValue(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function localDateTimeInputToIso(value: string) {
  if (!value) return value;
  if (value.endsWith("Z")) return value;

  return new Date(value).toISOString();
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isNativeLikeWebView() {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const hasCapacitorBridge = Boolean((window as typeof window & { Capacitor?: unknown }).Capacitor);

  return hasCapacitorBridge || userAgent.includes("android") || userAgent.includes("iphone") || userAgent.includes("ipad");
}

export async function downloadTextFile({
  content,
  filename,
  type = "text/plain;charset=utf-8",
}: {
  content: string;
  filename: string;
  type?: string;
}) {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type });
  const file = new File([blob], filename, { type });

  if (isNativeLikeWebView() && "share" in navigator) {
    try {
      const sharePayload = { files: [file], title: filename };
      if (!("canShare" in navigator) || navigator.canShare?.(sharePayload)) {
        await navigator.share(sharePayload);
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
