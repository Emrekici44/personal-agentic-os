import { NextRequest, NextResponse } from "next/server";
import {
  getPreference,
  isPreferenceId,
  setPreference,
  verifyLocalSession,
} from "@/lib/shared-store";

const authorized = (request: NextRequest) =>
  verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!authorized(request))
    return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  if (!isPreferenceId(id))
    return NextResponse.json({ error: "Unbekannte Einstellung" }, { status: 404 });
  return NextResponse.json(getPreference(id));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!authorized(request)) throw new Error("Lokale Sitzung erforderlich");
    if (!isPreferenceId(id)) throw new Error("Unbekannte Einstellung");
    const body = await request.json();
    return NextResponse.json(setPreference(id, body.value));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Speichern fehlgeschlagen" },
      { status: 400 },
    );
  }
}
