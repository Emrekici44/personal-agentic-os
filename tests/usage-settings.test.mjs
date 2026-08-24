import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, usage, store, css] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/usage/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("branding is a validated shared preference rather than a device-only claim", () => {
  assert.match(page, /api\/state\/preferences\/branding/);
  assert.match(page, /Branding gemeinsam gespeichert/);
  assert.match(page, /Branding gemeinsam speichern/);
  assert.match(store, /preferenceIds=\['theme','branding'\]/);
  assert.doesNotMatch(page, /Branding lokal gespeichert/);
});

test("usage center derives live integration, provider and storage evidence", () => {
  for (const endpoint of ["/api/openai/status", "/api/integrations/health", "/api/state/backups"]) assert.match(usage, new RegExp(endpoint.replaceAll("/", "\\/")));
  assert.match(usage, /Präzise Limits[\s\S]*Nicht über unterstützte API verfügbar/);
  assert.match(usage, /Deine Subscription wird nicht als API-Zugang ausgegeben/);
  assert.match(usage, /sensitiveFieldEncryption/);
  assert.doesNotMatch(usage, /Browser lokal|Google Calendar[\s\S]{0,120}Mock/);
});

test("usage evidence is invalidated while loading or offline", () => {
  assert.match(usage, /setState\(\{ loading: true, error: false, openai: null, integrations: \[\], storage: null, backups: \[\], checkedAt: null \}\)/);
  assert.match(usage, /setState\(\{ loading: false, error: true, openai: null, integrations: \[\], storage: null, backups: \[\], checkedAt: null \}\)/);
  assert.match(usage, /if \(!sessionResponse\.ok\) throw new Error\(\)/);
  assert.match(usage, /window\.addEventListener\("agentic-os:runtime-online", recover\)/);
  assert.match(usage, /verified \? state\.backups\.length : "—"/);
  assert.match(usage, /HARD KILL SWITCH[\s\S]*?NICHT VERIFIZIERT/);
  assert.match(usage, /Private Statusquelle nicht erreichbar/);
  assert.match(usage, /Connector-Status nicht erreichbar/);
  assert.match(css, /\.usageTopline>a\{[^}]*min-height:44px/);
  assert.match(css, /\.modeGrid article>a\{[^}]*min-height:44px/);
});

test("provider status remains signed, private and never exposes a key", async () => {
  const route = await readFile(new URL("../app/api/openai/status/route.ts", import.meta.url), "utf8");
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /no-store, private/);
  assert.match(route, /keyExposed: false/);
  assert.match(route, /usageSource: 'unavailable'/);
});

test("settings expose local backup and restore preview without an apply action", () => {
  assert.match(page, /Lokales Backup jetzt erstellen/);
  assert.match(page, /Integrität & Konflikte prüfen/);
  assert.match(page, /Restore bleibt bis zur exakten Freigabe gesperrt/);
  assert.match(page, /Das Backup enthält keinen Schlüssel und wird nicht hochgeladen/);
});

test("settings provide a private read-only recovery diagnosis without side effects", () => {
  for (const endpoint of ["/api/state/status", "/api/integrations/health", "/api/state/backups"]) assert.match(page, new RegExp(endpoint.replaceAll("/", "\\/")));
  for (const truth of ["DIAGNOSE · NUR LESEN", "Lokale Diagnose ausführen", "Kein Restore, kein Reconnect und kein externer Write", "Agentic OS über den Desktop-Shortcut neu starten", "Zum Health Center"]) assert.match(page, new RegExp(truth));
  assert.match(page, /externalWritesPerformed:false,restorePerformed:false/);
  assert.doesNotMatch(page, /apply_restore|executeRestore|restoreStore/);
  assert.match(css, /\.recoveryEvidence/);
  assert.match(css, /@media\(max-width:720px\)\{\.recoveryEvidence\{grid-template-columns:1fr/);
});
