import { listRecentAuditLogs } from "@/lib/server/audit-log";
import { fail, ok } from "@/lib/server/http";
import { requireRouteRole } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    await requireRouteRole(request, ["superadmin"]);

    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("limit") ?? "8");
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 8;
    const logs = await listRecentAuditLogs(limit);

    return ok({ data: logs });
  } catch (error) {
    return fail(
      error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized",
      error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401,
    );
  }
}
