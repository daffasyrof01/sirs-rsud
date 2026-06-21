import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { fail } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireTrustedOrigin } from "@/lib/server/request-security";
import { requireRouteSession } from "@/lib/server/session";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const limited = rateLimit(request, {
      key: "blob:upload",
      limit: 30,
      windowMs: 10 * 60 * 1000,
      message: "Terlalu banyak percobaan upload. Coba lagi beberapa saat.",
    });
    if (limited) return limited;

    const session = await requireRouteSession(request);
    const body = (await request.json()) as HandleUploadBody;

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`reports/${session.user.id}/`)) {
          throw new Error("Path upload tidak valid.");
        }

        const lowerPathname = pathname.toLowerCase();
        if (!ALLOWED_EXTENSIONS.some((extension) => lowerPathname.endsWith(extension))) {
          throw new Error("Format file harus JPG, PNG, atau WEBP.");
        }

        return {
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        return;
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Forbidden", 403);
    }
    return fail(error instanceof Error ? error.message : "Gagal menyiapkan upload file.", 400);
  }
}
