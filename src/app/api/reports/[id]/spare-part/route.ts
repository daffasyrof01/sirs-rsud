import { updateReportSparePartRecord } from "@/lib/server/reports";
import { fail, ok } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteRole, serializeSession } from "@/lib/server/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "reports:spare-part",
      limit: 60,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan memperbarui spare part. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteRole(request, ["admin", "superadmin"]);
    const { id } = await params;
    const body = (await request.json()) as { sparePart?: string };

    await updateReportSparePartRecord({
      reportId: id,
      actor: serializeSession(session),
      sparePart: body.sparePart?.trim() ?? "",
      request,
    });

    return ok({ success: true });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized",
      error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401,
    );
  }
}
