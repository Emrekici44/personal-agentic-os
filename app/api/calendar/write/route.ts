import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { auditCalendarWrite, consumeApproval, type CalendarChange } from "@/lib/calendar-write";
import { refreshedAccessToken } from "@/lib/google-calendar";
import { googleRequestSignal } from "@/lib/google-transport";
import { publicApiError } from "@/lib/public-api-error";
import { readPrivateJson, trustedPrivateMutationOrigin } from "@/lib/private-request";
import { verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });

export async function POST(request: NextRequest) {
  if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value)) {
    return respond({ error: "Lokale Sitzung erforderlich", written: false, approvalConsumed: false }, { status: 401 });
  }
  if (!trustedPrivateMutationOrigin(request)) {
    return respond({ error: "Anfrageherkunft nicht zulässig", written: false, outcome: "not_started", approvalConsumed: false, retryAllowed: false }, { status: 403 });
  }

  let access: string | null = null;
  try {
    access = await refreshedAccessToken(request.cookies.get("agentic_os_google_token")?.value);
  } catch {
    return respond({ error: "Google-Tokenprüfung vor dem Write nicht erreichbar", written: false, outcome: "not_started", approvalConsumed: false, retryAllowed: false }, { status: 503 });
  }
  if (!access) {
    return respond({ error: "Google Calendar ist nicht verbunden", written: false, outcome: "not_started", approvalConsumed: false, retryAllowed: false }, { status: 409 });
  }

  let change: CalendarChange;
  try {
    const body = await readPrivateJson(request);
    change = consumeApproval(body.approvalToken, body.confirmation);
  } catch (error) {
    return respond({ error: publicApiError(error, "Kalenderfreigabe wurde sicher abgelehnt"), written: false, outcome: "not_started", approvalConsumed: false, retryAllowed: false }, { status: 400 });
  }

  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(change.calendarId)}/events`;
  if (change.action === "create") {
    try {
      const duplicate = new URL(base);
      duplicate.searchParams.set("privateExtendedProperty", `agenticOsIdempotencyKey=${change.idempotencyKey}`);
      duplicate.searchParams.set("timeMin", new Date(change.start).toISOString());
      duplicate.searchParams.set("timeMax", new Date(change.end).toISOString());
      duplicate.searchParams.set("fields", "items(id)");
      const existing = await fetch(duplicate, { headers: { authorization: `Bearer ${access}` }, cache: "no-store", signal: googleRequestSignal() });
      if (!existing.ok) throw new Error("Duplikatprüfung fehlgeschlagen");
      const matches = await existing.json();
      if (Array.isArray(matches.items) && matches.items.length) {
        const auditId = crypto.randomUUID();
        await auditCalendarWrite({ auditId, action: change.action, calendarId: change.calendarId, idempotencyKey: change.idempotencyKey, approved: true, duplicatePrevented: true, writeStarted: false });
        return respond({ written: false, duplicatePrevented: true, outcome: "duplicate_prevented", approvalConsumed: true, auditRecorded: true, auditId, deletesEnabled: false });
      }
    } catch {
      return respond({ error: "Duplikatprüfung nicht bestätigt; neue exakte Vorschau erforderlich", written: false, outcome: "not_started", approvalConsumed: true, newApprovalRequired: true, retryAllowed: false }, { status: 502 });
    }
  }

  const url = change.action === "update" ? `${base}/${encodeURIComponent(change.eventId!)}` : base;
  const event = { summary: change.title, description: change.description, location: change.location, start: { dateTime: change.start }, end: { dateTime: change.end }, extendedProperties: { private: { agenticOsIdempotencyKey: change.idempotencyKey } } };
  let result: any;
  try {
    const response = await fetch(url, { method: change.action === "update" ? "PATCH" : "POST", headers: { authorization: `Bearer ${access}`, "content-type": "application/json" }, body: JSON.stringify(event), cache: "no-store", signal: googleRequestSignal() });
    if (!response.ok) {
      return respond({ error: "Google hat die Kalenderänderung abgelehnt; neue exakte Vorschau erforderlich", written: false, outcome: "rejected", approvalConsumed: true, newApprovalRequired: true, retryAllowed: false }, { status: 502 });
    }
    result = await response.json();
    if (!result?.id) throw new Error("Google-Ergebnis ohne Event-ID");
  } catch {
    return respond({ error: "Write-Ergebnis ist nicht bestätigt; Kalender vor einer neuen Vorschau prüfen", written: null, outcome: "unknown", approvalConsumed: true, verificationRequired: true, retryAllowed: false }, { status: 502 });
  }

  let verified = false;
  try {
    const verification = new URL(`${base}/${encodeURIComponent(result.id)}`);
    verification.searchParams.set("fields", "id,start,end");
    const readBack = await fetch(verification, { headers: { authorization: `Bearer ${access}` }, cache: "no-store", signal: googleRequestSignal() });
    if (readBack.ok) {
      const verifiedEvent = await readBack.json();
      verified = verifiedEvent?.id === result.id;
    }
  } catch {
    verified = false;
  }

  const auditId = crypto.randomUUID();
  try {
    await auditCalendarWrite({ auditId, action: change.action, calendarId: change.calendarId, eventId: result.id, idempotencyKey: change.idempotencyKey, approved: true, writeSucceeded: true, readBackVerified: verified });
  } catch {
    return respond({ error: "Google hat den Write bestätigt, aber der lokale Audit ist nicht bestätigt", written: true, verified, outcome: "written_audit_unconfirmed", approvalConsumed: true, auditRecorded: false, verificationRequired: true, retryAllowed: false }, { status: 500 });
  }

  if (!verified) {
    return respond({ error: "Google hat den Write bestätigt, aber die Rückleseprüfung ist nicht bestätigt", written: true, verified: false, outcome: "written_unverified", approvalConsumed: true, auditRecorded: true, auditId, verificationRequired: true, retryAllowed: false }, { status: 502 });
  }

  return respond({ written: true, verified: true, outcome: "written_verified", action: change.action, eventId: result.id, auditId, approvalConsumed: true, auditRecorded: true, deletesEnabled: false });
}

export async function DELETE() {
  return NextResponse.json({ error: "Kalender-Löschungen sind deaktiviert" }, { status: 405, headers: { ...headers, Allow: "POST" } });
}
