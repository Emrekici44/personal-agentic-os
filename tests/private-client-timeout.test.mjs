import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { PRIVATE_RESPONSE_LIMIT_BYTES, privateApiFetch } from "../lib/private-client.ts";

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

test("private client keeps the response body inside the same deadline", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) => Promise.resolve(new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"online":'));
      init?.signal?.addEventListener("abort", () => controller.error(new Error("raw streamed body detail")), { once: true });
    },
  }), { headers: { "content-type": "application/json" }, status: 200 }));
  try {
    await assert.rejects(privateApiFetch("/api/state/status", {}, 50), /Private Quelle hat das Zeitlimit überschritten/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("private client returns a buffered same-origin response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(Response.json({ online: true }, { headers: { "cache-control": "no-store" } }));
  try {
    const response = await privateApiFetch("/api/state/status", {}, 100);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { online: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("private client rejects a declared response above the local size boundary", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response(null, { headers: { "content-length": String(PRIVATE_RESPONSE_LIMIT_BYTES + 1) } }));
  try {
    await assert.rejects(privateApiFetch("/api/state/status", {}, 100), /Private Antwort überschreitet das Größenlimit/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("private client stops an undeclared oversized response while streaming", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(PRIVATE_RESPONSE_LIMIT_BYTES));
      controller.enqueue(new Uint8Array(1));
      controller.close();
    },
  })));
  try {
    await assert.rejects(privateApiFetch("/api/state/status", {}, 500), /Private Antwort überschreitet das Größenlimit/);
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
