import { NextRequest, NextResponse } from "next/server";
import { assertBoundedWindow } from "@/lib/calendar-core.mjs";
import { refreshedAccessToken } from "@/lib/google-calendar";
import { readCalendarCatalog, readGoogleCalendarWindow } from "@/lib/google-calendar-read";
import { verifyLocalSession } from "@/lib/shared-store";
import { weeklyWindow } from "@/lib/weekly-planner";

const headers = { "Cache-Control": "no-store, private" };

export async function GET(req: NextRequest) {
  if (!verifyLocalSession(req.cookies.get("agentic_os_local_session")?.value)) {
    return NextResponse.json({ error: "Lokale Sitzung erforderlich", events: [] }, { status: 401, headers });
  }

  const calendarIds = [...new Set(req.nextUrl.searchParams.getAll("calendar"))].slice(0, 12);
  if (!calendarIds.length) {
    return NextResponse.json({ error: "Mindestens ein Kalender ist erforderlich", events: [] }, { status: 400, headers });
  }

  const window = weeklyWindow(new Date());
  assertBoundedWindow(window.start, window.end);
  let token: string | null;
  try {
    token = await refreshedAccessToken(req.cookies.get("agentic_os_google_token")?.value);
  } catch {
    return NextResponse.json({ error: "Google-Tokenprüfung vor dem Kalenderabruf nicht erreichbar", events: [], connected: null, retrySafe: true, writesPerformed: false }, { status: 503, headers });
  }
  if (!token) {
    return NextResponse.json(
      { mode: "unavailable", connected: false, error: "Google Calendar ist nicht verbunden", events: [], mockDataUsed: false, writesPerformed: false },
      { status: 409, headers },
    );
  }

  try {
    const catalog = await readCalendarCatalog(token);
    const events = await readGoogleCalendarWindow(token, calendarIds, window.start, window.end, catalog);
    return NextResponse.json(
      {
        mode: "google",
        connected: true,
        label: "Google Calendar · nur Lesen",
        events,
        boundedDays: window.days,
        timezone: window.timezone,
        windowStart: window.start,
        windowEnd: window.end,
        selectedCalendarCount: calendarIds.length,
        mockDataUsed: false,
        writesPerformed: false,
      },
      { headers },
    );
  } catch (error) {
    const staleSelection = error instanceof Error && error.message === "Unbekannter Kalender ausgewählt";
    return NextResponse.json(
      { error: staleSelection ? "Kalenderauswahl ist nicht mehr aktuell; bitte Kalender neu laden" : "Kalenderereignisse sind vorübergehend nicht erreichbar", events: [], connected: true, retrySafe: true, mockDataUsed: false, writesPerformed: false },
      { status: staleSelection ? 409 : 502, headers },
    );
  }
}
