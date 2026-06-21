import { Activity, ShieldCheck, Stethoscope } from "lucide-react";

import type {
  ReportCategory,
  ReportPriority,
  ReportStatus,
  Role,
} from "@/lib/types";

export const APP_NAME = "SIPEDRAS";
export const APP_TAGLINE = "Sistem Pelaporan Digital Respon Aset dan Sarana";

export const ROLE_CONFIG = {
  staff: {
    label: "Staff Rumah Sakit",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    icon: Stethoscope,
    home: "/staff/dashboard",
  },
  admin: {
    label: "Admin",
    accent: "from-sky-500 via-blue-500 to-indigo-500",
    icon: Activity,
    home: "/admin/dashboard",
  },
  superadmin: {
    label: "Super Admin",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    icon: ShieldCheck,
    home: "/superadmin/dashboard",
  },
} satisfies Record<
  Role,
  {
    label: string;
    accent: string;
    icon: typeof Activity;
    home: string;
  }
>;

export const REPORT_STATUS_OPTIONS: Array<{
  value: ReportStatus;
  label: string;
}> = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "Diproses" },
  { value: "resolved", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
];

export const REPORT_PRIORITY_OPTIONS: Array<{
  value: ReportPriority;
  label: string;
}> = [
  { value: "low", label: "Rendah" },
  { value: "medium", label: "Sedang" },
  { value: "high", label: "Tinggi" },
  { value: "emergency", label: "Darurat" },
];

export const REPORT_CATEGORY_OPTIONS: Array<{
  value: ReportCategory;
  label: string;
}> = [
  { value: "listrik", label: "Listrik" },
  { value: "plumbing", label: "Plumbing" },
  { value: "struktural", label: "Struktural" },
  { value: "peralatan_medis", label: "Peralatan Medis" },
  { value: "hvac", label: "HVAC" },
  { value: "it_jaringan", label: "IT/Jaringan" },
  { value: "lainnya", label: "Lainnya" },
];

export const BUILDING_OPTIONS = [
  "Gedung A - Rawat Jalan",
  "Gedung B - Rawat Inap",
  "Gedung C - ICU & Operasi",
  "Gedung D - Radiologi",
  "Gedung E - Laboratorium",
  "Gedung F - Administrasi",
];

export function getHomePath(role: Role) {
  return ROLE_CONFIG[role].home;
}

export function getRoleLabel(role: Role) {
  return ROLE_CONFIG[role].label;
}

export function getStatusLabel(status: ReportStatus) {
  return (
    REPORT_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
  );
}

export function getPriorityLabel(priority: ReportPriority) {
  return (
    REPORT_PRIORITY_OPTIONS.find((item) => item.value === priority)?.label ??
    priority
  );
}

export function getCategoryLabel(category: ReportCategory) {
  return (
    REPORT_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ??
    category
  );
}
