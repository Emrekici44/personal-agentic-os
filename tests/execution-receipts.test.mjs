import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { calendarOutcomeReceipt } from "../lib/runtime/receipts/calendar.ts";

test("calendar outcomes map to explicit retry semantics", () => {
  assert.deepEqual(calendarOutcomeReceipt("written_verified"), { status: "confirmed", retryPolicy: "not_retryable", external: true });
  assert.equal(calendarOutcomeReceipt("unknown").retryPolicy, "manual_verification_required");
  assert.equal(calendarOutcomeReceipt("rejected").retryPolicy, "new_approval_required");
});

test("generic approvals and receipts are exact, single-use and content-light", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "agentic-os-receipts-"));
  const approvalUrl = pathToFileURL(path.resolve("lib/repositories/approval-repository.ts")).href;
  const receiptUrl = pathToFileURL(path.resolve("lib/repositories/execution-receipt-repository.ts")).href;
  const storeUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const script = `
    await import(${JSON.stringify(storeUrl)});
    const crypto = await import("node:crypto");
    const approval = await import(${JSON.stringify(approvalUrl)});
    const receipts = await import(${JSON.stringify(receiptUrl)});
    const payload = { taskId: "safe-id", version: 1 };
    const artifact = approval.createApprovalArtifact({ actionType: "task.complete", approvalClass: "local_mutation", exactPayload: payload, expiresAt: new Date(Date.now()+60000).toISOString() });
    try { approval.consumeApprovalArtifact({ id: artifact.id, actionType: "task.complete", approvalClass: "local_mutation", exactPayload: { ...payload, version: 2 } }); throw new Error("changed payload accepted"); } catch (error) { if (!String(error.message).includes("stimmt nicht")) throw error; }
    approval.consumeApprovalArtifact({ id: artifact.id, actionType: "task.complete", approvalClass: "local_mutation", exactPayload: payload });
    try { approval.consumeApprovalArtifact({ id: artifact.id, actionType: "task.complete", approvalClass: "local_mutation", exactPayload: payload }); throw new Error("replay accepted"); } catch (error) { if (!String(error.message).includes("bereits verwendet")) throw error; }
    const invocationId = crypto.randomUUID();
    receipts.createExecutionReceipt({ invocationId, actionType: "read_tasks", targetType: "tool", status: "confirmed", external: false, retryPolicy: "safe", evidence: { recordCount: 2, content: "must-not-persist", token: "secret" } });
    const { DatabaseSync } = await import("node:sqlite"); const db = new DatabaseSync("local-state/agentic-os.sqlite");
    const row = db.prepare("SELECT evidence_json FROM execution_receipts WHERE invocation_id=?").get(invocationId); if (row.evidence_json.includes("must-not-persist") || row.evidence_json.includes("secret")) throw new Error("receipt leaked content");
    if (db.prepare("SELECT MAX(version) version FROM schema_migrations").get().version !== 11) throw new Error("latest migration missing"); db.close();
  `;
  try { const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], { cwd: root, encoding: "utf8", env: { ...process.env, AUTH_SECRET: "receipt-test-secret" } }); assert.equal(result.status, 0, result.stderr || result.stdout); }
  finally { rmSync(root, { recursive: true, force: true }); }
});
