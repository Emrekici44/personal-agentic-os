import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { privateApiFetch } from "../lib/private-client.ts";

test("private client accepts only bounded relative API requests", async () => {
  await assert.rejects(privateApiFetch("https://example.com/api/status"), /Nur relative private API-Pfade/);
  await assert.rejects(privateApiFetch("/usage"), /Nur relative private API-Pfade/);
  await assert.rejects(privateApiFetch("/api/state/status", {}, 31_000), /Ungültiges privates Request-Zeitlimit/);
});

test("private client ends a hanging request without leaking content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new Error("raw transport detail")), { once: true });
  });
  try {
    await assert.rejects(privateApiFetch("/api/state/status", {}, 50), /Private Quelle hat das Zeitlimit überschritten/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("core shared sources and standalone Usage use the bounded client", async () => {
  const [page, usage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/usage/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /privateApiFetch\('\/api\/state\/session'/);
  assert.match(page, /privateApiFetch\(`\/api\/state\/records\/\$\{kind\}`/);
  assert.match(page, /privateApiFetch\("\/api\/state\/preferences\/theme"/);
  assert.match(page, /privateApiFetch\("\/api\/state\/status"/);
  for (const endpoint of ["/api/agents/workflows", "/api/skills", "/api/planner", "/api/integrations/health", "/api/obsidian/status", "/api/state/backups", "/api/state/archive"]) {
    assert.match(page, new RegExp(`privateApiFetch\\("${endpoint.replaceAll("/", "\\/")}"`));
  }
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.doesNotMatch(usage, /\bfetch\(/);
  assert.match(page, /externalWrite\?"Write-Ergebnis ist nicht bestätigt/);
  for (const endpoint of ["/api/openai/status", "/api/integrations/health", "/api/state/backups", "/api/state/status"]) {
    assert.match(usage, new RegExp(`privateApiFetch\\("${endpoint.replaceAll("/", "\\/")}"`));
  }
});
