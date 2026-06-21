import { createReportRecord, listReportsForSession } from "@/lib/server/reports";
import { fail, ok } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteSession, serializeSession } from "@/lib/server/session";
import type { DraftReportForm, ReportAttachment } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const session = await requireRouteSession(request);
    const reports = await listReportsForSession({
      session: serializeSession(session),
    });

    return ok({ data: reports });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "reports:create",
      limit: 30,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan membuat laporan. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteSession(request);
    const body = (await request.json()) as {
      title?: string;
      category?: string;
      location?: string;
      priority?: string;
      description?: string;
      occurredAt?: string;
      attachments?: ReportAttachment[];
    };
    const values = parseDraftFields(body);
    const reportId = `report-${crypto.randomUUID()}`;
    const attachments = normalizeAttachments(body.attachments);

    const createdId = await createReportRecord({
      reportId,
      session: serializeSession(session),
      values,
      attachments,
      request,
    });

    return ok({ data: { id: createdId.id } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }
    return fail(error instanceof Error ? error.message : "Gagal membuat laporan.", 400);
  }
}

function parseDraftFields(body: {
  title?: string;
  category?: string;
  location?: string;
  priority?: string;
  description?: string;
  occurredAt?: string;
}): Omit<DraftReportForm, "attachments"> {
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "").trim();
  const location = String(body.location ?? "").trim();
  const priority = String(body.priority ?? "").trim();
  const description = String(body.description ?? "").trim();
  const occurredAt = String(body.occurredAt ?? "").trim();

  if (!title || !category || !location || !priority || !description || !occurredAt) {
    throw new Error("Data laporan belum lengkap.");
  }

  return {
    title,
    category: valuesAsCategory(category),
    location,
    priority: valuesAsPriority(priority),
    description,
    occurredAt,
  };
}

function valuesAsCategory(value: string): DraftReportForm["category"] {
  return value as DraftReportForm["category"];
}

function valuesAsPriority(value: string): DraftReportForm["priority"] {
  return value as DraftReportForm["priority"];
}

function normalizeAttachments(attachments: ReportAttachment[] | undefined): ReportAttachment[] {
  if (!attachments || attachments.length === 0) return [];

  return attachments
    .filter((attachment) => attachment.previewUrl && attachment.name)
    .map((attachment) => ({
      id: attachment.id || `attachment-${crypto.randomUUID()}`,
      name: attachment.name,
      sizeLabel: attachment.sizeLabel,
      previewUrl: attachment.previewUrl,
    }));
}
