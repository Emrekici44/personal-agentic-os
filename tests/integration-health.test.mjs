import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("../app/api/integrations/health/route.ts", import.meta.url), "utf8");
const ui = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("integration health derives online states from real server checks", () => {
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /refreshedAccessToken/);
  assert.match(route, /catch \{ calendarError = "Google-Tokenprüfung vorübergehend nicht erreichbar"; \}/);
  assert.match(route, /connectionCheck: calendarError \? "error" : "complete"/);
  assert.match(route, /recentError: calendarConnected \? null : calendarError/);
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
  for (const label of ["Health erneut prüfen", "Details & sichere Schritte", "Verifizierte Evidenz anzeigen", "Kostenklasse", "Keine Zugangsdaten", "Nicht konfiguriert", "Eingeschränkt"]) assert.match(ui, new RegExp(label, "i"));
  assert.doesNotMatch(ui, />Details & Wiederverbinden</);
  assert.match(ui, /privateApiFetch\("\/api\/integrations\/health"/);
  assert.match(ui, /setSelectedConnectorId/);
  assert.doesNotMatch(ui.slice(ui.indexOf("function Integrations"), ui.indexOf("function Brain")), /Verbindung erfolgreich aktiviert|Plugin installiert|API aktiviert/i);
  for (const term of ["Kostenfrei", "Nutzungsbasiert", "Ungeklärt", "Direkte API", "Lokaler Adapter", "Privates Netzwerk", "Berechtigungen"]) assert.match(ui, new RegExp(term));
  assert.doesNotMatch(ui, /CONNECTOR CONTRACT · \{selectedConnector\.classification\}|opaque IDs/);
});

test("calendar recovery keeps status, token check and catalog evidence separate", async () => {
  const statusRoute = await readFile(new URL("../app/api/calendar/status/route.ts", import.meta.url), "utf8");
  assert.match(statusRoute, /connectionCheck: "complete" \| "error"/);
  assert.match(statusRoute, /recentError = "Google-Tokenprüfung vorübergehend nicht erreichbar"/);
  assert.match(statusRoute, /connectionCheck === "error"/);
  assert.match(ui, /catalogState=calendarsResponse\.ok\?"online":statusResult\.connected\?"error":"unavailable"/);
  assert.match(ui, /calendarStatus\.connectionCheck !== "error" && calendarStatus\.configured/);
  assert.match(ui, /Der Kalenderkatalog wird erst nach einer verifizierten Verbindung gelesen/);
  assert.match(ui, /Tokenstatus erneut prüfen/);
});

test("integration and calendar evidence recover together without starting OAuth or writes", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /agentic-os:runtime-online[\s\S]*recoverIntegrations/);
  assert.match(page, /recoverIntegrations[\s\S]*loadCalendarState\(\)[\s\S]*loadIntegrationHealth\(\)/);
  assert.match(page, /Integrationsstatus neu laden/);
  assert.match(page, /onRetry=\{loadIntegrationHealth\}/);
  const recoveryBlock = page.match(/const recoverIntegrations[\s\S]*?window\.addEventListener\("agentic-os:runtime-online", recoverIntegrations\)/)?.[0] || "";
  assert.doesNotMatch(recoveryBlock, /beginCalendarConnect|window\.location|readWeek|write|approve/i);
});
