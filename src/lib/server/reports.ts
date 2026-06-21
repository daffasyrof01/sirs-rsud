import { desc, eq, inArray } from "drizzle-orm";

import {
  notifications,
  reportAttachments,
  reportComments,
  reportStatusLogs,
  reports,
} from "@/db/app-schema";
import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import { recordAuditLog } from "@/lib/server/audit-log";
import { sendPushNotificationToUser } from "@/lib/server/push-notifications";
import type { DraftReportForm, Report, ReportAttachment, Role, SessionUser } from "@/lib/types";

function toIso(date: Date) {
  return date.toISOString();
}

export async function listReportsForSession({
  session,
}: {
  session: SessionUser;
}) {
  const reportRows = await db.select().from(reports).orderBy(desc(reports.createdAt));
  const scopedRows =
    session.role === "staff" ? reportRows.filter((report) => report.reporterId === session.id) : reportRows;

  return composeReports(scopedRows);
}

export async function getReportForSession({
  reportId,
  session,
}: {
  reportId: string;
  session: SessionUser;
}) {
  const reportRow = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  if (!reportRow) return null;
  if (session.role === "staff" && reportRow.reporterId !== session.id) return null;

  const [report] = await composeReports([reportRow]);
  return report ?? null;
}

async function composeReports(reportRows: Array<typeof reports.$inferSelect>): Promise<Report[]> {
  if (reportRows.length === 0) return [];

  const reportIds = reportRows.map((report) => report.id);
  const [attachmentRows, commentRows, statusRows] = await Promise.all([
    db.select().from(reportAttachments).where(inArray(reportAttachments.reportId, reportIds)),
    db.select().from(reportComments).where(inArray(reportComments.reportId, reportIds)).orderBy(desc(reportComments.createdAt)),
    db.select().from(reportStatusLogs).where(inArray(reportStatusLogs.reportId, reportIds)).orderBy(desc(reportStatusLogs.createdAt)),
  ]);

  return reportRows.map((report) => ({
    id: report.id,
    reportNumber: report.reportNumber,
    title: report.title,
    category: report.category as Report["category"],
    building: report.building,
    roomDetail: report.roomDetail,
    locationLabel: report.locationLabel,
    priority: report.priority as Report["priority"],
    status: report.status as Report["status"],
    description: report.description,
    occurredAt: toIso(report.occurredAt),
    createdAt: toIso(report.createdAt),
    updatedAt: toIso(report.updatedAt),
    reporterId: report.reporterId,
    reporterName: report.reporterName,
    reporterDepartment: report.reporterDepartment,
    assignedTo: report.assignedToName
      ? {
          name: report.assignedToName,
          note: report.assignedToTeam ?? "",
          assignedAt: report.assignedAt ? toIso(report.assignedAt) : undefined,
        }
      : undefined,
    sparePart: report.sparePart ?? "",
    attachments: attachmentRows
      .filter((attachment) => attachment.reportId === report.id)
      .map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        sizeLabel: attachment.sizeLabel,
        previewUrl: attachment.previewUrl,
      })),
    comments: commentRows
      .filter((comment) => comment.reportId === report.id)
      .map((comment) => ({
        id: comment.id,
        authorName: comment.authorName,
        authorRole: comment.authorRole as Role,
        message: comment.message,
        createdAt: toIso(comment.createdAt),
      })),
    statusLog: statusRows
      .filter((status) => status.reportId === report.id)
      .map((status) => ({
        id: status.id,
        actorName: status.actorName,
        actorRole: status.actorRole as Role,
        status: status.status as Report["status"],
        note: status.note,
        createdAt: toIso(status.createdAt),
      })),
    unreadUpdate: report.unreadUpdate,
  }));
}

export async function createReportRecord({
  reportId,
  session,
  values,
  attachments,
  request,
}: {
  reportId?: string;
  session: SessionUser;
  values: Omit<DraftReportForm, "attachments">;
  attachments: ReportAttachment[];
  request?: Request;
}) {
  const existing = await db.select().from(reports);
  const reportNumber = `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(existing.length + 1).padStart(3, "0")}`;
  const nextReportId = reportId ?? `report-${crypto.randomUUID()}`;
  const now = new Date();
  const notificationTitle = `Laporan baru ${reportNumber}`;
  const notificationMessage = `${session.name} membuat laporan "${values.title}".`;
  const adminRecipients = (
    await db
      .select({
        id: user.id,
        banned: user.banned,
      })
      .from(user)
      .where(inArray(user.role, ["admin", "superadmin"]))
  ).filter((recipient) => !recipient.banned);

  await db.transaction(async (tx) => {
    await tx.insert(reports).values({
      id: nextReportId,
      reportNumber,
      title: values.title,
      category: values.category,
      building: values.location,
      roomDetail: "",
      locationLabel: values.location,
      priority: values.priority,
      status: "pending",
      description: values.description,
      occurredAt: new Date(values.occurredAt),
      createdAt: now,
      updatedAt: now,
      reporterId: session.id,
      reporterName: session.name,
      reporterDepartment: session.department,
      sparePart: "",
      unreadUpdate: false,
    });

    if (attachments.length > 0) {
      await tx.insert(reportAttachments).values(
        attachments.map((attachment) => ({
          id: attachment.id || `attachment-${crypto.randomUUID()}`,
          reportId: nextReportId,
          name: attachment.name,
          sizeLabel: attachment.sizeLabel,
          previewUrl: attachment.previewUrl,
          createdAt: now,
        })),
      );
    }

    if (adminRecipients.length > 0) {
      await tx.insert(notifications).values(
        adminRecipients.map((recipient) => ({
          id: `notif-${crypto.randomUUID()}`,
          userId: recipient.id,
          title: notificationTitle,
          message: notificationMessage,
          type: values.priority === "high" || values.priority === "emergency" ? "warning" : "info",
          read: false,
          createdAt: now,
        })),
      );
    }

    await tx.insert(reportStatusLogs).values({
      id: `status-${crypto.randomUUID()}`,
      reportId: nextReportId,
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      status: "pending",
      note: "Laporan dibuat oleh staff.",
      createdAt: now,
    });
  });

  await recordAuditLog({
    action: "report.create",
    entityType: "report",
    entityId: nextReportId,
    actor: session,
    targetId: nextReportId,
    targetLabel: reportNumber,
    description: `${session.name} membuat laporan ${reportNumber} dengan judul "${values.title}".`,
    request,
  });

  await Promise.allSettled(
    adminRecipients.map((recipient) =>
      sendPushNotificationToUser({
        userId: recipient.id,
        title: notificationTitle,
        body: notificationMessage,
        data: {
          reportId: nextReportId,
          reportNumber,
          type: "report.created",
        },
      }),
    ),
  );

  return {
    id: nextReportId,
    reportNumber,
  };
}

export async function updateReportStatusRecord({
  reportId,
  actor,
  status,
  note,
  request,
}: {
  reportId: string;
  actor: SessionUser;
  status: Report["status"];
  note: string;
  request?: Request;
}) {
  const now = new Date();
  const trimmedNote = note.trim();
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  if (!report) return null;

  const notificationTitle = `Status ${report.reportNumber} diperbarui`;
  const notificationMessage = `Laporan Anda sekarang berstatus ${status}.`;

  await db.transaction(async (tx) => {
    await tx
      .update(reports)
      .set({
        status,
        updatedAt: now,
        unreadUpdate: true,
      })
      .where(eq(reports.id, reportId));

    await tx.insert(reportStatusLogs).values({
      id: `status-${crypto.randomUUID()}`,
      reportId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      status,
      note,
      createdAt: now,
    });

    await tx.insert(notifications).values({
      id: `notif-${crypto.randomUUID()}`,
      userId: report.reporterId,
      title: notificationTitle,
      message: notificationMessage,
      type: status === "resolved" ? "success" : status === "rejected" ? "warning" : "info",
      read: false,
      createdAt: now,
    });
  });

  await recordAuditLog({
    action: "report.status.update",
    entityType: "report",
    entityId: reportId,
    actor,
    targetId: reportId,
    targetLabel: report.reportNumber,
    description: `${actor.name} mengubah status laporan ${report.reportNumber} menjadi ${status}.`,
    request,
  });

  await sendPushNotificationToUser({
    userId: report.reporterId,
    title: notificationTitle,
    body: notificationMessage,
    data: {
      reportId,
      reportNumber: report.reportNumber,
      status,
      type: "report.status.update",
    },
  });

  return reportId;
}

export async function assignReportRecord({
  reportId,
  actor,
  assigneeName,
  note,
  request,
}: {
  reportId: string;
  actor: SessionUser;
  assigneeName: string;
  note: string;
  request?: Request;
}) {
  const now = new Date();
  const trimmedNote = note.trim();
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  if (!report) return;

  await db.transaction(async (tx) => {
    await tx
      .update(reports)
      .set({
        assignedToName: assigneeName,
        assignedToTeam: trimmedNote,
        assignedAt: now,
        updatedAt: now,
      })
      .where(eq(reports.id, reportId));

    await tx.insert(reportComments).values({
      id: `comment-${crypto.randomUUID()}`,
      reportId,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      message: trimmedNote
        ? `Laporan ditugaskan kepada ${assigneeName}. Catatan: ${trimmedNote}.`
        : `Laporan ditugaskan kepada ${assigneeName}.`,
      createdAt: now,
    });
  });

  await recordAuditLog({
    action: "report.assign",
    entityType: "report",
    entityId: reportId,
    actor,
    targetId: reportId,
    targetLabel: report.reportNumber,
    description: trimmedNote
      ? `${actor.name} menugaskan laporan ${report.reportNumber} kepada ${assigneeName} dengan catatan "${trimmedNote}".`
      : `${actor.name} menugaskan laporan ${report.reportNumber} kepada ${assigneeName}.`,
    request,
  });
}

export async function updateReportSparePartRecord({
  reportId,
  actor,
  sparePart,
  request,
}: {
  reportId: string;
  actor: SessionUser;
  sparePart: string;
  request?: Request;
}) {
  const now = new Date();
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  if (!report) return;

  await db.transaction(async (tx) => {
    await tx
      .update(reports)
      .set({
        sparePart,
        updatedAt: now,
        unreadUpdate: true,
      })
      .where(eq(reports.id, reportId));
  });

  await recordAuditLog({
    action: "report.spare_part.update",
    entityType: "report",
    entityId: reportId,
    actor,
    targetId: reportId,
    targetLabel: report.reportNumber,
    description: `${actor.name} memperbarui spare part laporan ${report.reportNumber}.`,
    request,
  });
}

export async function addCommentRecord({
  reportId,
  actor,
  message,
  request,
}: {
  reportId: string;
  actor: SessionUser;
  message: string;
  request?: Request;
}) {
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  await db.insert(reportComments).values({
    id: `comment-${crypto.randomUUID()}`,
    reportId,
    authorId: actor.id,
    authorName: actor.name,
    authorRole: actor.role,
    message,
    createdAt: new Date(),
  });

  await recordAuditLog({
    action: "report.comment.add",
    entityType: "report",
    entityId: reportId,
    actor,
    targetId: reportId,
    targetLabel: report?.reportNumber ?? reportId,
    description: `${actor.name} menambahkan catatan tindak lanjut pada laporan ${report?.reportNumber ?? reportId}.`,
    request,
  });
}

export async function deleteReportRecord({
  reportId,
  actor,
  request,
}: {
  reportId: string;
  actor: SessionUser;
  request?: Request;
}) {
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  await db.delete(reports).where(eq(reports.id, reportId));

  await recordAuditLog({
    action: "report.delete",
    entityType: "report",
    entityId: reportId,
    actor,
    targetId: reportId,
    targetLabel: report?.reportNumber ?? reportId,
    description: `${actor.name} menghapus laporan ${report?.reportNumber ?? reportId}.`,
    request,
  });
}
