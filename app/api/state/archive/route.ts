import { NextRequest, NextResponse } from "next/server";
import { publicApiError, publicConflict } from "@/lib/public-api-error";
import { isCrudKind, listArchivedRecords, restoreArchivedRecord, verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const authorized = (request: NextRequest) => verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
  try {
    return NextResponse.json({ records: listArchivedRecords(), source: "laptop-shared-store", inventoryVerified: true, personalContentExposed: false, deletesPerformed: false }, { headers });
  } catch {
    return NextResponse.json({ error: "Lokales Archiv ist vorübergehend nicht erreichbar", records: [], inventoryVerified: false, retrySafe: true, personalContentExposed: false, deletesPerformed: false }, { status: 503, headers });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich", restored: false }, { status: 401, headers });
    const body = await request.json(), kind = String(body.kind || "");
    if (!isCrudKind(kind)) throw new Error("Unbekannter Archivtyp");
    return NextResponse.json(restoreArchivedRecord(kind, String(body.id || ""), Number(body.version)), { headers });
  } catch (error) {
    const conflict = publicConflict(error);
    const fallback = "Wiederherstellung konnte lokal nicht sicher abgeschlossen werden", message = publicApiError(error, fallback), retrySafe = !conflict && message === fallback;
    return NextResponse.json({ error: message, restored: false, conflict, retrySafe }, { status: conflict ? 409 : retrySafe ? 503 : 400, headers });
  }
}
