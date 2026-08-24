import { NextRequest, NextResponse } from "next/server";
import { refreshedAccessToken } from "@/lib/google-calendar";
import { readCalendarCatalog, readGoogleCalendarWindow } from "@/lib/google-calendar-read";
import { buildWeeklyPlan, weeklyWindow } from "@/lib/weekly-planner";
import { latestWeeklyPlan, listRecords, reviewWeeklyPlan, saveWeeklyPlan, verifyLocalSession } from "@/lib/shared-store";

function authenticated(request: NextRequest) {
  return verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value);
}

export async function GET(request: NextRequest) {
  if (!authenticated(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
  return NextResponse.json({ plan: latestWeeklyPlan(), source: "laptop-shared-store", backgroundWrites: false, writesPerformed: false }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: NextRequest) {
  try {
    if (!authenticated(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich", writesPerformed: false }, { status: 401 });
    const access = await refreshedAccessToken(request.cookies.get("agentic_os_google_token")?.value);
    if (!access) return NextResponse.json({ error: "Google Calendar ist nicht verbunden", connected: false, writesPerformed: false }, { status: 409 });
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
    return NextResponse.json({ plan: saveWeeklyPlan(proposal), generatedFromRealSources: true, rawEventDetailsExposed: false, writesPerformed: false }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Wochenplan konnte nicht erzeugt werden", writesPerformed: false }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!authenticated(request)) return NextResponse.json({ error: "Lokale Sitzung erforderlich", writesPerformed: false }, { status: 401 });
    const body = await request.json();
    return NextResponse.json({ plan: reviewWeeklyPlan(String(body.planId || ""), body), calendarWritesPrepared: false, writesPerformed: false }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Auswahl konnte nicht gespeichert werden", writesPerformed: false }, { status: 400 });
  }
}
