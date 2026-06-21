import { fail } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteRole } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "users:import",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Terlalu banyak percobaan impor pengguna. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    await requireRouteRole(request, ["superadmin"]);
    return fail("Impor pengguna belum diaktifkan. Gunakan tambah pengguna manual untuk saat ini.", 501);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    return fail(error instanceof Error ? error.message : "Gagal mengimpor pengguna.", 400);
  }
}
