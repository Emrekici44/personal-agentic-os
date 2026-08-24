import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("shared record and audit writes roll back together", () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "agentic-os-atomic-record-"));
  const moduleUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const script = `
    const { DatabaseSync } = await import("node:sqlite");
    const path = await import("node:path");
    const store = await import(${JSON.stringify(moduleUrl)});
    store.storeStatus();
    const database = new DatabaseSync(path.join(process.cwd(), "local-state", "agentic-os.sqlite"));
    database.exec("CREATE TRIGGER fail_create_audit BEFORE INSERT ON audit_log WHEN NEW.action='create' BEGIN SELECT RAISE(ABORT,'forced audit failure'); END;");
    try {
      store.withStoreTransaction(() => store.createRecord("tasks", { title: "Temporary atomic task", status: "active", area: "Inbox", priority: "medium", checklist: [], done: false }));
      throw new Error("audit failure did not abort creation");
    } catch (error) {
      if (!String(error.message).includes("forced audit failure")) throw error;
    }
    if (store.listRecords("tasks").length !== 0) throw new Error("record survived failed audit");
    database.exec("DROP TRIGGER fail_create_audit");
    const created = store.withStoreTransaction(() => store.createRecord("tasks", { title: "Temporary atomic task", status: "active", area: "Inbox", priority: "medium", checklist: [], done: false }));
    database.exec("CREATE TRIGGER fail_update_audit BEFORE INSERT ON audit_log WHEN NEW.action='update' BEGIN SELECT RAISE(ABORT,'forced update audit failure'); END;");
    try {
      store.withStoreTransaction(() => store.updateRecord("tasks", created.id, { ...created, title: "Changed without audit" }));
      throw new Error("audit failure did not abort update");
    } catch (error) {
      if (!String(error.message).includes("forced update audit failure")) throw error;
    }
    const current = store.listRecords("tasks")[0];
    if (current.title !== "Temporary atomic task" || current.version !== 1) throw new Error("update survived failed audit");
    database.close();
  `;
  try {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: temporaryRoot,
      encoding: "utf8",
      env: { ...process.env, AUTH_SECRET: "atomic-contract-local-only-key" },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("all multi-step local mutation routes use the transaction service", async () => {
  const files = await Promise.all([
    "../app/api/state/records/[kind]/route.ts",
    "../app/api/state/preferences/[id]/route.ts",
    "../app/api/skills/route.ts",
    "../app/api/agents/workflows/route.ts",
    "../app/api/planner/route.ts",
    "../app/api/obsidian/write-proposals/route.ts",
  ].map((file) => import("node:fs/promises").then(({ readFile }) => readFile(new URL(file, import.meta.url), "utf8"))));
  for (const source of files) assert.match(source, /withStoreTransaction/);
  assert.match(files[0], /withStoreTransaction\(\(\) => createRecord/);
  assert.match(files[0], /withStoreTransaction\(\(\) => updateRecord/);
  assert.match(files[1], /withStoreTransaction\(\(\) => setPreference/);
  assert.match(files[2], /withStoreTransaction\(\(\) => (?:createSkillDefinition|saveSkillRun|updateSkillDefinition|archiveSkillDefinition|reviewSkillRun)/);
  assert.match(files[3], /withStoreTransaction\(\(\) => (?:saveAgentWorkflowRun|transitionAgentWorkflowRun)/);
  assert.match(files[4], /withStoreTransaction\(\(\) => reviewWeeklyPlan/);
  assert.match(files[5], /withStoreTransaction\(\(\) => (?:saveVaultWriteProposal|approveVaultWriteProposal)/);
});
