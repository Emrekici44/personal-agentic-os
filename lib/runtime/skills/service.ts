import crypto from "node:crypto";
import { executeLocalSkill, normalizeSkillDefinition, skillProcedureCatalog } from "../../local-skills.mjs";
import { assertSkillAllowed } from "../policies/evaluator.ts";
import { executeTool } from "../tools/service.ts";
import type { AgentDefinition, SkillExecutionResult } from "../types.ts";

const sourceTool: Record<string, string> = { projects: "read_projects", tasks: "read_tasks", inbox_items: "read_inbox", habits: "read_habits", area_records: "read_area_records", journal_metadata: "read_journal_metadata", weekly_plans: "read_weekly_plan", calendar_catalog: "read_calendar_catalog", calendar_events: "read_calendar_events" };
type StoredSkillDefinition = { id: string; name: string; purpose: string; procedureId: string; allowedSources: string[]; assignedAgentWorkflowIds?: string[]; status: string; version?: number; executionMode?: string; approvalClass?: string };

function executeValidatedSkill(agent: AgentDefinition, skillId: string, input: Record<string, unknown>, runId: string | undefined, stored?: StoredSkillDefinition, sourceOverrides: Record<string, unknown[]> = {}) {
  const definition = stored ? { status: stored.status, executionMode: stored.executionMode } : assertSkillAllowed(agent, skillId);
  if (stored && !agent.allowedSkills.includes(skillId)) throw new Error("Skill ist für diesen Ausführungskontext nicht erlaubt");
  if (definition.status !== "active") throw new Error("Skill ist pausiert");
  if (definition.executionMode && definition.executionMode !== "deterministic-local") throw new Error("Model-assisted Skills sind nicht aktiviert");
  const procedure = skillProcedureCatalog.find((item) => item.id === skillId); if (!procedure) throw new Error("Unbekannte lokale Prozedur");
  const allowedSources = stored?.allowedSources || procedure.allowedSources;
  if (!allowedSources.length || allowedSources.some((source) => !procedure.allowedSources.includes(source))) throw new Error("Nicht erlaubte Skill-Quelle");
  const invocation = { id: crypto.randomUUID(), skillId, input, requestedBy: "planner" as const, createdAt: new Date().toISOString() };
  const toolExecutions = allowedSources.map((source) => {
    const toolInput: Record<string, unknown> = {};
    if (input.projectId && ["projects", "tasks", "inbox_items"].includes(source)) toolInput.projectId = input.projectId;
    if (input.area && ["tasks", "habits", "area_records"].includes(source)) toolInput.area = input.area;
    return executeTool({ agent, toolId: sourceTool[source], input: toolInput, runId, skillId, sourceOverride: sourceOverrides[source] });
  });
  const sources = Object.fromEntries(toolExecutions.map((execution, index) => [allowedSources[index], execution.records]));
  const localDefinition = normalizeSkillDefinition({ name: stored?.name || procedure.name, purpose: stored?.purpose || procedure.purpose, procedureId: procedure.id, allowedSources, assignedAgentWorkflowIds: stored?.assignedAgentWorkflowIds || [agent.id], status: definition.status });
  const preview = executeLocalSkill(localDefinition, input, sources);
  const result: SkillExecutionResult = { invocationId: invocation.id, skillId, status: "completed", summary: preview.summary, items: preview.items as SkillExecutionResult["items"], toolInvocations: toolExecutions.map((item) => item.invocation), toolResults: toolExecutions.map((item) => item.result), deterministicSteps: preview.deterministicSteps, sourceEvidence: preview.sourceEvidence, input, data: preview.data, externalActionsPerformed: false, modelUsed: false, networkCalls: false, fileWrites: false, backgroundActions: false };
  return { invocation, result, toolExecutions, preview };
}

export function executeSkill({ agent, skillId, input = {}, runId, sourceOverrides = {} }: { agent: AgentDefinition; skillId: string; input?: Record<string, unknown>; runId?: string; sourceOverrides?: Record<string, unknown[]> }) {
  assertSkillAllowed(agent, skillId);
  return executeValidatedSkill(agent, skillId, input, runId, undefined, sourceOverrides);
}

export function executeStandaloneSkill(skill: StoredSkillDefinition, input: Record<string, unknown> = {}) {
  const procedure = skillProcedureCatalog.find((item) => item.id === skill.procedureId); if (!procedure) throw new Error("Unbekannte lokale Prozedur");
  const toolIds = skill.allowedSources.map((source) => sourceTool[source]);
  if (toolIds.some((id) => !id)) throw new Error("Nicht erlaubte Skill-Quelle");
  const principal: AgentDefinition = {
    id: "standalone_skill", name: "Standalone Skill", description: "Expliziter lokaler Skill-Lauf", objective: skill.purpose, area: "standalone", boundary: "Nur lokale Read-Proposals",
    allowedSkills: [procedure.id], allowedTools: toolIds, allowedSources: skill.allowedSources.map((source) => source === "inbox_items" ? "inbox" : source) as AgentDefinition["allowedSources"], defaultSkillId: procedure.id,
    plannerPolicy: { plannerId: "deterministic-local" }, memoryPolicy: { readScopes: [], candidateKinds: [], automaticActivation: false }, permissionPolicy: { allowedRiskClasses: ["read"], requiresApprovalFor: ["local_mutation", "external_mutation"] }, contextPolicy: { maxRecordsPerSource: 50, sourcePriorities: {}, includeMemoryKinds: [], includeScopes: [], maxMemories: 0 }, status: "active", version: 1,
  };
  return executeValidatedSkill(principal, procedure.id, input, undefined, skill);
}
