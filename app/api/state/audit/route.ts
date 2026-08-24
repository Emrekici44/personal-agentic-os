import { NextRequest, NextResponse } from "next/server";
import { listAuditEntries, verifyLocalSession } from "@/lib/shared-store";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("agentic_os_local_session")?.value;
  if (!verifyLocalSession(session)) {
    return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  }

  return NextResponse.json({
    entries: listAuditEntries(8),
    fields: ["action", "entityType", "createdAt"],
    personalContentExposed: false,
    source: "laptop-shared-store",
  });
}
