import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { readPrivateJson } from "../lib/private-request.ts";

test("private JSON reader accepts a bounded object", async () => {
  const request = new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "preview" }),
  });
  assert.deepEqual(await readPrivateJson(request), { action: "preview" });
});

test("private JSON reader rejects wrong types and oversized bodies before parsing", async () => {
  await assert.rejects(readPrivateJson(new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "{}",
  })), /JSON-Inhalt erwartet/);
  await assert.rejects(readPrivateJson(new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-length": "999", "content-type": "application/json" },
    body: "{}",
  }), 256), /Inhalt ist zu groß/);
});

test("private JSON reader ends an incomplete body stream", async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"action":')); } });
  const request = new Request("http://localhost/api/test", { method: "POST", headers: { "content-type": "application/json" }, body, duplex: "half" });
  await assert.rejects(readPrivateJson(request, 1024, 25), /nicht rechtzeitig gelesen/);
});

test("every active private JSON mutation route uses the bounded reader", async () => {
  const routes = [
    "agents/workflows",
    "calendar/write",
    "calendar/write-proposal",
    "obsidian/write-proposals",
    "planner",
    "skills",
    "state/archive",
    "state/backups",
    "state/migration-preview",
    "state/preferences/[id]",
    "state/records/[kind]",
  ];
  for (const route of routes) {
    const source = await readFile(new URL(`../app/api/${route}/route.ts`, import.meta.url), "utf8");
    assert.match(source, /readPrivateJson/);
    assert.doesNotMatch(source, /(?:request|req)\.json\(/);
  }
});
