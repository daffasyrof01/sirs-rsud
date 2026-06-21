import { ok } from "@/lib/server/http";
import { getRequestSession, serializeSession } from "@/lib/server/session";

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  return ok({
    data: session ? serializeSession(session) : null,
  });
}
