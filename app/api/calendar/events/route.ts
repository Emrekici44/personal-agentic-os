import { NextRequest, NextResponse } from "next/server";
import { assertBoundedWindow } from "@/lib/calendar-core.mjs";
import { refreshedAccessToken } from "@/lib/google-calendar";
import { googleRequestSignal } from "@/lib/google-transport";
import { verifyLocalSession } from "@/lib/shared-store";
import { weeklyWindow } from "@/lib/weekly-planner";

const headers = { "Cache-Control": "no-store, private" };

export async function GET(req: NextRequest) {
  try {
    if (!verifyLocalSession(req.cookies.get("agentic_os_local_session")?.value)) {
      return NextResponse.json({ error: "Lokale Sitzung erforderlich", events: [] }, { status: 401, headers });
    }

    const calendarIds = [...new Set(req.nextUrl.searchParams.getAll("calendar"))].slice(0, 12);
    if (!calendarIds.length) {
      return NextResponse.json({ error: "Mindestens ein Kalender ist erforderlich", events: [] }, { status: 400, headers });
    }

    const window = weeklyWindow(new Date());
    assertBoundedWindow(window.start, window.end);
    const token = await refreshedAccessToken(req.cookies.get("agentic_os_google_token")?.value);
    if (!token) {
      return NextResponse.json(
        { mode: "unavailable", connected: false, error: "Google Calendar ist nicht verbunden", events: [], mockDataUsed: false, writesPerformed: false },
        { status: 409, headers },
      );
    }

    const batches = await Promise.all(
      calendarIds.map(async (id) => {
        const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`);
        url.search = new URLSearchParams({
          timeMin: window.start,
          timeMax: window.end,
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "100",
          fields: "items(id,summary,start,end)",
        }).toString();
        const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal: googleRequestSignal() });
        if (!response.ok) throw new Error("Google Terminabruf fehlgeschlagen");
        const data = await response.json();
        return (Array.isArray(data.items) ? data.items : [])
          .map((event: any) => ({
            id: event.id,
            calendarId: id,
            title: event.summary || "(Ohne Titel)",
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            kind: "calendar",
          }))
          .filter((event: any) => event.start && event.end);
      }),
    );

    return NextResponse.json(
      {
        mode: "google",
        connected: true,
        label: "Google Calendar · nur Lesen",
        events: batches.flat(),
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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ungültige Anfrage", events: [] }, { status: 400, headers });
  }
}
