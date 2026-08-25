import crypto from "node:crypto";
import { executeLocalSkill, normalizeSkillDefinition, skillProcedureCatalog } from "../../local-skills.mjs";
import { assertSkillAllowed } from "../policies/evaluator.ts";
import { executeTool } from "../tools/service.ts";
import type { AgentDefinition, SkillExecutionResult } from "../types.ts";

const sourceTool: Record<string, string> = { projects: "read_projects", tasks: "read_tasks", inbox_items: "read_inbox", habits: "read_habits", area_records: "read_area_records", journal_metadata: "read_journal_metadata", weekly_plans: "read_weekly_plan" };
export function executeSkill({ agent, skillId, input = {}, runId }: { agent: AgentDefinition; skillId: string; input?: Record<string, unknown>; runId?: string }) {
  const definition = assertSkillAllowed(agent, skillId);
  const procedure = skillProcedureCatalog.find((item) => item.id === skillId); if (!procedure) throw new Error("Unbekannte lokale Prozedur");
  const invocation = { id: crypto.randomUUID(), skillId, input, requestedBy: "planner" as const, createdAt: new Date().toISOString() };
  const toolExecutions = procedure.allowedSources.map((source) => {
    const toolInput: Record<string, unknown> = {};
    if (input.projectId && ["projects", "tasks", "inbox_items"].includes(source)) toolInput.projectId = input.projectId;
    if (input.area && ["tasks", "habits", "area_records"].includes(source)) toolInput.area = input.area;
    return executeTool({ agent, toolId: sourceTool[source], input: toolInput, runId, skillId });
  });
  const sources = Object.fromEntries(toolExecutions.map((execution, index) => [procedure.allowedSources[index], execution.records]));
  const localDefinition = normalizeSkillDefinition({ name: procedure.name, purpose: procedure.purpose, procedureId: procedure.id, allowedSources: procedure.allowedSources, assignedAgentWorkflowIds: [agent.id], status: definition.status });
  const preview = executeLocalSkill(localDefinition, input, sources);
  const result: SkillExecutionResult = { invocationId: invocation.id, skillId, status: "completed", summary: preview.summary, items: preview.items as SkillExecutionResult["items"], toolInvocations: toolExecutions.map((item) => item.invocation), toolResults: toolExecutions.map((item) => item.result), deterministicSteps: preview.deterministicSteps, sourceEvidence: preview.sourceEvidence, input, externalActionsPerformed: false, modelUsed: false, networkCalls: false, fileWrites: false, backgroundActions: false };
  return { invocation, result, toolExecutions, preview };
}
