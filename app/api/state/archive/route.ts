import { NextRequest, NextResponse } from "next/server";
import { isCrudKind, listArchivedRecords, restoreArchivedRecord, verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const authorized = (request: NextRequest) => verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
  return NextResponse.json({ records: listArchivedRecords(), source: "laptop-shared-store", personalContentExposed: false, deletesPerformed: false }, { headers });
}

export async function PATCH(request: NextRequest) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich", restored: false }, { status: 401, headers });
    const body = await request.json(), kind = String(body.kind || "");
    if (!isCrudKind(kind)) throw new Error("Unbekannter Archivtyp");
    return NextResponse.json(restoreArchivedRecord(kind, String(body.id || ""), Number(body.version)), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wiederherstellung fehlgeschlagen";
    return NextResponse.json({ error: message, restored: false, conflict: message.startsWith("Datenkonflikt") }, { status: message.startsWith("Datenkonflikt") ? 409 : 400, headers });
  }
}
