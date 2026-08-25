import { getAgentDefinition } from "./agents/registry.ts";
import { buildRuntimeContext } from "./context/builder.ts";
import { getPlanner } from "./planning/planner.ts";
import { assertAgentRunnable, assertRiskAllowed, RuntimePolicyError } from "./policies/evaluator.ts";
import { executeSkill } from "./skills/service.ts";
import { createMemoryCandidate } from "../repositories/memory-repository.ts";
import { appendRuntimeAudit } from "../repositories/audit-repository.ts";
import { createRuntimeRun, persistContextSnapshot, persistRunSteps } from "../repositories/runtime-repository.ts";
import { withStoreTransaction } from "../shared-store.ts";

export interface RunAgentInput { agentId: string; input: string; projectId?: string; scope?: { area?: string }; requestedSkillId?: string; requestedToolId?: string; createMemoryCandidate?: boolean; }
export async function runAgent(request: RunAgentInput) {
  const input = String(request.input || "").trim(); if (input.length < 2 || input.length > 1000) throw new Error("Arbeitsauftrag muss 2–1000 Zeichen enthalten");
  const agent = getAgentDefinition(String(request.agentId || ""));
  try {
    assertAgentRunnable(agent); assertRiskAllowed(agent, "read");
    if (request.requestedToolId) throw new RuntimePolicyError("direct_tool_denied", "Direkte Tool-Aufrufe sind gesperrt");
    const context = buildRuntimeContext(agent, { userInput: input, projectId: request.projectId, scope: request.scope || { area: agent.area } });
    const plan = await getPlanner(agent.plannerPolicy.plannerId).plan({ agent, userInput: input, context, projectId: request.projectId, requestedSkillId: request.requestedSkillId });
    if (plan.modelUsed || plan.externalActionsPerformed) throw new RuntimePolicyError("unsafe_planner_result", "Unsicheres Planner-Ergebnis wurde blockiert");
    const skills = plan.skillInvocations.map((planned) => executeSkill({ agent, skillId: planned.skillId, input: planned.input }));
    const tools = skills.flatMap((item) => item.toolExecutions);
    return withStoreTransaction(() => {
      persistContextSnapshot(context); const run = createRuntimeRun(agent.id, input, context, plan), now = new Date().toISOString(); let index = 1;
      const raw: any[] = [
        { index: index++, type: "policy", status: "completed", startedAt: now, completedAt: now, evidence: { riskClass: "read", allowed: true } },
        { index: index++, type: "context", status: "completed", startedAt: now, completedAt: now, evidence: { sourceCount: context.sources.length, verifiedSourceCount: context.sources.filter((x) => x.verified).length, memoryCount: context.memories.length } },
        { index: index++, type: "planner", status: "completed", startedAt: now, completedAt: now, evidence: { planner: "deterministic-local", modelUsed: false, skillInvocationCount: skills.length } },
      ];
      for (const skill of skills) { raw.push({ index: index++, type: "skill", status: "completed", startedAt: now, completedAt: now, evidence: { skillId: skill.result.skillId, invocationId: skill.invocation.id, executionMode: "deterministic-local", toolCount: skill.toolExecutions.length, resultItemCount: skill.result.items.length, externalActionsPerformed: false } }); for (const tool of skill.toolExecutions) raw.push({ index: index++, type: "tool", status: "completed", startedAt: now, completedAt: now, evidence: { toolId: tool.invocation.toolId, invocationId: tool.invocation.id, capability: "read", recordCount: tool.result.recordCount, externalActionsPerformed: false } }); }
      raw.push({ index, type: "result", status: "completed", startedAt: now, completedAt: now, evidence: { proposalOnly: true, reviewRequired: true, externalActionsPerformed: false } });
      const steps = persistRunSteps(run.id, raw);
      const memoryCandidate = request.createMemoryCandidate === true ? createMemoryCandidate({ kind: "observation", scope: "agent", scopeId: agent.id, content: `${agent.name}: bestätigter lokaler Beobachtungskandidat.`, sourceType: "runtime_run", sourceId: run.id, confidence: 1 }, "agent") : null;
      appendRuntimeAudit("agent.run.created", "agent_workflow", run.id, { agentId: agent.id, planner: "deterministic-local", modelUsed: false }); appendRuntimeAudit("agent.context.built", "agent_workflow", run.id, { sourceCount: context.sources.length }); appendRuntimeAudit("agent.plan.generated", "agent_workflow", run.id, { proposalCount: plan.proposedSteps.length });
      for (const skill of skills) { appendRuntimeAudit("agent.skill.invoked", "agent_workflow", run.id, { agentId: agent.id, skillId: skill.result.skillId }); appendRuntimeAudit("skill.run.completed", "agent_workflow", run.id, { skillId: skill.result.skillId, itemCount: skill.result.items.length }); }
      for (const tool of tools) appendRuntimeAudit("tool.read.completed", "agent_workflow", run.id, { toolId: tool.invocation.toolId, recordCount: tool.result.recordCount, status: tool.result.status });
      return { run: { ...run, steps }, context: { id: context.id, sources: context.sources, memoryCount: context.memories.length }, skillExecutions: skills.map((x) => x.result), toolExecutions: tools.map((x) => x.result), memoryCandidate, proposalOnly: true, externalActionsPerformed: false, modelUsed: false, backgroundActions: false, networkCalls: false, fileWrites: false, provider: "local-rules", model: "none" };
    });
  } catch (error) { if (error instanceof RuntimePolicyError) try { withStoreTransaction(() => appendRuntimeAudit("policy.blocked", "agent", agent.id, { code: error.code })); } catch {} throw error; }
}
