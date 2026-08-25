import { NextRequest, NextResponse } from "next/server";
import { refreshedAccessToken } from "@/lib/google-calendar";
import { readCalendarCatalog, readGoogleCalendarWindow } from "@/lib/google-calendar-read";
import { weeklyWindow } from "@/lib/weekly-planner";
import { runAgent } from "@/lib/runtime/service";
import { publicApiError, publicConflict } from "@/lib/public-api-error";
import { readPrivateJson, trustedPrivateMutationOrigin } from "@/lib/private-request";
import { latestWeeklyPlan, listWeeklyPlanSummaries, reviewWeeklyPlan, verifyLocalSession, withStoreTransaction } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });

function authenticated(request: NextRequest) {
  return verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
}

export async function GET(request: NextRequest) {
  if (!authenticated(request)) return respond({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  try {
    return respond({ plan: latestWeeklyPlan(), history: listWeeklyPlanSummaries(), source: "laptop-shared-store", inventoryVerified: true, backgroundWrites: false, writesPerformed: false });
  } catch {
    return respond({ error: "Wochenplanverlauf ist vorübergehend nicht erreichbar", plan: null, history: [], source: "unavailable", inventoryVerified: false, retrySafe: true, backgroundWrites: false, writesPerformed: false }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authenticated(request)) return respond({ error: "Lokale Sitzung erforderlich", writesPerformed: false }, { status: 401 });
  if (!trustedPrivateMutationOrigin(request)) return respond({ error: "Anfrageherkunft nicht zulässig", writesPerformed: false }, { status: 403 });
  let access: string | null;
  try {
    access = await refreshedAccessToken(request.cookies.get("agentic_os_google_token")?.value);
    if (!access) return respond({ error: "Google Calendar ist nicht verbunden", connected: false, writesPerformed: false }, { status: 409 });
  } catch {
    return respond({ error: "Google-Tokenprüfung vor der Planung nicht erreichbar", connected: null, writesPerformed: false, retrySafe: true }, { status: 503 });
  }
  let body: any;
  try {
    body = await readPrivateJson(request);
  } catch {
    return respond({ error: "Planungsanfrage ist ungültig", writesPerformed: false }, { status: 400 });
  }
  const selectedCalendarIds: string[] = [...new Set<string>((Array.isArray(body.selectedCalendarIds) ? body.selectedCalendarIds : []).map((value: unknown) => String(value)))].slice(0, 12);
  if (!selectedCalendarIds.length) return respond({ error: "Bitte mindestens einen Kalender auswählen", writesPerformed: false }, { status: 400 });
  const window = weeklyWindow(new Date());
  let calendars: any[], events: any[];
  try {
    calendars = await readCalendarCatalog(access);
    events = await readGoogleCalendarWindow(access, selectedCalendarIds, window.start, window.end, calendars);
  } catch (error) {
    const staleSelection = error instanceof Error && error.message === "Unbekannter Kalender ausgewählt";
    return respond({ error: staleSelection ? "Kalenderauswahl ist nicht mehr aktuell; bitte Kalender neu laden" : "Kalenderquellen für den Wochenplan sind vorübergehend nicht erreichbar", writesPerformed: false, retrySafe: true }, { status: staleSelection ? 409 : 502 });
  }
  try {
    const runtime = await runAgent({ agentId: "weekly_planner", input: "Erzeuge den Wochenvorschlag aus den ausgewählten, verifizierten Kalendern.", trustedSourceOverrides: { calendar_catalog: calendars, calendar_events: events }, plannerInput: { selectedCalendarIds, generatedAt: new Date().toISOString() } });
    return respond({ plan: runtime.weeklyPlan, history: listWeeklyPlanSummaries(), runtime: { runId: runtime.run.id, steps: runtime.run.steps, receipts: runtime.receipts, modelUsed: false, externalActionsPerformed: false, backgroundActions: false }, generatedFromRealSources: true, rawEventDetailsExposed: false, writesPerformed: false });
  } catch (error) {
    const fallback = "Wochenplan konnte lokal nicht sicher gespeichert werden";
    const message = publicApiError(error, fallback);
    return respond({ error: message, retrySafe: message === fallback, writesPerformed: false }, { status: message === fallback ? 503 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!authenticated(request)) return respond({ error: "Lokale Sitzung erforderlich", writesPerformed: false }, { status: 401 });
    if (!trustedPrivateMutationOrigin(request)) return respond({ error: "Anfrageherkunft nicht zulässig", writesPerformed: false }, { status: 403 });
    const body = await readPrivateJson(request);
    const plan = withStoreTransaction(() => reviewWeeklyPlan(String(body.planId || ""), body));
    return respond({ plan, history: listWeeklyPlanSummaries(), calendarWritesPrepared: false, writesPerformed: false });
  } catch (error) {
    const fallback = "Auswahl konnte lokal nicht sicher gespeichert werden";
    const message = publicApiError(error, fallback), conflict = publicConflict(error), retrySafe = !conflict && message === fallback;
    return respond({ error: message, conflict, retrySafe, writesPerformed: false }, { status: conflict ? 409 : retrySafe ? 503 : 400 });
  }
}
