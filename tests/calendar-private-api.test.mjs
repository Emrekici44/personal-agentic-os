import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = (name) => readFile(new URL(`../app/api/calendar/${name}/route.ts`, import.meta.url), "utf8");

test("calendar status, catalogs, reads and OAuth entry require the signed local session", async () => {
  for (const name of ["status", "calendars", "events", "connect", "share-local-session"]) {
    const source = await route(name);
    assert.match(source, /verifyLocalSession/);
    assert.match(source, /agentic_os_local_session/);
    assert.match(source, /Lokale Sitzung erforderlich/);
    assert.match(source, /no-store, private/);
  }
});

test("disconnected production calendar routes return honest empty states, never mock events", async () => {
  const [status, calendars, events] = await Promise.all([route("status"), route("calendars"), route("events")]);
  assert.match(status, /["']unconfigured["']/);
  assert.match(status, /connectionCheck/);
  assert.match(status, /["']degraded["']/);
  assert.doesNotMatch(status, /mode:connected\?'google':c\.configured\?'oauth-ready':'mock'/);
  assert.match(calendars, /calendars:\s*\[\]/);
  assert.match(calendars, /mockDataUsed:\s*false/);
  assert.doesNotMatch(calendars, /MOCK_CALENDARS|Testdaten/);
  assert.match(events, /events:\s*\[\]/);
  assert.match(events, /mockDataUsed:\s*false/);
  assert.doesNotMatch(events, /readMockEvents|Testdaten/);
});

test("bounded calendar reads use the server-side Europe Berlin window", async () => {
  const [events, adapter, page] = await Promise.all([
    route("events"),
    readFile(new URL("../lib/google-calendar-read.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(events, /weeklyWindow\(new Date\(\)\)/);
  assert.match(events, /assertBoundedWindow\(window\.start, window\.end\)/);
  assert.match(events, /readGoogleCalendarWindow\(token, calendarIds, window\.start, window\.end, catalog\)/);
  assert.match(adapter, /timeMin: new Date\(start\)\.toISOString\(\)/);
  assert.match(adapter, /timeMax: new Date\(end\)\.toISOString\(\)/);
  assert.match(events, /timezone: window\.timezone/);
  assert.match(events, /new Set\(req\.nextUrl\.searchParams\.getAll\("calendar"\)\)/);
  assert.doesNotMatch(page, /new URLSearchParams\(\{ start: start\.toISOString\(\), end: end\.toISOString\(\) \}\)/);
  assert.match(page, /calendarRead\.boundedDays[\s\S]*calendarRead\.timezone/);
});

test("retired calendar mock endpoints cannot approve or propose anything", async () => {
  for (const name of ["approve", "proposals"]) {
    const source = await route(name);
    assert.match(source, /verifyLocalSession/);
    assert.match(source, /status:410/);
    assert.match(source, /retired:true/);
    assert.match(source, /writesPerformed:false/);
    assert.doesNotMatch(source, /validateApproval|proposeFocusBlocks|readMockEvents/);
  }
});

test("calendar UI creates the private session before protected reads and shows no-test-data truth", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const session = await privateApiFetch\("\/api\/state\/session"/);
  assert.match(page, /Die verifizierte Kalenderliste ist leer\. Es werden keine Ersatzkalender eingesetzt\./);
  assert.match(page, /calendarStatus\.state === "loading" \? "STATUS WIRD GEPRÜFT"/);
  assert.match(page, /calendarStatus\.state === "error" \? "Offline"/);
  assert.doesNotMatch(page, /TESTADAPTER/);
  assert.match(page, /window\.location\.assign\("\/api\/calendar\/connect"\)/);
  assert.match(page, /OAuth wurde nicht geöffnet/);
  assert.match(page, /Lokale Calendar-Übernahme nicht bestätigt; Status vor erneutem Versuch prüfen/);
  assert.match(page, /onClick=\{beginCalendarConnect\}/);
  assert.match(page, /onClick=\{shareCalendarSession\}/);
});

test("OAuth redirects are cache-free and consume the short-lived state cookie", async () => {
  const [connect, callback] = await Promise.all([route("connect"), route("callback")]);
  assert.match(connect, /response\.headers\.set\("Cache-Control", "no-store, private"\)/);
  assert.match(connect, /httpOnly: true/);
  assert.match(connect, /maxAge: 600/);
  assert.match(callback, /const protectRedirect/);
  assert.match(callback, /response\.headers\.set\("Cache-Control", "no-store, private"\)/);
  assert.equal((callback.match(/response\.cookies\.delete\("agentic_os_oauth_state"\)/g) || []).length, 2);
  assert.match(callback, /open\(stored\) !== state/);
});

test("every Google transport is time-bounded and catalog failures stay private", async () => {
  const files = await Promise.all([
    readFile(new URL("../lib/google-calendar.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/google-calendar-read.ts", import.meta.url), "utf8"),
    route("calendars"),
    route("callback"),
    route("events"),
    route("today-summary"),
    route("write"),
  ]);
  const helper = await readFile(new URL("../lib/google-transport.ts", import.meta.url), "utf8");
  assert.match(helper, /GOOGLE_REQUEST_TIMEOUT_MS = 8_000/);
  assert.match(helper, /AbortSignal\.timeout\(GOOGLE_REQUEST_TIMEOUT_MS\)/);
  for (const [index, source] of files.entries()) {
    if (index === 4) {
      assert.match(source, /readCalendarCatalog/);
      assert.match(source, /readGoogleCalendarWindow/);
      continue;
    }
    assert.match(source, /googleRequestSignal/);
    for (const call of source.matchAll(/fetch\([\s\S]*?\)/g)) {
      if (/googleapis|oauth2\.google/.test(call[0])) assert.match(source, /signal:\s*googleRequestSignal\(\)/);
    }
  }
  const catalog = files[2];
  assert.match(catalog, /Google-Kalenderkatalog vorübergehend nicht erreichbar/);
  assert.match(catalog, /connectionCheck: "error"/);
  assert.match(catalog, /writesPerformed: false/);
  assert.doesNotMatch(catalog, /error\.message|String\(error\)/);
});
