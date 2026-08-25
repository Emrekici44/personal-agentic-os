import crypto from "node:crypto";
import { latestWeeklyPlan, listRecords } from "../../shared-store.ts";
import { assertRiskAllowed, assertToolAllowed } from "../policies/evaluator.ts";
import type { AgentDefinition, ToolExecutionResult, ToolInvocation } from "../types.ts";

const maxLimit = 100;
function validateInput(toolId: string, raw: Record<string, unknown>) {
  const allowed: Record<string, string[]> = {
    read_projects: ["projectId", "status", "limit"], read_tasks: ["projectId", "area", "status", "limit"], read_inbox: ["projectId", "status", "limit"],
    read_habits: ["area", "status", "limit"], read_area_records: ["area", "recordType", "status", "limit"], read_journal_metadata: ["date", "status", "limit"], read_weekly_plan: [], read_calendar_catalog: ["limit"], read_calendar_events: ["limit"],
  };
  if (!allowed[toolId] || Object.keys(raw).some((key) => !allowed[toolId].includes(key))) throw new Error("Ungültige Tool-Eingabe");
  const limit = raw.limit === undefined ? maxLimit : Number(raw.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) throw new Error("Tool-Limit ist ungültig");
  if (raw.projectId && !/^[0-9a-f-]{36}$/i.test(String(raw.projectId))) throw new Error("Projekt-ID ist ungültig");
  for (const key of ["area", "status", "recordType", "date"]) if (raw[key] && !/^[\wäöüÄÖÜß-]{1,40}$/.test(String(raw[key]))) throw new Error("Tool-Filter ist ungültig");
  return { ...raw, limit } as Record<string, unknown> & { limit: number };
}

export function executeTool({ agent, toolId, input = {}, skillId, sourceOverride }: { agent: AgentDefinition; toolId: string; input?: Record<string, unknown>; runId?: string; skillId?: string; sourceOverride?: unknown[] }) {
  const definition = assertToolAllowed(agent, toolId); assertRiskAllowed(agent, "read");
  if (definition.capability !== "read" || definition.requiresApproval) throw new Error("Mutierendes Tool ist gesperrt");
  const filters = validateInput(toolId, input), source = definition.source;
  if (!source) throw new Error("Tool-Quelle ist nicht verfügbar");
  let records: any[];
  if (source === "calendar_catalog" || source === "calendar_events") { if (!Array.isArray(sourceOverride)) throw new Error("Verifizierte Connector-Quelle ist nicht verfügbar"); records = sourceOverride; }
  else records = source === "weekly_plans" ? (latestWeeklyPlan() ? [latestWeeklyPlan()] : []) : listRecords(source === "inbox" ? "inbox_items" : source);
  const projectId = filters.projectId && String(filters.projectId);
  if (projectId) records = records.filter((item) => item.id === projectId || item.projectId === projectId);
  for (const key of ["area", "status", "recordType"]) if (filters[key]) records = records.filter((item) => String(item[key]) === String(filters[key]));
  if (filters.date) records = records.filter((item) => String(item.entryDate || "") === String(filters.date));
  records = records.slice(0, Number(filters.limit));
  const invocation: ToolInvocation = { id: crypto.randomUUID(), toolId, capability: "read", input: filters, requestedBySkillId: skillId, createdAt: new Date().toISOString() };
  const result: ToolExecutionResult = { invocationId: invocation.id, toolId, status: "completed", recordCount: records.length, evidence: { verified: true, source, filtersApplied: Object.keys(input).length }, externalActionsPerformed: false, modelUsed: false, networkCalls: false, fileWrites: false };
  return { invocation, result, records };
}
