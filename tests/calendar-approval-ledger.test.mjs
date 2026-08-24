import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("calendar approvals are encrypted, exact and single-use in an isolated store", () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "agentic-os-calendar-approval-"));
  const moduleUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const script = `
    const crypto = await import("node:crypto");
    const fs = await import("node:fs");
    const path = await import("node:path");
    const store = await import(${JSON.stringify(moduleUrl)});
    const id = crypto.randomUUID();
    const exact = { action: "create", calendarId: "temporary-calendar", title: "Temporary approval contract title", start: "2026-08-25T10:00:00.000Z", end: "2026-08-25T10:30:00.000Z", idempotencyKey: "temporary:approval:contract" };
    store.registerExternalApproval(id, "calendar_event_create", exact, new Date(Date.now() + 60_000).toISOString());
    const db = fs.readFileSync(path.join(process.cwd(), "local-state", "agentic-os.sqlite"));
    if (db.includes(Buffer.from(exact.title))) throw new Error("approval detail stored as plaintext");
    try { store.consumeExternalApproval(id, "calendar_event_create", { ...exact, title: "Changed" }); throw new Error("changed approval accepted"); }
    catch (error) { if (!String(error.message).includes("stimmt nicht mehr")) throw error; }
    const consumed = store.consumeExternalApproval(id, "calendar_event_create", exact);
    if (consumed.status !== "consumed") throw new Error("approval not consumed");
    try { store.consumeExternalApproval(id, "calendar_event_create", exact); throw new Error("approval replay accepted"); }
    catch (error) { if (!String(error.message).includes("bereits verwendet")) throw error; }
  `;
  try {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: temporaryRoot,
      encoding: "utf8",
      env: { ...process.env, AUTH_SECRET: "calendar-approval-contract-local-only-key" },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
