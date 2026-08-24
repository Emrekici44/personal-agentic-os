import { NextRequest, NextResponse } from "next/server";
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
  return NextResponse.json({ kind, records: listRecords(kind), source: "laptop-shared-store" }, { headers });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  try {
    if (!auth(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
    if (!isCrudKind(kind)) throw new Error("Unbekannter Datentyp");
    const body = await request.json();
    return NextResponse.json(createRecord(kind, kind === "agents" ? validateAgentConfig(body) : body), { status: 201, headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erstellen fehlgeschlagen" }, { status: 400, headers });
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
    const message = error instanceof Error ? error.message : "Aktualisieren fehlgeschlagen";
    return NextResponse.json({ error: message, conflict: message.startsWith("Datenkonflikt") }, { status: message.startsWith("Datenkonflikt") ? 409 : 400, headers });
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
    const message = error instanceof Error ? error.message : "Archivieren fehlgeschlagen";
    return NextResponse.json({ error: message, conflict: message.startsWith("Datenkonflikt") }, { status: message.startsWith("Datenkonflikt") ? 409 : 400, headers });
  }
}
