import { assertBoundedWindow } from "./calendar-core.mjs";
import { berlinLocalIso } from "./weekly-planner";

export async function readCalendarCatalog(access: string) {
  const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader", { headers: { authorization: `Bearer ${access}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Google-Kalenderliste konnte nicht gelesen werden");
  const data = await response.json();
  return (data.items || []).map((calendar: any) => ({ id: calendar.id, summary: calendar.summary || "(Ohne Namen)", primary: Boolean(calendar.primary), selected: calendar.selected !== false, accessRole: calendar.accessRole, writable: ["writer", "owner"].includes(calendar.accessRole) }));
}

export function normalizeGoogleEvent(event: any, calendarId: string, calendarName: string) {
  const allDay = Boolean(event?.start?.date && event?.end?.date);
  const start = allDay ? berlinLocalIso(String(event.start.date), 0, 0) : event?.start?.dateTime;
  const end = allDay ? berlinLocalIso(String(event.end.date), 0, 0) : event?.end?.dateTime;
  if (!event?.id || !start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start)) return null;
  return { id: String(event.id), calendarId, calendarName, title: String(event.summary || "(Ohne Titel)"), start: new Date(start).toISOString(), end: new Date(end).toISOString(), allDay };
}

export async function readGoogleCalendarWindow(access: string, calendarIds: string[], start: string, end: string, catalog: any[]) {
  assertBoundedWindow(start, end);
  const uniqueIds = [...new Set(calendarIds.map(String))];
  if (!uniqueIds.length || uniqueIds.length > 12) throw new Error("Bitte 1–12 Kalender auswählen");
  const allowed = new Map(catalog.map((calendar: any) => [String(calendar.id), calendar]));
  if (uniqueIds.some((id) => !allowed.has(id))) throw new Error("Unbekannter Kalender ausgewählt");
  const batches = await Promise.all(uniqueIds.map(async (id) => {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`);
    url.search = new URLSearchParams({ timeMin: new Date(start).toISOString(), timeMax: new Date(end).toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "100" }).toString();
    const response = await fetch(url, { headers: { authorization: `Bearer ${access}` }, cache: "no-store" });
    if (!response.ok) throw new Error("Google-Termine konnten nicht gelesen werden");
    const data = await response.json();
    return (data.items || []).map((event: any) => normalizeGoogleEvent(event, id, allowed.get(id)?.summary || "Kalender")).filter(Boolean);
  }));
  return batches.flat();
}
