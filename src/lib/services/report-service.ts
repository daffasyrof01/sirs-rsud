"use client";

import { upload } from "@vercel/blob/client";

import { getCategoryLabel, getPriorityLabel, getStatusLabel } from "@/lib/constants/app";
import { getSession } from "@/lib/services/auth-service";
import { getDraftsStorage, setDraftsStorage } from "@/lib/storage";
import { downloadTextFile, formatDateTimeForExport, localDateTimeInputToIso } from "@/lib/utils";
import type {
  DraftReportForm,
  Report,
  ReportFilterState,
  ReportStatus,
  Role,
  SessionUser,
} from "@/lib/types";

async function parse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as { data?: T; message?: string } | T | null;
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "message" in payload ? payload.message : null;
    throw new Error(typeof message === "string" ? message : "Permintaan gagal.");
  }
  if (!payload) {
    throw new Error("Respons server tidak valid.");
  }
  if (typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [header, body] = dataUrl.split(",", 2);
  if (!header || !body) {
    throw new Error(`Lampiran ${filename} tidak valid.`);
  }

  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = window.atob(body);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: mime });
}

function sanitizePathSegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadReportAttachment(userId: string, attachment: DraftReportForm["attachments"][number]) {
  if (!attachment.previewUrl.startsWith("data:")) {
    return attachment;
  }

  const file = attachment.previewUrl.startsWith("data:")
    ? dataUrlToFile(attachment.previewUrl, attachment.name)
    : new File([], attachment.name, { type: "application/octet-stream" });

  if (file.size === 0) {
    throw new Error(`Lampiran ${attachment.name} tidak valid untuk diunggah.`);
  }

  const extension = attachment.name.includes(".") ? attachment.name.split(".").pop()?.toLowerCase() ?? "bin" : "bin";
  const baseName = sanitizePathSegment(attachment.name.replace(/\.[^.]+$/, "")) || "lampiran";
  const pathname = `reports/${userId}/${crypto.randomUUID()}-${baseName}.${extension}`;

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
    multipart: true,
  });

  return {
    id: attachment.id,
    name: attachment.name,
    sizeLabel: attachment.sizeLabel,
    previewUrl: blob.url,
  };
}

function shouldFallbackToInlineAttachment(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    message.includes("blob") ||
    message.includes("upload") ||
    message.includes("token") ||
    message.includes("pathname") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("tidak valid")
  );
}

function filterReports(reports: Report[], filters?: Partial<ReportFilterState>) {
  if (!filters) return reports;

  const fromTime = getDateFilterTime(filters.dateFrom, "start");
  const toTime = getDateFilterTime(filters.dateTo, "end");

  return reports.filter((report) => {
    const search = filters.search?.trim().toLowerCase();
    const createdAtTime = new Date(report.createdAt).getTime();
    const matchesSearch =
      !search ||
      report.reportNumber.toLowerCase().includes(search) ||
      report.title.toLowerCase().includes(search) ||
      report.reporterName.toLowerCase().includes(search);
    const matchesStatus = !filters.status || filters.status === "all" || report.status === filters.status;
    const matchesPriority = !filters.priority || filters.priority === "all" || report.priority === filters.priority;
    const matchesCategory = !filters.category || filters.category === "all" || report.category === filters.category;
    const matchesLocation =
      !filters.location || report.locationLabel.toLowerCase().includes(filters.location.trim().toLowerCase());
    const matchesDateFrom = !fromTime || createdAtTime >= fromTime;
    const matchesDateTo = !toTime || createdAtTime < toTime;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesLocation && matchesDateFrom && matchesDateTo;
  });
}

function getDateFilterTime(value: string | undefined, boundary: "start" | "end") {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  if (boundary === "end") {
    date.setDate(date.getDate() + 1);
  }

  return date.getTime();
}

export async function listReports({
  filters,
}: {
  filters?: Partial<ReportFilterState>;
} = {}) {
  const response = await fetch("/api/reports", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const reports = await parse<Report[]>(response);
  return filterReports(reports, filters);
}

export async function getReportById(id: string) {
  const response = await fetch(`/api/reports/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  return parse<Report>(response);
}

export function saveDraft(userId: string, values: DraftReportForm) {
  const drafts = getDraftsStorage();
  drafts[userId] = values;
  setDraftsStorage(drafts);
  return values;
}

export function getDraft(userId: string) {
  const drafts = getDraftsStorage();
  return drafts[userId] ?? null;
}

export function clearDraft(userId: string) {
  const drafts = getDraftsStorage();
  delete drafts[userId];
  setDraftsStorage(drafts);
}

export async function createReport({
  session,
  values,
}: {
  session?: SessionUser;
  values: DraftReportForm;
}) {
  const currentSession = session ?? (await getSession());
  if (!currentSession) {
    throw new Error("Sesi pengguna tidak ditemukan. Silakan login ulang.");
  }

  const uploadedAttachments = await Promise.all(
    values.attachments.map(async (attachment) => {
      try {
        return await uploadReportAttachment(currentSession.id, attachment);
      } catch (error) {
        if (attachment.previewUrl.startsWith("data:") && shouldFallbackToInlineAttachment(error)) {
          return attachment;
        }

        throw error;
      }
    }),
  );

  const response = await fetch("/api/reports", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: values.title,
      category: values.category,
      location: values.location,
      priority: values.priority,
      description: values.description,
      occurredAt: localDateTimeInputToIso(values.occurredAt),
      attachments: uploadedAttachments,
    }),
  });
  const payload = await parse<{ id: string }>(response);
  return getReportById(payload.id);
}

export async function updateReportStatus({
  reportId,
  status,
  note,
}: {
  reportId: string;
  status: ReportStatus;
  note: string;
}) {
  const response = await fetch(`/api/reports/${reportId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status,
      note,
    }),
  });
  await parse<{ success: boolean }>(response);
  return getReportById(reportId);
}

export async function assignReport({
  reportId,
  assigneeName,
  note,
}: {
  reportId: string;
  assigneeName: string;
  note: string;
}) {
  const response = await fetch(`/api/reports/${reportId}/assign`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assigneeName,
      note,
    }),
  });
  await parse<{ success: boolean }>(response);
  return getReportById(reportId);
}

export async function updateReportSparePart({
  reportId,
  sparePart,
}: {
  reportId: string;
  sparePart: string;
}) {
  const response = await fetch(`/api/reports/${reportId}/spare-part`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sparePart,
    }),
  });
  await parse<{ success: boolean }>(response);
  return getReportById(reportId);
}

export async function addReportComment({
  reportId,
  message,
}: {
  reportId: string;
  message: string;
}) {
  const response = await fetch(`/api/reports/${reportId}/comments`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  await parse<{ success: boolean }>(response);
  return getReportById(reportId);
}

export async function deleteReport(reportId: string) {
  const response = await fetch(`/api/reports/${reportId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parse<{ success: boolean }>(response);
}

export async function exportReports({
  reports,
  format,
}: {
  reports: Report[];
  format: "pdf" | "excel" | "csv";
}) {
  if (format === "pdf") {
    await downloadTextFile({
      filename: "laporan-sipedras.pdf",
      content: toPdfDocument(reports),
      type: "application/pdf",
    });
    return;
  }

  const header = [
    "No Laporan",
    "Judul",
    "Pelapor",
    "Departemen",
    "Lokasi",
    "Kategori",
    "Prioritas",
    "Status",
    "Tgl dan Jam Kejadian",
    "Tgl dan Jam Kirim Laporan",
    "Tgl dan Jam Penugasan",
    "Tgl dan Jam Penyelesaian",
    "Spare Part",
  ];
  const rows = reports.map((report) =>
    [
      report.reportNumber,
      report.title,
      report.reporterName,
      report.reporterDepartment,
      report.locationLabel,
      getCategoryLabel(report.category),
      getPriorityLabel(report.priority),
      getStatusLabel(report.status),
      formatDateTimeForExport(report.occurredAt),
      formatDateTimeForExport(report.createdAt),
      formatDateTimeForExport(getAssignmentTimestamp(report)),
      formatDateTimeForExport(getStatusTimestamp(report, "resolved")),
      report.sparePart || "-",
    ],
  );

  if (format === "excel") {
    await downloadTextFile({
      filename: "laporan-sipedras.xls",
      content: toExcelXml([header, ...rows]),
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    return;
  }

  await downloadTextFile({
    filename: "laporan-sipedras.csv",
    content: ["\uFEFF" + header.map(escapeCsvValue).join(","), ...rows.map((row) => row.map(escapeCsvValue).join(","))].join("\n"),
    type: "text/csv;charset=utf-8",
  });
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function getStatusTimestamp(report: Report, status: ReportStatus) {
  return report.statusLog.find((item) => item.status === status)?.createdAt;
}

function getAssignmentTimestamp(report: Report) {
  return report.assignedTo?.assignedAt ?? report.comments.find((item) => item.message.toLowerCase().includes("ditugaskan"))?.createdAt;
}

function escapeXmlValue(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toExcelXml(rows: unknown[][]) {
  const tableRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${escapeXmlValue(cell)}</Data></Cell>`)
          .join("")}</Row>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Laporan SIPEDRAS">
    <Table>${tableRows}</Table>
  </Worksheet>
</Workbook>`;
}

function normalizePdfText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfLine(value: string, maxLength = 96) {
  const words = normalizePdfText(value).split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
      return;
    }
    current = next;
  });

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function splitIntoPages(lines: string[], linesPerPage = 46) {
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  return pages.length > 0 ? pages : [["Tidak ada data laporan."]];
}

function getByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function toPdfDocument(reports: Report[]) {
  const rows = reports.flatMap((report, index) => [
    `${index + 1}. ${report.reportNumber} - ${report.title}`,
    `   Pelapor: ${report.reporterName} | Departemen: ${report.reporterDepartment}`,
    `   Lokasi: ${report.locationLabel} | Kategori: ${getCategoryLabel(report.category)} | Prioritas: ${getPriorityLabel(report.priority)} | Status: ${getStatusLabel(report.status)}`,
    `   Kejadian: ${formatDateTimeForExport(report.occurredAt)} | Kirim: ${formatDateTimeForExport(report.createdAt)} | Penugasan: ${formatDateTimeForExport(getAssignmentTimestamp(report))} | Selesai: ${formatDateTimeForExport(getStatusTimestamp(report, "resolved"))} | Spare Part: ${report.sparePart || "-"}`,
    "",
  ]);
  const lines = [
    "Laporan SIPEDRAS",
    `Tanggal ekspor: ${formatDateTimeForExport(new Date().toISOString())}`,
    `Total laporan: ${reports.length}`,
    "",
    ...rows.flatMap((row) => wrapPdfLine(row)),
  ];
  const pages = splitIntoPages(lines);
  const objects: string[] = [];
  const fontObjectNumber = 3;
  const pageObjectNumbers: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, index) => {
    const contentObjectNumber = 4 + index * 2;
    const pageObjectNumber = contentObjectNumber + 1;
    const stream = `BT /F1 10 Tf 40 800 Td 12 TL ${pageLines.map((line) => `(${normalizePdfText(line)}) Tj T*`).join(" ")} ET`;

    pageObjectNumbers.push(pageObjectNumber);
    objects.push(`<< /Length ${getByteLength(stream)} >>\nstream\n${stream}\nendstream`);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((objectNumber) => `${objectNumber} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(getByteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = getByteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export function getAverageHandlingTime(reports: Report[]) {
  const resolved = reports.filter((report) => report.status === "resolved");
  if (resolved.length === 0) return "0 jam";

  const averageMs =
    resolved.reduce((total, report) => total + (+new Date(report.updatedAt) - +new Date(report.createdAt)), 0) /
    resolved.length;
  const hours = Math.max(1, Math.round(averageMs / (1000 * 60 * 60)));
  return `${hours} jam`;
}

export function getReportSummary(reports: Report[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const total = reports.length;
  const pending = reports.filter((report) => report.status === "pending").length;
  const inProgress = reports.filter((report) => report.status === "in_progress").length;
  const resolved = reports.filter((report) => report.status === "resolved").length;
  const rejected = reports.filter((report) => report.status === "rejected").length;
  const urgent = reports.filter((report) => report.priority === "high" || report.priority === "emergency").length;
  const resolvedThisMonth = reports.filter((report) => {
    if (report.status !== "resolved") return false;
    const updatedAt = new Date(report.updatedAt);
    return updatedAt.getMonth() === currentMonth && updatedAt.getFullYear() === currentYear;
  }).length;

  return {
    total,
    pending,
    inProgress,
    resolved,
    rejected,
    urgent,
    resolvedThisMonth,
  };
}

export function getReportTrend(reports: Report[]) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const grouped = new Map<string, { monthIndex: number; total: number; year: number }>();

  reports.forEach((report) => {
    const createdAt = new Date(report.createdAt);
    const year = createdAt.getFullYear();
    const monthIndex = createdAt.getMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const current = grouped.get(key);

    grouped.set(key, {
      year,
      monthIndex,
      total: (current?.total ?? 0) + 1,
    });
  });

  const years = new Set(Array.from(grouped.values()).map((item) => item.year));

  return Array.from(grouped.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([, item]) => ({
      month: years.size > 1 ? `${monthNames[item.monthIndex]} ${item.year}` : monthNames[item.monthIndex],
      total: item.total,
    }));
}

export function filterReportsByDepartments(reports: Report[], departments?: string[]) {
  if (!departments) return reports;
  if (departments.length === 0) return [];

  const allowedDepartments = new Set(
    departments.map((department) => department.trim().toLowerCase()).filter(Boolean),
  );

  return reports.filter((report) => allowedDepartments.has(report.reporterDepartment.trim().toLowerCase()));
}

export function getCategoryBreakdown(reports: Report[]) {
  const map = new Map<string, number>();
  reports.forEach((report) => {
    map.set(report.category, (map.get(report.category) ?? 0) + 1);
  });

  return Array.from(map.entries()).map(([category, value]) => ({ name: getCategoryLabel(category as Report["category"]), category, value }));
}

export function getLocationBreakdown(reports: Report[]) {
  const map = new Map<string, number>();
  reports.forEach((report) => {
    map.set(report.locationLabel, (map.get(report.locationLabel) ?? 0) + 1);
  });

  return Array.from(map.entries()).map(([location, total]) => ({ location, total }));
}

export function getDepartmentBreakdown(reports: Report[]) {
  const map = new Map<string, number>();
  reports.forEach((report) => {
    map.set(report.reporterDepartment, (map.get(report.reporterDepartment) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([department, total]) => ({ department, total }));
}

export function getUnreadAlertsCount(role: Role, reports: Report[]) {
  if (role === "staff") {
    return reports.filter((report) => report.unreadUpdate).length;
  }
  return reports.filter((report) => report.priority === "high" || report.priority === "emergency").length;
}
