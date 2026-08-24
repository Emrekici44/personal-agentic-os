import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, usage, store] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/usage/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8"),
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
