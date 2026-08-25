import crypto from "node:crypto";
import { operationalDatabase } from "../store/database.ts";
import { decryptSensitive, encryptSensitive } from "../store/encryption.ts";
import type { PlannerResult, RunStep, RuntimeContextSnapshot } from "../runtime/types.ts";
import { listExecutionReceipts } from "./execution-receipt-repository.ts";

export function persistContextSnapshot(snapshot: RuntimeContextSnapshot) {
  const safeScope = JSON.stringify({ area: snapshot.scope?.area || null });
  const evidence = JSON.stringify(snapshot.sources);
  operationalDatabase().prepare("INSERT INTO runtime_context_snapshots(id,agent_id,project_id,scope_json,source_evidence_json,snapshot_enc,created_at) VALUES(?,?,?,?,?,?,?)").run(snapshot.id, snapshot.agentId, snapshot.projectId || null, safeScope, evidence, encryptSensitive({ records: snapshot.records, memoryIds: snapshot.memories.map((item) => item.id), versions: snapshot.versions }), snapshot.createdAt);
  return { id: snapshot.id, agentId: snapshot.agentId, projectId: snapshot.projectId, sources: snapshot.sources, memoryCount: snapshot.memories.length, createdAt: snapshot.createdAt };
}

export function createRuntimeRun(agentId: string, input: string, context: RuntimeContextSnapshot, plan: PlannerResult) {
  const id = crypto.randomUUID(), now = new Date().toISOString();
  const output = { summary: plan.summary, suggestions: plan.proposedSteps, provider: "local-rules", model: "none", cost: "free-local", professionalAdvice: false, externalActionsPerformed: false, backgroundActions: false, runtime: { status: "waiting_for_review", contextId: context.id, contextSourceCount: context.sources.length, verifiedSourceCount: context.sources.filter((item) => item.verified).length, modelUsed: false, externalActionsPerformed: false, backgroundActions: false } };
  operationalDatabase().prepare("INSERT INTO agent_workflow_runs(id,workflow_id,status,current_step,input_enc,output_enc,source_json,decision_json,resume_enc,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id, agentId, "proposal", "review", encryptSensitive({ input }), encryptSensitive(output), JSON.stringify(Object.fromEntries(context.sources.map((item) => [item.source, item.recordCount]))), JSON.stringify({ selectedSuggestionIds: [], reviewed: false, externalActionApproved: false }), encryptSensitive({ currentStep: "review", runtimeStatus: "waiting_for_review", contextId: context.id }), now, now);
  return { id, workflowId: agentId, status: "proposal", currentStep: "review", input, output, sourceEvidence: Object.fromEntries(context.sources.map((item) => [item.source, item.recordCount])), decision: { selectedSuggestionIds: [], reviewed: false, externalActionApproved: false }, version: 1, createdAt: now, updatedAt: now };
}

export function persistRunSteps(runId: string, steps: Array<Omit<RunStep, "id" | "runId">>) {
  const statement = operationalDatabase().prepare("INSERT INTO runtime_run_steps(id,run_id,step_index,step_type,status,evidence_json,started_at,completed_at) VALUES(?,?,?,?,?,?,?,?)");
  return steps.map((step) => { const id = crypto.randomUUID(); statement.run(id, runId, step.index, step.type, step.status, JSON.stringify(step.evidence || {}), step.startedAt || null, step.completedAt || null); return { ...step, id, runId }; });
}

export function listRunSteps(runId: string): RunStep[] {
  return (operationalDatabase().prepare("SELECT * FROM runtime_run_steps WHERE run_id=? ORDER BY step_index").all(runId) as Array<Record<string, unknown>>).map((row) => ({ id: String(row.id), runId: String(row.run_id), index: Number(row.step_index), type: row.step_type as RunStep["type"], status: row.status as RunStep["status"], evidence: JSON.parse(String(row.evidence_json || "{}")), startedAt: row.started_at ? String(row.started_at) : undefined, completedAt: row.completed_at ? String(row.completed_at) : undefined }));
}

export function listRuntimeRuns(limit = 20) {
  const safe = Math.min(50, Math.max(1, Math.trunc(limit) || 20));
  const rows = operationalDatabase().prepare("SELECT * FROM agent_workflow_runs WHERE status<>'archived' ORDER BY updated_at DESC LIMIT ?").all(safe) as Array<Record<string, unknown>>;
  return rows.map((row) => { const input = decryptSensitive(String(row.input_enc)) as { input: string }, output = decryptSensitive(String(row.output_enc)) as Record<string, unknown>; return { id: String(row.id), workflowId: String(row.workflow_id), status: String(row.status), currentStep: String(row.current_step), input: input.input, output, sourceEvidence: JSON.parse(String(row.source_json || "{}")), decision: JSON.parse(String(row.decision_json || "{}")), version: Number(row.version), createdAt: String(row.created_at), updatedAt: String(row.updated_at), steps: listRunSteps(String(row.id)), receipts: listExecutionReceipts(String(row.id)) }; });
}
