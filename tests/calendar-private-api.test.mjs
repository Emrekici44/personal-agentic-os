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
  assert.match(status, /'unconfigured'/);
  assert.doesNotMatch(status, /mode:connected\?'google':c\.configured\?'oauth-ready':'mock'/);
  assert.match(calendars, /calendars:\[\]/);
  assert.match(calendars, /mockDataUsed:false/);
  assert.doesNotMatch(calendars, /MOCK_CALENDARS|Testdaten/);
  assert.match(events, /events:\[\]/);
  assert.match(events, /mockDataUsed:false/);
  assert.doesNotMatch(events, /readMockEvents|Testdaten/);
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
  assert.match(page, /const session = await fetch\("\/api\/state\/session"/);
  assert.match(page, /Keine verifizierten Kalender verfügbar\. Es werden keine Testkalender eingesetzt\./);
  assert.match(page, /window\.location\.assign\("\/api\/calendar\/connect"\)/);
});
