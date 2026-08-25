import { getAgentDefinition } from "./agents/registry.ts";
import { buildRuntimeContext } from "./context/builder.ts";
import { getPlanner } from "./planning/planner.ts";
import { assertAgentRunnable, assertRiskAllowed, assertSkillAllowed, assertToolAllowed, RuntimePolicyError } from "./policies/evaluator.ts";
import { createMemoryCandidate } from "../repositories/memory-repository.ts";
import { appendRuntimeAudit } from "../repositories/audit-repository.ts";
import { createRuntimeRun, persistContextSnapshot, persistRunSteps } from "../repositories/runtime-repository.ts";
import { withStoreTransaction } from "../shared-store.ts";

const primarySkill: Record<string, string> = { project_coach: "project_snapshot", faith_reflection: "area_overview", health_planner: "area_overview", finance_overview: "area_overview", relationship_care: "area_overview" };

export interface RunAgentInput { agentId: string; input: string; projectId?: string; scope?: { area?: string }; requestedSkillId?: string; requestedToolId?: string; createMemoryCandidate?: boolean; }

export async function runAgent(request: RunAgentInput) {
  const input = String(request.input || "").trim(); if (input.length < 2 || input.length > 1000) throw new Error("Arbeitsauftrag muss 2–1000 Zeichen enthalten");
  const agent = getAgentDefinition(String(request.agentId || ""));
  try {
    assertAgentRunnable(agent); assertRiskAllowed(agent, "read");
    const skill = assertSkillAllowed(agent, request.requestedSkillId || primarySkill[agent.id]);
    if (request.requestedToolId) assertToolAllowed(agent, request.requestedToolId);
    const context = buildRuntimeContext(agent, { userInput: input, projectId: request.projectId, scope: request.scope || { area: agent.area } });
    const plan = await getPlanner(agent.plannerPolicy.plannerId).plan({ agent, userInput: input, context, projectId: request.projectId });
    if (plan.modelUsed || plan.externalActionsPerformed) throw new RuntimePolicyError("unsafe_planner_result", "Unsicheres Planner-Ergebnis wurde blockiert");
    return withStoreTransaction(() => {
      persistContextSnapshot(context);
      const run = createRuntimeRun(agent.id, input, context, plan), now = new Date().toISOString();
      const steps = persistRunSteps(run.id, [
        { index: 1, type: "policy", status: "completed", startedAt: now, completedAt: now, evidence: { riskClass: "read", allowed: true } },
        { index: 2, type: "context", status: "completed", startedAt: now, completedAt: now, evidence: { sourceCount: context.sources.length, verifiedSourceCount: context.sources.filter((item) => item.verified).length, memoryCount: context.memories.length } },
        { index: 3, type: "skill", status: "completed", startedAt: now, completedAt: now, evidence: { skillId: skill.id, executionMode: skill.executionMode, validationOnly: true, externalActionsPerformed: false } },
        { index: 4, type: "planner", status: "completed", startedAt: now, completedAt: now, evidence: { planner: "deterministic-local", modelUsed: false, proposalCount: plan.proposedSteps.length } },
        { index: 5, type: "result", status: "completed", startedAt: now, completedAt: now, evidence: { proposalOnly: true, reviewRequired: true, externalActionsPerformed: false } },
      ]);
      const memoryCandidate = request.createMemoryCandidate === false ? null : createMemoryCandidate({ kind: "observation", scope: "agent", scopeId: agent.id, content: `${agent.name}: lokaler Vorschlagslauf mit ${plan.proposedSteps.length} Vorschlägen.`, sourceType: "runtime_run", sourceId: run.id, confidence: 1 }, "agent");
      appendRuntimeAudit("agent.run.created", "agent_workflow", run.id, { agentId: agent.id, planner: "deterministic-local", modelUsed: false });
      appendRuntimeAudit("agent.context.built", "agent_workflow", run.id, { sourceCount: context.sources.length, verifiedSourceCount: context.sources.filter((item) => item.verified).length, memoryCount: context.memories.length });
      appendRuntimeAudit("agent.plan.generated", "agent_workflow", run.id, { proposalCount: plan.proposedSteps.length, externalActionsPerformed: false });
      return { run: { ...run, steps }, context: { id: context.id, sources: context.sources, memoryCount: context.memories.length }, memoryCandidate, proposalOnly: true, externalActionsPerformed: false, modelUsed: false, backgroundActions: false, provider: "local-rules", model: "none" };
    });
  } catch (error) {
    if (error instanceof RuntimePolicyError) {
      try { withStoreTransaction(() => appendRuntimeAudit("policy.blocked", "agent", agent.id, { code: error.code })); } catch { /* preserve original safe denial */ }
    }
    throw error;
  }
}
