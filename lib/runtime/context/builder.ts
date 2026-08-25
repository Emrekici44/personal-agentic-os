import crypto from "node:crypto";
import { latestWeeklyPlan, listRecords } from "../../shared-store.ts";
import { retrieveActiveMemories } from "../../repositories/memory-repository.ts";
import { assertAreaScopeAllowed, assertSourceAllowed, assertToolAllowed } from "../policies/evaluator.ts";
import { executeReadTool } from "../tools/registry.ts";
import type { AgentDefinition, RuntimeContextSnapshot, RuntimeSource } from "../types.ts";

const sourceTool: Record<RuntimeSource, string> = { projects: "read_projects", tasks: "read_tasks", inbox: "read_inbox", habits: "read_habits", journal_metadata: "read_journal_metadata", area_records: "read_area_records", weekly_plans: "read_weekly_plan" };

function readSource(source: RuntimeSource): unknown[] {
  if (source === "inbox") return listRecords("inbox_items");
  if (source === "weekly_plans") { const plan = latestWeeklyPlan(); return plan ? [plan] : []; }
  return listRecords(source);
}

export function buildRuntimeContext(agent: AgentDefinition, input: { userInput: string; projectId?: string; scope?: { area?: string } }): RuntimeContextSnapshot {
  assertAreaScopeAllowed(agent, input.scope?.area);
  const records: RuntimeContextSnapshot["records"] = {}, sources: RuntimeContextSnapshot["sources"] = [];
  for (const source of agent.allowedSources) {
    assertSourceAllowed(agent, source); assertToolAllowed(agent, sourceTool[source]);
    let values = executeReadTool(sourceTool[source], { [source]: () => readSource(source) });
    if (input.projectId && source === "projects") values = values.filter((item) => (item as { id?: string }).id === input.projectId);
    if (input.projectId && ["tasks", "inbox"].includes(source)) values = values.filter((item) => (item as { projectId?: string }).projectId === input.projectId);
    if (input.scope?.area && source === "area_records") values = values.filter((item) => (item as { area?: string }).area === input.scope?.area);
    records[source] = values; sources.push({ source, recordCount: values.length, verified: true });
  }
  if (input.projectId && !(records.projects || []).length) throw new Error("Ausgewähltes Projekt wurde nicht gefunden");
  return { id: crypto.randomUUID(), agentId: agent.id, createdAt: new Date().toISOString(), sources, records, memories: retrieveActiveMemories(agent, input.projectId, input.scope?.area || agent.area), projectId: input.projectId, scope: input.scope };
}
