import { NextRequest, NextResponse } from "next/server";
import { addCalendarDays, berlinDateKey, berlinLocalIso } from "@/lib/weekly-planner";
import { refreshedAccessToken } from "@/lib/google-calendar";
import { verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const respond = (body: unknown, init: ResponseInit = {}) => NextResponse.json(body, { ...init, headers });

export async function GET(request: NextRequest) {
  try {
    if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value))
      return respond({ error: "Lokale Sitzung erforderlich" }, { status: 401 });
    const token = await refreshedAccessToken(request.cookies.get("agentic_os_google_token")?.value);
    if (!token)
      return respond({ connected: false, status: "unconfigured", eventCount: null, writesPerformed: false });
    const day = berlinDateKey(new Date());
    const start = berlinLocalIso(day, 0, 0);
    const end = berlinLocalIso(addCalendarDays(day, 1), 0, 0);
    const listResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader", {
      headers: { authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (!listResponse.ok) throw new Error("Kalenderliste derzeit nicht lesbar");
    const list = await listResponse.json();
    const calendars = (Array.isArray(list.items) ? list.items : []).filter((item: any) => item.selected !== false).slice(0, 12);
    const counts = await Promise.all(calendars.map(async (calendar: any) => {
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`);
      url.search = new URLSearchParams({ timeMin: start, timeMax: end, singleEvents: "true", maxResults: "2500", fields: "items(id,start,end),nextPageToken" }).toString();
      const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Heutige Termine derzeit nicht lesbar");
      const data = await response.json();
      return { count: Array.isArray(data.items) ? data.items.length : 0, truncated: Boolean(data.nextPageToken) };
    }));
    return respond({
      connected: true,
      status: "online",
      date: day,
      timezone: "Europe/Berlin",
      eventCount: counts.reduce((sum, item) => sum + item.count, 0),
      calendarCount: calendars.length,
      complete: counts.every((item) => !item.truncated),
      titlesExposed: false,
      boundedDays: 1,
      writesPerformed: false,
    });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Tageskalender nicht verfügbar", writesPerformed: false }, { status: 502 });
  }
}
