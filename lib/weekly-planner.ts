import crypto from "node:crypto";

export const WEEKLY_TIMEZONE = "Europe/Berlin";
export const WEEKLY_BUFFER_PERCENT = 35;
export const WEEKLY_WINDOW_DAYS = 8;

type SourceRecord = Record<string, any>;
type CalendarInfo = { id: string; summary: string; primary?: boolean; writable?: boolean };
export type CalendarEvent = { id: string; calendarId: string; calendarName?: string; title: string; start: string; end: string; allDay?: boolean };

export const berlinDateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: WEEKLY_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
}).format(date);

export function addCalendarDays(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) throw new Error("Ungültiges Kalenderdatum");
  return new Date(Date.UTC(year, month - 1, date + amount, 12)).toISOString().slice(0, 10);
}

export function berlinLocalIso(day: string, hour: number, minute: number) {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date || hour < 0 || hour > 23 || minute < 0 || minute > 59) throw new Error("Ungültige Berlin-Lokalzeit");
  const requested = Date.UTC(year, month - 1, date, hour, minute);
  let instant = requested;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: WEEKLY_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(instant)).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    instant -= represented - requested;
  }
  const result = new Date(instant);
  const exactTime = new Intl.DateTimeFormat("en-GB", { timeZone: WEEKLY_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(result);
  if (berlinDateKey(result) !== day || exactTime !== `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`) throw new Error("Diese Berlin-Lokalzeit existiert wegen der Zeitumstellung nicht");
  return result.toISOString();
}

export function weeklyWindow(now = new Date()) {
  const startDay = berlinDateKey(now), endDay = addCalendarDays(startDay, WEEKLY_WINDOW_DAYS);
  return { startDay, endDay, start: berlinLocalIso(startDay, 0, 0), end: berlinLocalIso(endDay, 0, 0), days: WEEKLY_WINDOW_DAYS, timezone: WEEKLY_TIMEZONE };
}

const validInterval = (event: CalendarEvent) => Number.isFinite(Date.parse(event.start)) && Number.isFinite(Date.parse(event.end)) && Date.parse(event.end) > Date.parse(event.start);
const classifyTraining = (event: CalendarEvent) => /training|gym|kraft|sport|workout|push|pull|legs|laufen/i.test(`${event.calendarName || ""} ${event.title}`);
const classifyWork = (event: CalendarEvent) => /arbeit|work|schicht|pendel|commute/i.test(`${event.calendarName || ""} ${event.title}`);
const classifyFaith = (event: CalendarEvent) => /glaube|faith|gebet|prayer|moschee|quran|koran|jumu|freitagsgebet/i.test(`${event.calendarName || ""} ${event.title}`);
const classifyRelationship = (event: CalendarEvent) => /beziehung|relationship|famil|freund|partner|date|geburtstag|birthday/i.test(`${event.calendarName || ""} ${event.title}`);
const overlaps = (start: string, end: string, event: Pick<CalendarEvent, "start" | "end">) => Date.parse(start) < Date.parse(event.end) && Date.parse(end) > Date.parse(event.start);

function rankSources(tasks: SourceRecord[], inbox: SourceRecord[], projects: SourceRecord[], now: Date) {
  const reference = now.getTime();
  const taskCandidates = tasks.filter((task) => !task.done && task.status !== "archived").map((task) => {
    const dueTime = Date.parse(task.dueAt || task.due_at || "");
    const dueSoon = Number.isFinite(dueTime) && dueTime >= reference && dueTime <= reference + WEEKLY_WINDOW_DAYS * 86_400_000;
    const priority = String(task.priority || "").toLowerCase();
    return { id: `task:${task.id}`, sourceId: task.id, sourceKind: "task", title: task.title, area: task.area || task.life_area || "Nicht zugeordnet", reason: dueSoon ? "In den nächsten 8 Tagen fällig" : "Offene gemeinsame Aufgabe", score: 100 + (priority === "high" ? 30 : priority === "medium" ? 15 : 0) + (dueSoon ? 25 : 0) };
  });
  const projectCandidates = projects.filter((project) => project.status !== "archived").map((project) => ({ id: `project:${project.id}`, sourceId: project.id, sourceKind: "project", title: project.nextAction || project.title, area: "Projekte", reason: project.nextAction ? `Nächster Schritt in ${project.title}` : "Aktives gemeinsames Projekt", score: project.nextAction ? 80 : 55 }));
  const inboxCandidates = inbox.filter((item) => item.status === "active").map((item) => ({ id: `inbox:${item.id}`, sourceId: item.id, sourceKind: "inbox", title: item.title, area: item.area || "Inbox", reason: "Noch nicht triagierter gemeinsamer Eingang", score: 35 }));
  const seen = new Set<string>();
  return [...taskCandidates, ...projectCandidates, ...inboxCandidates]
    .filter((item) => item.title && !seen.has(item.id) && seen.add(item.id))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "de"))
    .slice(0, 3).map((item) => ({ id: item.id, sourceId: item.sourceId, sourceKind: item.sourceKind, title: item.title, area: item.area, reason: item.reason }));
}

export function buildWeeklyPlan(input: { now?: Date; calendars: CalendarInfo[]; selectedCalendarIds: string[]; events: CalendarEvent[]; tasks: SourceRecord[]; inbox: SourceRecord[]; projects: SourceRecord[] }) {
  const now = input.now || new Date(), window = weeklyWindow(now), selectedIds = [...new Set(input.selectedCalendarIds)];
  const knownIds = new Set(input.calendars.map((calendar) => calendar.id));
  if (selectedIds.some((id) => !knownIds.has(id))) throw new Error("Unbekannter Kalender ausgewählt");
  const selected = input.calendars.filter((calendar) => selectedIds.includes(calendar.id));
  const writableTarget = selected.find((calendar) => calendar.writable && /project|projekt|fokus|focus/i.test(calendar.summary)) || selected.find((calendar) => calendar.writable && calendar.primary) || selected.find((calendar) => calendar.writable);
  const events = input.events.filter(validInterval).filter((event) => Date.parse(event.start) < Date.parse(window.end) && Date.parse(event.end) > Date.parse(window.start));
  const trainingEvents = events.filter(classifyTraining), trainingDays = [...new Set(trainingEvents.map((event) => berlinDateKey(new Date(event.start))))];
  const slots: Array<{ start: string; end: string; day: string }> = [];
  for (let offset = 0; offset < WEEKLY_WINDOW_DAYS; offset += 1) {
    const day = addCalendarDays(window.startDay, offset), noon = new Date(berlinLocalIso(day, 12, 0));
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: WEEKLY_TIMEZONE }).format(noon);
    if (trainingDays.includes(day) || weekday === "Fri" || weekday === "Sun") continue;
    const [hour, minute] = weekday === "Sat" ? [10, 0] : [17, 30], start = berlinLocalIso(day, hour, minute), end = new Date(Date.parse(start) + 90 * 60_000).toISOString();
    if (!events.some((event) => overlaps(start, end, event))) slots.push({ start, end, day });
  }
  const outcomes = rankSources(input.tasks, input.inbox, input.projects, now), availableMinutes = slots.length * 90;
  const focusBudgetMinutes = Math.floor(availableMinutes * (1 - WEEKLY_BUFFER_PERCENT / 100)), blockLimit = Math.min(outcomes.length, slots.length, Math.floor(focusBudgetMinutes / 90), 3);
  const blocks = writableTarget ? outcomes.slice(0, blockLimit).map((outcome, index) => ({ id: crypto.randomUUID(), outcomeId: outcome.id, title: `Fokus: ${outcome.title}`, start: slots[index].start, end: slots[index].end, timezone: WEEKLY_TIMEZONE, calendarId: writableTarget.id, calendarName: writableTarget.summary, status: "proposal", writesPerformed: false })) : [];
  const evidence = (id: string, label: string, matched: CalendarEvent[], missing: string) => ({ id, label, status: matched.length ? "verified" : "not_verified", evidenceCount: matched.length, detail: matched.length ? `${matched.length} belegte Kalenderereignisse berücksichtigt` : missing });
  return {
    weekStart: window.startDay, windowEnd: window.endDay, timezone: WEEKLY_TIMEZONE, outcomes, blocks,
    capacity: { availableMinutes, focusBudgetMinutes, scheduledMinutes: blocks.length * 90, bufferPercent: WEEKLY_BUFFER_PERCENT },
    sourceEvidence: { calendarMode: "google", selectedCalendarCount: selected.length, eventCount: events.length, taskCount: input.tasks.length, inboxCount: input.inbox.length, projectCount: input.projects.length },
    protections: [
      { id: "outcome-limit", label: "Maximal 3 Wochenziele", status: "verified", evidenceCount: outcomes.length, detail: `${outcomes.length} von maximal 3 gewählt` },
      { id: "buffer", label: "35% Planungspuffer", status: "verified", evidenceCount: WEEKLY_BUFFER_PERCENT, detail: "Aus freien Kandidatenzeiten berechnet" },
      evidence("training", "Trainingstage ohne Deep Work", trainingEvents, "Keine Trainingstermine in den gewählten Kalendern erkannt"),
      evidence("work", "Arbeits- und Pendelzeiten belegt", events.filter(classifyWork), "Arbeits-/Pendeltermine nicht verifiziert"),
      evidence("faith", "Glaubenspraxis nicht überplant", events.filter(classifyFaith), "Keine Glaubensereignisse in den gewählten Kalendern verifiziert"),
      evidence("relationships", "Beziehungszeit nicht überplant", events.filter(classifyRelationship), "Keine Beziehungsereignisse in den gewählten Kalendern verifiziert"),
      { id: "weekly-rest", label: "Freitagabend und Sonntag geschützt", status: "verified", evidenceCount: 2, detail: "Diese Tage erhalten generatorseitig keine Fokusblöcke" },
    ],
    constraints: { windowStart: window.start, windowEnd: window.end, selectedCalendarIds: selectedIds, trainingDays, busyIntervals: events.map((event) => ({ start: event.start, end: event.end })) },
    writableTargetAvailable: Boolean(writableTarget), backgroundWrites: false, writesPerformed: false,
  };
}
