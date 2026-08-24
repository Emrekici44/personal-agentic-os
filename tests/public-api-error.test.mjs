import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { publicApiError, publicConflict } from "../lib/public-api-error.ts";

test("public API errors keep actionable validation but redact runtime details", () => {
  assert.equal(publicApiError(new Error("Name muss 2–120 Zeichen haben"), "Sicherer Fehler"), "Name muss 2–120 Zeichen haben");
  assert.equal(publicApiError(new Error("Datenkonflikt: Eintrag wurde auf einem anderen Client geändert"), "Sicherer Fehler"), "Datenkonflikt: Eintrag wurde auf einem anderen Client geändert");
  assert.equal(publicApiError(new Error("SQLITE_BUSY: database C:\\private\\state.db is locked"), "Sicherer Fehler"), "Sicherer Fehler");
  assert.equal(publicApiError(new Error("access_token abc123"), "Sicherer Fehler"), "Sicherer Fehler");
  assert.equal(publicApiError(new Error("Unerwarteter interner Fehler"), "Sicherer Fehler"), "Sicherer Fehler");
  assert.equal(publicConflict(new Error("Datenkonflikt: neuere Version")), true);
  assert.equal(publicConflict(new Error("Datenbankfehler")), false);
});

test("private routes no longer return arbitrary Error.message values", async () => {
  const routeFiles = [
    "../app/api/state/archive/route.ts",
    "../app/api/state/backups/route.ts",
    "../app/api/state/preferences/[id]/route.ts",
    "../app/api/state/records/[kind]/route.ts",
    "../app/api/projects/[id]/workspace/route.ts",
    "../app/api/agents/workflows/route.ts",
    "../app/api/skills/route.ts",
    "../app/api/obsidian/write-proposals/route.ts",
    "../app/api/calendar/connect/route.ts",
    "../app/api/calendar/share-local-session/route.ts",
    "../app/api/calendar/write-proposal/route.ts",
    "../app/api/calendar/write/route.ts",
    "../app/api/calendar/today-summary/route.ts",
    "../app/api/calendar/events/route.ts",
    "../app/api/planner/route.ts",
  ];
  const combined = (await Promise.all(routeFiles.map((file) => readFile(new URL(file, import.meta.url), "utf8")))).join("\n");
  assert.doesNotMatch(combined, /error instanceof Error \? error\.message/);
  assert.match(combined, /publicApiError/);
  assert.match(combined, /status: staleSelection \? 409 : 502/);
  assert.match(combined, /Google-Tokenprüfung vor der Planung nicht erreichbar/);
  assert.match(combined, /Tageskalender ist vorübergehend nicht erreichbar/);
});
