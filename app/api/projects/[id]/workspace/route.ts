import { NextRequest, NextResponse } from "next/server";
import { projectWorkspace, verifyLocalSession } from "@/lib/shared-store";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json(projectWorkspace(id), { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Projektarbeitsraum nicht verfügbar" }, { status: 404 });
  }
}
