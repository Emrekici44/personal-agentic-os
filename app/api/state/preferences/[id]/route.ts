import { NextRequest, NextResponse } from "next/server";
import { publicApiError } from "@/lib/public-api-error";
import {
  getPreference,
  isPreferenceId,
  setPreference,
  verifyLocalSession,
} from "@/lib/shared-store";

const authorized = (request: NextRequest) =>
  verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
const headers = { "Cache-Control": "no-store, private" };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!authorized(request))
    return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
  if (!isPreferenceId(id))
    return NextResponse.json({ error: "Unbekannte Einstellung" }, { status: 404, headers });
  try {
    return NextResponse.json(getPreference(id), { headers });
  } catch {
    return NextResponse.json({ error: "Geteilte Einstellung ist vorübergehend nicht erreichbar", preference: null, retrySafe: true }, { status: 503, headers });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!authorized(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
    if (!isPreferenceId(id)) throw new Error("Unbekannte Einstellung");
    const body = await request.json();
    return NextResponse.json(setPreference(id, body.value), { headers });
  } catch (error) {
    return NextResponse.json(
      { error: publicApiError(error, "Einstellung konnte nicht sicher gespeichert werden") },
      { status: 400, headers },
    );
  }
}
