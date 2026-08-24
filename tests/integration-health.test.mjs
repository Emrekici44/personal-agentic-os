import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("../app/api/integrations/health/route.ts", import.meta.url), "utf8");
const ui = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("integration health derives online states from real server checks", () => {
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /refreshedAccessToken/);
  assert.match(route, /readVaultPreview/);
  assert.match(route, /storeStatus/);
  assert.match(route, /providerPolicy/);
  assert.match(route, /privateRouteVerifiedHere/);
  assert.match(route, /requestHost\.toLowerCase\(\) === privateHost\.toLowerCase\(\)/);
  assert.match(route, /forwardedProto === "https"/);
  assert.doesNotMatch(route, /status:\s*"online"[^\n]+mock/i);
});

test("connector catalog exposes cost, scope, privacy, errors and reconnect truth", () => {
  for (const connector of ["google-calendar", "obsidian", "shared-store", "openai", "google-tasks", "health-local", "finance-local", "tailscale"]) assert.match(route, new RegExp(`id: "${connector}"`));
  for (const field of ["costClass", "classification", "lastSuccessfulSync", "currentAction", "recentError", "permissionScope", "privacy", "reconnect", "evidence"]) assert.match(route, new RegExp(field));
  assert.match(route, /paidActivationsPerformed: false/);
  assert.match(route, /externalWritesPerformed: false/);
  assert.match(route, /preciseUsageAvailable: false/);
  assert.match(route, /funnel: false/);
  assert.doesNotMatch(route, /clientSecret|access_token|refresh_token/);
});

test("health UI provides a real refresh and expandable evidence without activation", () => {
  for (const label of ["Health erneut prüfen", "Details & Wiederverbinden", "Verifizierte Evidenz anzeigen", "Kostenklasse", "Keine Zugangsdaten"]) assert.match(ui, new RegExp(label, "i"));
  assert.match(ui, /fetch\("\/api\/integrations\/health"/);
  assert.match(ui, /setSelectedConnectorId/);
  assert.doesNotMatch(ui.slice(ui.indexOf("function Integrations"), ui.indexOf("function Brain")), /Verbindung erfolgreich aktiviert|Plugin installiert|API aktiviert/i);
});
