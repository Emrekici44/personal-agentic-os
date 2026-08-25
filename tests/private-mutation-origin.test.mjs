import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { trustedPrivateMutationOrigin } from "../lib/private-request.ts";

const root = process.cwd();

test("private mutation origin accepts local and private-proxy same-origin requests", () => {
  assert.equal(trustedPrivateMutationOrigin(new Request("http://127.0.0.1:3000/api/state/records/tasks", {
    method: "POST",
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-origin" },
  })), true);
  assert.equal(trustedPrivateMutationOrigin(new Request("http://127.0.0.1:3000/api/state/records/tasks", {
    method: "POST",
    headers: { host: "agentic-os.example.ts.net", origin: "https://agentic-os.example.ts.net", "x-forwarded-proto": "https", "sec-fetch-site": "same-origin" },
  })), true);
  assert.equal(trustedPrivateMutationOrigin(new Request("http://127.0.0.1:3000/api/state/records/tasks", { method: "POST" })), true);
});

test("private mutation origin rejects cross-site, mismatched and opaque origins", () => {
  const base = "http://127.0.0.1:3000/api/state/records/tasks";
  assert.equal(trustedPrivateMutationOrigin(new Request(base, { method: "POST", headers: { host: "127.0.0.1:3000", origin: "https://evil.example", "sec-fetch-site": "cross-site" } })), false);
  assert.equal(trustedPrivateMutationOrigin(new Request(base, { method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://localhost:3000", "sec-fetch-site": "same-site" } })), false);
  assert.equal(trustedPrivateMutationOrigin(new Request(base, { method: "POST", headers: { host: "127.0.0.1:3000", origin: "null" } })), false);
  assert.equal(trustedPrivateMutationOrigin(new Request(base, { method: "POST", headers: { host: "127.0.0.1:3000", origin: "://invalid" } })), false);
});

test("every active private mutation route checks origin before body or external work", () => {
  const routes = new Map([
    ["app/api/state/session/route.ts", ["POST"]],
    ["app/api/state/records/[kind]/route.ts", ["POST", "PATCH", "DELETE"]],
    ["app/api/state/preferences/[id]/route.ts", ["PUT"]],
    ["app/api/state/backups/route.ts", ["POST", "PATCH"]],
    ["app/api/state/archive/route.ts", ["PATCH"]],
    ["app/api/state/migration-preview/route.ts", ["POST"]],
    ["app/api/agents/workflows/route.ts", ["POST", "PATCH"]],
    ["app/api/skills/route.ts", ["POST", "PATCH"]],
    ["app/api/planner/route.ts", ["POST", "PATCH"]],
    ["app/api/obsidian/write-proposals/route.ts", ["POST", "PATCH"]],
    ["app/api/calendar/share-local-session/route.ts", ["POST"]],
    ["app/api/calendar/write-proposal/route.ts", ["POST"]],
    ["app/api/calendar/write/route.ts", ["POST"]],
  ]);
  for (const [route, methods] of routes) {
    const source = fs.readFileSync(path.join(root, route), "utf8");
    for (const method of methods) {
      const marker = `export async function ${method}`;
      const start = source.indexOf(marker);
      assert.notEqual(start, -1, `${route} ${method} exists`);
      const next = source.indexOf("export async function ", start + marker.length);
      const block = source.slice(start, next < 0 ? source.length : next);
      assert.match(block, /trustedPrivateMutationOrigin/, `${route} ${method} checks origin`);
      const originIndex = block.indexOf("trustedPrivateMutationOrigin");
      const bodyIndex = block.indexOf("readPrivateJson");
      if (bodyIndex >= 0) assert.ok(originIndex < bodyIndex, `${route} ${method} checks origin before body`);
    }
  }
  const calendarWrite = fs.readFileSync(path.join(root, "app/api/calendar/write/route.ts"), "utf8");
  assert.ok(calendarWrite.indexOf("trustedPrivateMutationOrigin(request)") < calendarWrite.indexOf("await refreshedAccessToken"));
});
