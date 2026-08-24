import { NextRequest, NextResponse } from "next/server";
import { publicApiError } from "@/lib/public-api-error";
import { projectWorkspace, verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value)) return respond({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  try {
    const { id } = await params;
    return respond(projectWorkspace(id));
  } catch (error) {
    const fallback = "Projektarbeitsraum ist vorübergehend nicht erreichbar";
    const message = publicApiError(error, fallback);
    return respond({ error: message, workspace: null, inventoryVerified: false, retrySafe: message === fallback }, { status: message === "Projekt nicht gefunden" ? 404 : 503 });
  }
}
