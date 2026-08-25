import { NextRequest, NextResponse } from "next/server";
import { publicApiError, publicConflict } from "@/lib/public-api-error";
import { readPrivateJson, trustedPrivateMutationOrigin } from "@/lib/private-request";
import {
  getPreference,
  isPreferenceId,
  setPreference,
  verifyLocalSession,
  withStoreTransaction,
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
    if (!trustedPrivateMutationOrigin(request)) return NextResponse.json({ error: "Anfrageherkunft nicht zulässig" }, { status: 403, headers });
    if (!isPreferenceId(id)) throw new Error("Unbekannte Einstellung");
    const body = await readPrivateJson(request);
    return NextResponse.json(withStoreTransaction(() => setPreference(id, body.value, body.version)), { headers });
  } catch (error) {
    const fallback = "Einstellung konnte lokal nicht sicher gespeichert werden", message = publicApiError(error, fallback), retrySafe = message === fallback;
    return NextResponse.json(
      { error: message, retrySafe },
      { status: publicConflict(error) ? 409 : retrySafe ? 503 : 400, headers },
    );
  }
}
