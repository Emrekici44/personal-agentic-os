import { NextRequest, NextResponse } from "next/server";
import { publicApiError, publicConflict } from "@/lib/public-api-error";
import {
  archiveRecord,
  createRecord,
  isCrudKind,
  listRecords,
  updateRecord,
  validateAgentConfig,
  verifyLocalSession,
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
    const body = await request.json();
    return NextResponse.json(createRecord(kind, kind === "agents" ? validateAgentConfig(body) : body), { status: 201, headers });
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, "Eintrag konnte nicht sicher erstellt werden") }, { status: 400, headers });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  try {
    if (!auth(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
    if (!isCrudKind(kind)) throw new Error("Unbekannter Datentyp");
    const body = await request.json();
    return NextResponse.json(updateRecord(kind, String(body.id || ""), kind === "agents" ? validateAgentConfig(body) : body), { headers });
  } catch (error) {
    const conflict = publicConflict(error);
    return NextResponse.json({ error: publicApiError(error, "Eintrag konnte nicht sicher aktualisiert werden"), conflict }, { status: conflict ? 409 : 400, headers });
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
    return NextResponse.json({ error: publicApiError(error, "Eintrag konnte nicht sicher archiviert werden"), conflict }, { status: conflict ? 409 : 400, headers });
  }
}
