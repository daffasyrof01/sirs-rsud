import { deleteReportRecord, getReportForSession, updateReportStatusRecord } from "@/lib/server/reports";
import { fail, ok } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteRole, requireRouteSession, serializeSession } from "@/lib/server/session";
import type { Report } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRouteSession(request);
    const { id } = await params;
    const report = await getReportForSession({
      reportId: id,
      session: serializeSession(session),
    });

    if (!report) return fail("Laporan tidak ditemukan.", 404);
    return ok({ data: report });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "reports:status",
      limit: 60,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan mengubah status laporan. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["admin", "superadmin"]);
    const { id } = await params;
    const body = (await request.json()) as { status: Report["status"]; note: string };

    await updateReportStatusRecord({
      reportId: id,
      actor: serializeSession(session),
      status: body.status,
      note: body.note,
      request,
    });

    return ok({ success: true });
  } catch (error) {
    return fail(error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized", error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "reports:delete",
      limit: 20,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan menghapus laporan. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["superadmin"]);
    const { id } = await params;
    await deleteReportRecord({
      reportId: id,
      actor: serializeSession(session),
      request,
    });
    return ok({ success: true });
  } catch (error) {
    return fail(error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized", error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401);
  }
}
