import { NextRequest, NextResponse } from "next/server";
import { projectWorkspace, verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value)) return respond({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  try {
    const { id } = await params;
    return respond(projectWorkspace(id));
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Projektarbeitsraum nicht verfügbar" }, { status: 404 });
  }
}
