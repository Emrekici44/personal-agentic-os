import { NextRequest, NextResponse } from "next/server";
import { createMemoryCandidate, listMemoryCandidates, reviewMemory, supersedeMemory } from "@/lib/repositories/memory-repository";
import { publicApiError, publicConflict } from "@/lib/public-api-error";
import { readPrivateJson, trustedPrivateMutationOrigin } from "@/lib/private-request";
import { verifyLocalSession, withStoreTransaction } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });
const authorized = (request: NextRequest) => verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);

export async function GET(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  try { return respond({ candidates: listMemoryCandidates(), inventoryVerified: true }); }
  catch { return respond({ error: "Memory Candidates sind vorübergehend nicht erreichbar", candidates: [], inventoryVerified: false, retrySafe: true }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich", writesPerformed: false }, { status: 401 });
  if (!trustedPrivateMutationOrigin(request)) return respond({ error: "Anfrageherkunft nicht zulässig", writesPerformed: false }, { status: 403 });
  try {
    const body = await readPrivateJson(request);
    const candidate = withStoreTransaction(() => createMemoryCandidate({ kind: body.kind, scope: body.scope, scopeId: body.scopeId, content: body.content, sourceType: "user_input", sourceId: body.sourceId, confidence: body.confidence }, "user"));
    return respond({ candidate, activated: false, externalActionsPerformed: false }, { status: 201 });
  } catch (error) { const message = publicApiError(error, "Memory Candidate konnte nicht sicher gespeichert werden"); return respond({ error: message, writesPerformed: false }, { status: message.includes("sicher") ? 503 : 400 }); }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return respond({ error: "Lokale Sitzung erforderlich", writesPerformed: false }, { status: 401 });
  if (!trustedPrivateMutationOrigin(request)) return respond({ error: "Anfrageherkunft nicht zulässig", writesPerformed: false }, { status: 403 });
  try {
    const body = await readPrivateJson(request), decision = String(body.action || "");
    if (!['activate', 'reject', 'supersede'].includes(decision)) throw new Error("Ungültige Memory-Entscheidung");
    const memory = withStoreTransaction(() => decision === "supersede" ? supersedeMemory(String(body.id || ""), Number(body.version), "user") : reviewMemory(String(body.id || ""), decision as "activate" | "reject", Number(body.version), "user"));
    return respond({ memory, externalActionsPerformed: false });
  } catch (error) { const fallback = "Memory-Entscheidung konnte nicht sicher gespeichert werden", message = publicApiError(error, fallback), conflict = publicConflict(error); return respond({ error: message, conflict, writesPerformed: false }, { status: conflict ? 409 : message === fallback ? 503 : 400 }); }
}
