import crypto from "node:crypto";
import { operationalDatabase } from "../store/database.ts";
import type { ExecutionReceipt } from "../runtime/types.ts";

const safeEvidence = (input: Record<string, unknown>) => Object.fromEntries(Object.entries(input).filter(([key, value]) => !/content|input|output|path|secret|token|payload|title/i.test(key) && ["string", "number", "boolean"].includes(typeof value)).slice(0, 16)) as ExecutionReceipt["evidence"];

export function createExecutionReceipt(input: Omit<ExecutionReceipt, "id" | "version">): ExecutionReceipt {
  if (!/^[0-9a-f-]{36}$/i.test(input.invocationId) || input.actionType.length < 2 || input.actionType.length > 80) throw new Error("Ungültiger Execution Receipt");
  const id = crypto.randomUUID(), now = new Date().toISOString(), evidence = safeEvidence(input.evidence || {});
  operationalDatabase().prepare("INSERT INTO execution_receipts(id,run_id,invocation_id,action_type,target_type,target_id,status,external,started_at,finished_at,retry_policy,evidence_json,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)").run(id, input.runId || null, input.invocationId, input.actionType, input.targetType, input.targetId || null, input.status, input.external ? 1 : 0, input.startedAt || null, input.finishedAt || null, input.retryPolicy, JSON.stringify(evidence), now, now);
  operationalDatabase().prepare("INSERT INTO audit_log(id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?)").run(crypto.randomUUID(), input.status === "unknown" ? "execution.unknown" : input.status === "confirmed" ? "execution.confirmed" : "execution.recorded", "execution_receipt", id, JSON.stringify({ actionType: input.actionType, status: input.status, external: input.external, retryPolicy: input.retryPolicy }), now);
  return { ...input, id, evidence, version: 1 };
}

export function listRecentExecutionReceipts(limit = 50): ExecutionReceipt[] {
  const safe = Math.min(50, Math.max(1, Math.trunc(limit) || 50));
  return (operationalDatabase().prepare("SELECT * FROM execution_receipts ORDER BY created_at DESC LIMIT ?").all(safe) as Array<Record<string, unknown>>).map((row) => ({ id: String(row.id), runId: row.run_id ? String(row.run_id) : undefined, invocationId: String(row.invocation_id), actionType: String(row.action_type), targetType: row.target_type as ExecutionReceipt["targetType"], targetId: row.target_id ? String(row.target_id) : undefined, status: row.status as ExecutionReceipt["status"], external: Boolean(row.external), startedAt: row.started_at ? String(row.started_at) : undefined, finishedAt: row.finished_at ? String(row.finished_at) : undefined, retryPolicy: row.retry_policy as ExecutionReceipt["retryPolicy"], evidence: JSON.parse(String(row.evidence_json)), version: Number(row.version) }));
}

export function listExecutionReceipts(runId: string, limit = 100): ExecutionReceipt[] {
  const safe = Math.min(100, Math.max(1, Math.trunc(limit) || 100));
  return (operationalDatabase().prepare("SELECT * FROM execution_receipts WHERE run_id=? ORDER BY created_at,id LIMIT ?").all(runId, safe) as Array<Record<string, unknown>>).map((row) => ({ id: String(row.id), runId: row.run_id ? String(row.run_id) : undefined, invocationId: String(row.invocation_id), actionType: String(row.action_type), targetType: row.target_type as ExecutionReceipt["targetType"], targetId: row.target_id ? String(row.target_id) : undefined, status: row.status as ExecutionReceipt["status"], external: Boolean(row.external), startedAt: row.started_at ? String(row.started_at) : undefined, finishedAt: row.finished_at ? String(row.finished_at) : undefined, retryPolicy: row.retry_policy as ExecutionReceipt["retryPolicy"], evidence: JSON.parse(String(row.evidence_json)), version: Number(row.version) }));
}
