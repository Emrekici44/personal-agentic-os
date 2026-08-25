import crypto from "node:crypto";
import { latestWeeklyPlan, listRecords } from "../../shared-store.ts";
import { retrieveActiveMemories } from "../../repositories/memory-repository.ts";
import { assertAreaScopeAllowed, assertSourceAllowed } from "../policies/evaluator.ts";
import type { AgentDefinition, RuntimeContextSnapshot, RuntimeSource } from "../types.ts";

function readSource(source: RuntimeSource): unknown[] {
  if (source === "inbox") return listRecords("inbox_items");
  if (source === "weekly_plans") { const plan = latestWeeklyPlan(); return plan ? [plan] : []; }
  return listRecords(source);
}

export function buildRuntimeContext(agent: AgentDefinition, input: { userInput: string; projectId?: string; scope?: { area?: string } }): RuntimeContextSnapshot {
  assertAreaScopeAllowed(agent, input.scope?.area);
  const records: RuntimeContextSnapshot["records"] = {}, sources: RuntimeContextSnapshot["sources"] = [];
  for (const source of agent.allowedSources) {
    assertSourceAllowed(agent, source);
    let values = readSource(source);
    if (input.projectId && source === "projects") values = values.filter((item) => (item as { id?: string }).id === input.projectId);
    if (input.projectId && ["tasks", "inbox"].includes(source)) values = values.filter((item) => (item as { projectId?: string }).projectId === input.projectId);
    if (input.scope?.area && source === "area_records") values = values.filter((item) => (item as { area?: string }).area === input.scope?.area);
    const total = values.length, included = values.slice(0, agent.contextPolicy.maxRecordsPerSource);
    records[source] = included; sources.push({ source, recordCount: included.length, includedCount: included.length, excludedCount: total - included.length, verified: true, priority: agent.contextPolicy.sourcePriorities[source] || "P2", reason: total > included.length ? "context_budget" : "allowed_and_in_scope" });
  }
  if (input.projectId && !(records.projects || []).length) throw new Error("Ausgewähltes Projekt wurde nicht gefunden");
  const memories = retrieveActiveMemories(agent, input.projectId, input.scope?.area || agent.area).filter((item) => agent.contextPolicy.includeMemoryKinds.includes(item.kind) && agent.contextPolicy.includeScopes.includes(item.scope)).slice(0, agent.contextPolicy.maxMemories);
  return { id: crypto.randomUUID(), agentId: agent.id, createdAt: new Date().toISOString(), sources, records, memories, projectId: input.projectId, scope: input.scope, versions: { agentDefinition: agent.version, contextPolicy: 1, memories: memories.map((item) => ({ id: item.id, version: item.version })) } };
}
