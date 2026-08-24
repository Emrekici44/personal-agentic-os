import { NextRequest, NextResponse } from "next/server";
import { refreshedAccessToken } from "@/lib/google-calendar";
import { readCalendarCatalog, readGoogleCalendarWindow } from "@/lib/google-calendar-read";
import { buildWeeklyPlan, weeklyWindow } from "@/lib/weekly-planner";
import { latestWeeklyPlan, listRecords, listWeeklyPlanSummaries, reviewWeeklyPlan, saveWeeklyPlan, verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });

function authenticated(request: NextRequest) {
  return verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
}

export async function GET(request: NextRequest) {
  if (!authenticated(request)) return respond({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  return respond({ plan: latestWeeklyPlan(), history: listWeeklyPlanSummaries(), source: "laptop-shared-store", backgroundWrites: false, writesPerformed: false });
}

export async function POST(request: NextRequest) {
  try {
    if (!authenticated(request)) return respond({ error: "Lokale Sitzung erforderlich", writesPerformed: false }, { status: 401 });
    const access = await refreshedAccessToken(request.cookies.get("agentic_os_google_token")?.value);
    if (!access) return respond({ error: "Google Calendar ist nicht verbunden", connected: false, writesPerformed: false }, { status: 409 });
    const body = await request.json();
    const selectedCalendarIds: string[] = [...new Set<string>((Array.isArray(body.selectedCalendarIds) ? body.selectedCalendarIds : []).map((value: unknown) => String(value)))].slice(0, 12);
    if (!selectedCalendarIds.length) throw new Error("Bitte mindestens einen Kalender auswählen");
    const window = weeklyWindow(new Date());
    const calendars = await readCalendarCatalog(access);
    const events = await readGoogleCalendarWindow(access, selectedCalendarIds, window.start, window.end, calendars);
    const proposal = buildWeeklyPlan({
      now: new Date(),
      calendars,
      selectedCalendarIds,
      events,
      tasks: listRecords("tasks"),
      inbox: listRecords("inbox_items"),
      projects: listRecords("projects"),
    });
    const plan = saveWeeklyPlan(proposal);
    return respond({ plan, history: listWeeklyPlanSummaries(), generatedFromRealSources: true, rawEventDetailsExposed: false, writesPerformed: false });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Wochenplan konnte nicht erzeugt werden", writesPerformed: false }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!authenticated(request)) return respond({ error: "Lokale Sitzung erforderlich", writesPerformed: false }, { status: 401 });
    const body = await request.json();
    const plan = reviewWeeklyPlan(String(body.planId || ""), body);
    return respond({ plan, history: listWeeklyPlanSummaries(), calendarWritesPrepared: false, writesPerformed: false });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Auswahl konnte nicht gespeichert werden", writesPerformed: false }, { status: 400 });
  }
}
