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
  const routes = [
    "app/api/state/session/route.ts",
    "app/api/state/records/[kind]/route.ts",
    "app/api/state/preferences/[id]/route.ts",
    "app/api/state/backups/route.ts",
    "app/api/state/archive/route.ts",
    "app/api/state/migration-preview/route.ts",
    "app/api/agents/workflows/route.ts",
    "app/api/skills/route.ts",
    "app/api/planner/route.ts",
    "app/api/obsidian/write-proposals/route.ts",
    "app/api/calendar/share-local-session/route.ts",
    "app/api/calendar/write-proposal/route.ts",
    "app/api/calendar/write/route.ts",
  ];
  for (const route of routes) {
    const source = fs.readFileSync(path.join(root, route), "utf8");
    assert.match(source, /trustedPrivateMutationOrigin/);
  }
  const calendarWrite = fs.readFileSync(path.join(root, "app/api/calendar/write/route.ts"), "utf8");
  assert.ok(calendarWrite.indexOf("trustedPrivateMutationOrigin(request)") < calendarWrite.indexOf("await refreshedAccessToken"));
});
