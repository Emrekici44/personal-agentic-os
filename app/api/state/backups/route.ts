import { NextRequest, NextResponse } from "next/server";
import {
  backupStore,
  listStoreBackups,
  previewRestore,
  storeStatus,
  verifyLocalSession,
} from "@/lib/shared-store";

const authorized = (request: NextRequest) =>
  verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);

export async function GET(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  return NextResponse.json({
    backups: listStoreBackups(),
    store: storeStatus(),
    localOnly: true,
    restorePerformed: false,
    restoreAvailable: false,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) throw new Error("Lokale Sitzung erforderlich");
    const body = await request.json();
    if (body.action !== "create_backup") throw new Error("Unbekannte Backup-Aktion");
    return NextResponse.json({ backup: backupStore(), restorePerformed: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Backup fehlgeschlagen" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!authorized(request)) throw new Error("Lokale Sitzung erforderlich");
    const body = await request.json();
    if (body.action !== "preview_restore") throw new Error("Unbekannte Restore-Aktion");
    return NextResponse.json(previewRestore(String(body.fileName || "")));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Restore-Vorschau fehlgeschlagen" },
      { status: 400 },
    );
  }
}
