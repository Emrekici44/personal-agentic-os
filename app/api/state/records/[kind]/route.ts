import { NextRequest, NextResponse } from "next/server";
import { publicApiError, publicConflict } from "@/lib/public-api-error";
import { readPrivateJson } from "@/lib/private-request";
import {
  archiveRecord,
  createRecord,
  isCrudKind,
  listRecords,
  updateRecord,
  validateAgentConfig,
  verifyLocalSession,
  withStoreTransaction,
} from "@/lib/shared-store";

const auth = (request: NextRequest) =>
  verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
const headers = { "Cache-Control": "no-store, private" };

export async function GET(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!auth(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
  if (!isCrudKind(kind)) return NextResponse.json({ error: "Unbekannter Datentyp" }, { status: 404, headers });
  try {
    return NextResponse.json({ kind, records: listRecords(kind), source: "laptop-shared-store", inventoryVerified: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Gemeinsame Datensätze sind vorübergehend nicht erreichbar", kind, records: [], source: "unavailable", inventoryVerified: false, retrySafe: true }, { status: 503, headers });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  try {
    if (!auth(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
    if (!isCrudKind(kind)) throw new Error("Unbekannter Datentyp");
    const body = await readPrivateJson(request);
    return NextResponse.json(withStoreTransaction(() => createRecord(kind, kind === "agents" ? validateAgentConfig(body) : body)), { status: 201, headers });
  } catch (error) {
    const fallback = "Eintrag konnte lokal nicht sicher erstellt werden", message = publicApiError(error, fallback), retrySafe = message === fallback;
    return NextResponse.json({ error: message, retrySafe }, { status: retrySafe ? 503 : 400, headers });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  try {
    if (!auth(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
    if (!isCrudKind(kind)) throw new Error("Unbekannter Datentyp");
    const body = await readPrivateJson(request);
    return NextResponse.json(withStoreTransaction(() => updateRecord(kind, String(body.id || ""), kind === "agents" ? validateAgentConfig(body) : body)), { headers });
  } catch (error) {
    const conflict = publicConflict(error);
    const fallback = "Eintrag konnte lokal nicht sicher aktualisiert werden", message = publicApiError(error, fallback), retrySafe = !conflict && message === fallback;
    return NextResponse.json({ error: message, conflict, retrySafe }, { status: conflict ? 409 : retrySafe ? 503 : 400, headers });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  try {
    if (!auth(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
    if (!isCrudKind(kind)) throw new Error("Unbekannter Datentyp");
    const id = request.nextUrl.searchParams.get("id");
    const version = Number(request.nextUrl.searchParams.get("version"));
    if (!id) throw new Error("ID fehlt");
    return NextResponse.json(archiveRecord(kind, id, version), { headers });
  } catch (error) {
    const conflict = publicConflict(error);
    const fallback = "Eintrag konnte lokal nicht sicher archiviert werden", message = publicApiError(error, fallback), retrySafe = !conflict && message === fallback;
    return NextResponse.json({ error: message, conflict, retrySafe }, { status: conflict ? 409 : retrySafe ? 503 : 400, headers });
  }
}
