import { NextRequest, NextResponse } from "next/server";

import { refreshedAccessToken } from "@/lib/google-calendar";
import { googleRequestSignal } from "@/lib/google-transport";
import { verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };

export async function GET(request: NextRequest) {
  if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value)) {
    return NextResponse.json(
      { error: "Lokale Sitzung erforderlich", calendars: [] },
      { status: 401, headers },
    );
  }

  try {
    const token = await refreshedAccessToken(request.cookies.get("agentic_os_google_token")?.value);
    if (!token) {
      return NextResponse.json(
        {
          mode: "unavailable",
          connected: false,
          label: "Keine verifizierte Google-Verbindung",
          calendars: [],
          mockDataUsed: false,
          writesPerformed: false,
        },
        { status: 409, headers },
      );
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
      {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: googleRequestSignal(),
      },
    );
    if (!response.ok) throw new Error("Google Calendar konnte nicht gelesen werden");
    const data = await response.json();
    return NextResponse.json(
      {
        mode: "google",
        connected: true,
        label: "Google Calendar · Rollen verifiziert",
        calendars: (Array.isArray(data.items) ? data.items : []).map((calendar: any) => ({
          id: calendar.id,
          summary: calendar.summary,
          primary: Boolean(calendar.primary),
          selected: calendar.selected !== false,
          accessRole: calendar.accessRole,
          writable: ["writer", "owner"].includes(calendar.accessRole),
        })),
        mockDataUsed: false,
        writesPerformed: false,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        mode: "degraded",
        connectionCheck: "error",
        error: "Google-Kalenderkatalog vorübergehend nicht erreichbar",
        calendars: [],
        mockDataUsed: false,
        writesPerformed: false,
      },
      { status: 502, headers },
    );
  }
}
