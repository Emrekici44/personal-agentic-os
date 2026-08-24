import { NextRequest, NextResponse } from "next/server";
import { publicApiError } from "@/lib/public-api-error";
import {
  backupStore,
  listStoreBackups,
  previewRestore,
  storeStatus,
  verifyLocalSession,
} from "@/lib/shared-store";

const authorized = (request: NextRequest) =>
  verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
const headers = { "Cache-Control": "no-store, private" };

export async function GET(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
  return NextResponse.json({
    backups: listStoreBackups(),
    store: storeStatus(),
    localOnly: true,
    restorePerformed: false,
    restoreAvailable: false,
  }, { headers });
}

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich", restorePerformed: false }, { status: 401, headers });
    const body = await request.json();
    if (body.action !== "create_backup") throw new Error("Unbekannte Backup-Aktion");
    return NextResponse.json({ backup: backupStore(), restorePerformed: false }, { headers });
  } catch (error) {
    return NextResponse.json(
      { error: publicApiError(error, "Lokales Backup konnte nicht sicher erstellt werden") },
      { status: 400, headers },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich", restorePerformed: false }, { status: 401, headers });
    const body = await request.json();
    if (body.action !== "preview_restore") throw new Error("Unbekannte Restore-Aktion");
    return NextResponse.json(previewRestore(String(body.fileName || "")), { headers });
  } catch (error) {
    return NextResponse.json(
      { error: publicApiError(error, "Restore-Vorschau konnte nicht sicher erzeugt werden") },
      { status: 400, headers },
    );
  }
}
