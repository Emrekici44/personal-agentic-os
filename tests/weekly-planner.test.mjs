import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildWeeklyPlan, weeklyWindow } from "../lib/weekly-planner.ts";
import { validateWeeklyPlan, validateWeeklyReview } from "../lib/shared-store.ts";

const calendars = [
  { id: "work", summary: "Arbeit", writable: false },
  { id: "training", summary: "Training", writable: true },
  { id: "projects", summary: "Project", writable: true },
];

test("weekly planner uses at most three real outcomes and keeps a 35 percent buffer", () => {
  const plan = buildWeeklyPlan({
    now: new Date("2026-08-23T08:00:00Z"),
    calendars,
    selectedCalendarIds: calendars.map((calendar) => calendar.id),
    events: [
      { id: "training-1", calendarId: "training", calendarName: "Training", title: "Krafttraining", start: "2026-08-24T17:00:00+02:00", end: "2026-08-24T18:30:00+02:00" },
      { id: "work-1", calendarId: "work", calendarName: "Arbeit", title: "Arbeit + Pendeln", start: "2026-08-25T06:30:00+02:00", end: "2026-08-25T16:00:00+02:00" },
    ],
    tasks: [
      { id: "t1", title: "Wichtiges Ergebnis", status: "active", priority: "high", done: false },
      { id: "t2", title: "Zweites Ergebnis", status: "active", done: false },
      { id: "t3", title: "Drittes Ergebnis", status: "active", done: false },
      { id: "t4", title: "Viertes Ergebnis", status: "active", done: false },
    ],
    inbox: [],
    projects: [],
  });
  assert.equal(plan.timezone, "Europe/Berlin");
  assert.equal(plan.capacity.bufferPercent, 35);
  assert.ok(plan.outcomes.length <= 3);
  assert.ok(plan.blocks.length <= 3);
  assert.ok(plan.capacity.scheduledMinutes <= plan.capacity.focusBudgetMinutes);
  assert.ok(plan.blocks.every((block) => block.status === "proposal" && block.writesPerformed === false));
  assert.ok(plan.blocks.every((block) => !block.start.startsWith("2026-08-24")), "training day must remain focus-free");
  assert.equal(plan.backgroundWrites, false);
  assert.equal(plan.writesPerformed, false);
});

test("weekly planner stays proposal-only when no selected calendar is writable", () => {
  const plan = buildWeeklyPlan({
    now: new Date("2026-08-23T08:00:00Z"),
    calendars: [{ id: "read", summary: "Nur lesen", writable: false }],
    selectedCalendarIds: ["read"],
    events: [],
    tasks: [{ id: "t1", title: "Echtes Ziel", status: "active", done: false }],
    inbox: [],
    projects: [],
  });
  assert.equal(plan.outcomes.length, 1);
  assert.deepEqual(plan.blocks, []);
  assert.equal(plan.writableTargetAvailable, false);
});

test("Berlin calendar windows remain eight local days across both DST changes", () => {
  const spring = weeklyWindow(new Date("2026-03-27T20:00:00Z"));
  const autumn = weeklyWindow(new Date("2026-10-23T20:00:00Z"));
  assert.equal(spring.startDay, "2026-03-27");
  assert.equal(spring.endDay, "2026-04-04");
  assert.equal((Date.parse(spring.end) - Date.parse(spring.start)) / 3_600_000, 191);
  assert.equal(autumn.startDay, "2026-10-23");
  assert.equal(autumn.endDay, "2026-10-31");
  assert.equal((Date.parse(autumn.end) - Date.parse(autumn.start)) / 3_600_000, 193);
});

test("empty sources stay honestly empty and duplicate calendar selection is normalized", () => {
  const plan = buildWeeklyPlan({ now: new Date("2026-08-24T08:00:00Z"), calendars, selectedCalendarIds: ["projects", "projects"], events: [], tasks: [], inbox: [], projects: [] });
  assert.deepEqual(plan.outcomes, []);
  assert.deepEqual(plan.blocks, []);
  assert.equal(plan.sourceEvidence.selectedCalendarCount, 1);
  assert.deepEqual(plan.constraints.selectedCalendarIds, ["projects"]);
  assert.equal(plan.protections.find((item) => item.id === "faith").status, "not_verified");
  assert.equal(plan.protections.find((item) => item.id === "relationships").status, "not_verified");
});

test("foreign calendars and unsafe block constraints are rejected", () => {
  assert.throws(() => buildWeeklyPlan({ now: new Date("2026-08-24T08:00:00Z"), calendars, selectedCalendarIds: ["foreign"], events: [], tasks: [], inbox: [], projects: [] }), /Unbekannter Kalender/);
  const plan = buildWeeklyPlan({ now: new Date("2026-08-24T08:00:00Z"), calendars, selectedCalendarIds: ["projects"], events: [], tasks: [{ id: "t1", title: "Ziel", status: "active" }], inbox: [], projects: [] });
  assert.doesNotThrow(() => validateWeeklyPlan(plan));
  assert.throws(() => validateWeeklyPlan({ ...plan, blocks: [{ ...plan.blocks[0], start: plan.constraints.windowEnd, end: new Date(Date.parse(plan.constraints.windowEnd) + 3_600_000).toISOString() }] }), /außerhalb/);
  const overlapping = { ...plan, blocks: [plan.blocks[0], { ...plan.blocks[0], id: "second", outcomeId: plan.outcomes[0].id }] };
  assert.throws(() => validateWeeklyPlan(overlapping), /überschneiden/);
});

test("review rejects empty, duplicate and foreign selections before persistence", () => {
  const current = { outcomes: [{ id: "o1" }], blocks: [{ id: "b1", outcomeId: "o1" }] };
  assert.deepEqual(validateWeeklyReview(current, { selectedOutcomeIds: ["o1"], selectedBlockIds: ["b1"] }), { selectedOutcomeIds: ["o1"], selectedBlockIds: ["b1"] });
  assert.throws(() => validateWeeklyReview(current, { selectedOutcomeIds: [], selectedBlockIds: [] }), /Mindestens/);
  assert.throws(() => validateWeeklyReview(current, { selectedOutcomeIds: ["o1", "o1"], selectedBlockIds: [] }), /Doppelte/);
  assert.throws(() => validateWeeklyReview(current, { selectedOutcomeIds: ["foreign"], selectedBlockIds: [] }), /fremde IDs/);
});

test("Google read adapter filters incomplete events and normalizes all-day events", async () => {
  const source = await readFile(new URL("../lib/google-calendar-read.ts", import.meta.url), "utf8");
  assert.match(source, /event\?\.start\?\.date && event\?\.end\?\.date/);
  assert.match(source, /Date\.parse\(end\) <= Date\.parse\(start\)/);
  assert.match(source, /new Set\(calendarIds\.map\(String\)\)/);
  assert.match(source, /Unbekannter Kalender ausgewählt/);
  assert.match(source, /\.filter\(Boolean\)/);
});

test("weekly plan persistence is versioned, encrypted and approval-linked", async () => {
  const [store, route] = await Promise.all([
    readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/planner/route.ts", import.meta.url), "utf8"),
  ]);
  for (const table of ["weekly_plans", "weekly_outcomes", "focus_proposals"]) assert.match(store, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(store, /approval_ref TEXT,audit_ref TEXT/);
  assert.match(store, /outcomes\.length>3/);
  assert.match(store, /buffer<30\|\|buffer>40/);
  assert.match(store, /Europe\/Berlin/);
  assert.match(store, /backgroundWrites!==false/);
  assert.match(store, /BEGIN IMMEDIATE/);
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /readGoogleCalendarWindow/);
  assert.match(route, /listRecords\("tasks"\)/);
  assert.match(route, /listRecords\("inbox_items"\)/);
  assert.match(route, /listRecords\("projects"\)/);
  assert.match(route, /rawEventDetailsExposed: false/);
  assert.match(route, /weeklyWindow\(new Date\(\)\)/);
  assert.match(route, /Cache-Control.*no-store, private/);
  assert.match(route, /const respond = .*NextResponse\.json\(body, \{ \.\.\.init, headers \}\)/);
  assert.doesNotMatch(route, /return NextResponse\.json/);
});

test("weekly planner UI is guided and keeps writes behind the exact approval stage", async () => {
  const [page, proposalRoute, writeRoute, tokenStore] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/calendar/write-proposal/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/calendar/write/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/google-calendar.ts", import.meta.url), "utf8"),
  ]);
  for (const text of ["SONNTAGSRESET · 11:00–11:30", "Echten Vorschlag erzeugen", "Review speichern", "Exakte Write-Freigabe", "DIESEN_TERMIN_JETZT_SCHREIBEN"]) assert.match(page, new RegExp(text, "i"));
  assert.match(page, /href={`#\$\{id}`}/);
  assert.match(proposalRoute, /verifyLocalSession/);
  assert.match(writeRoute, /verifyLocalSession/);
  assert.match(tokenStore, /refresh_token/);
  assert.match(tokenStore, /storeTokenBundle\(JSON\.stringify\(next\)\)/);
});
