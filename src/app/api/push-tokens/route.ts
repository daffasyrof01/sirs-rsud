import { fail, ok } from "@/lib/server/http";
import { upsertPushDeviceToken } from "@/lib/server/push-notifications";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const session = await requireRouteSession(request);
    const body = (await request.json().catch(() => null)) as {
      token?: string;
      platform?: string;
    } | null;
    const token = String(body?.token ?? "").trim();
    const platform = String(body?.platform ?? "android").trim() || "android";

    if (!token) {
      return fail("Token notifikasi tidak valid.", 400);
    }

    await upsertPushDeviceToken({
      userId: session.user.id,
      token,
      platform,
    });

    return ok({ data: { success: true } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }

    return fail(error instanceof Error ? error.message : "Gagal menyimpan token notifikasi.", 400);
  }
}
