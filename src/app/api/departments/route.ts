import { asc, inArray, isNotNull } from "drizzle-orm";

import { reports } from "@/db/app-schema";
import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import { fail, ok } from "@/lib/server/http";
import { requireRouteRole } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    await requireRouteRole(request, ["admin", "superadmin"]);

    const users = await db.query.user.findMany({
      where: isNotNull(user.department),
      columns: {
        department: true,
        role: true,
      },
      orderBy: asc(user.department),
    });

    const registeredDepartments = Array.from(
      new Set(
        users
          .filter((item) => item.role === "staff" || item.role === "admin")
          .map((item) => item.department?.trim())
          .filter((item): item is string => Boolean(item)),
      ),
    );

    if (registeredDepartments.length === 0) {
      return ok({ data: [] });
    }

    const reportCounts = await db
      .select({
        department: reports.reporterDepartment,
      })
      .from(reports)
      .where(inArray(reports.reporterDepartment, registeredDepartments));

    const usedDepartments = new Set(reportCounts.map((item) => item.department));

    return ok({
      data: registeredDepartments.filter((department) => usedDepartments.has(department)),
    });
  } catch (error) {
    return fail(error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized", error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401);
  }
}
