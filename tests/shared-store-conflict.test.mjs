import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("shared records reject a stale client version without overwriting", () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "agentic-os-conflict-"));
  const moduleUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const script = `
    const store = await import(${JSON.stringify(moduleUrl)});
    const created = store.createRecord("tasks", { title: "Temporary contract record", status: "active", area: "Inbox", priority: "medium", checklist: [], done: false });
    const updated = store.updateRecord("tasks", created.id, { ...created, title: "First client update" });
    if (updated.version !== 2) throw new Error("version did not advance");
    try {
      store.updateRecord("tasks", created.id, { ...created, title: "Stale client update" });
      throw new Error("stale update was accepted");
    } catch (error) {
      if (!String(error.message).startsWith("Datenkonflikt")) throw error;
    }
    const current = store.listRecords("tasks")[0];
    if (current.title !== "First client update" || current.version !== 2) throw new Error("current record was overwritten");
    try {
      store.archiveRecord("tasks", created.id, 1);
      throw new Error("stale archive was accepted");
    } catch (error) {
      if (!String(error.message).startsWith("Datenkonflikt")) throw error;
    }
    if (store.listRecords("tasks").length !== 1) throw new Error("stale archive hid the current record");
  `;
  try {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: temporaryRoot,
      encoding: "utf8",
      env: { ...process.env, AUTH_SECRET: "contract-test-local-only-key" },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
