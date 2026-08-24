import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { runtimeHealthTransition } from "../lib/runtime-recovery.ts";

test("runtime recovery broadcasts only after a real offline to online transition", () => {
  assert.deepEqual(runtimeHealthTransition("checking", "online"), { state: "online", recovered: false });
  assert.deepEqual(runtimeHealthTransition("online", "online"), { state: "online", recovered: false });
  assert.deepEqual(runtimeHealthTransition("online", "offline"), { state: "offline", recovered: false });
  assert.deepEqual(runtimeHealthTransition("offline", "offline"), { state: "offline", recovered: false });
  assert.deepEqual(runtimeHealthTransition("offline", "online"), { state: "online", recovered: true });
});

test("the shell dispatches reloads only from the transition result", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /runtimeHealthTransition\(runtimeStateRef\.current/);
  assert.match(page, /if \(transition\.recovered\) window\.dispatchEvent\(new Event\("agentic-os:runtime-online"\)\)/);
  assert.doesNotMatch(page, /if \(result\.online\) window\.dispatchEvent/);
});
