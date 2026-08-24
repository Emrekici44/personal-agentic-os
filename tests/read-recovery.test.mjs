import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = [
  "../app/api/state/status/route.ts",
  "../app/api/state/audit/route.ts",
  "../app/api/state/archive/route.ts",
  "../app/api/state/backups/route.ts",
  "../app/api/state/preferences/[id]/route.ts",
  "../app/api/state/records/[kind]/route.ts",
  "../app/api/skills/route.ts",
  "../app/api/agents/workflows/route.ts",
  "../app/api/planner/route.ts",
  "../app/api/projects/[id]/workspace/route.ts",
];

test("private read APIs return structured cache-free recovery instead of framework failures", async () => {
  const sources = await Promise.all(routes.map((file) => readFile(new URL(file, import.meta.url), "utf8")));
  for (const source of sources) {
    assert.match(source, /no-store, private/);
    assert.match(source, /status:[^}\n]*503/);
    assert.match(source, /retrySafe:\s*true|retrySafe:\s*message === fallback/);
    assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
  }
});

test("unavailable inventories are explicitly unverified and emptied", async () => {
  const sources = await Promise.all(routes.slice(1, 9).map((file) => readFile(new URL(file, import.meta.url), "utf8")));
  const combined = sources.join("\n");
  for (const marker of ["entries: []", "records: []", "backups: []", "definitions: []", "runs: []", "history: []", "inventoryVerified: false"]) {
    assert.match(combined, new RegExp(marker.replace(/[\[\]]/g, "\\$&")));
  }
  assert.doesNotMatch(combined, /mockDataUsed:\s*true|Beispieldaten/);
});
