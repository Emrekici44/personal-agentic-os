import { buildAgentWorkflowProposal } from "../../agent-workflows.ts";
import type { AgentDefinition, PlannerResult, RuntimeContextSnapshot } from "../types.ts";

export interface Planner { id: "deterministic-local" | "model-assisted"; plan(input: { agent: AgentDefinition; userInput: string; context: RuntimeContextSnapshot; projectId?: string }): Promise<PlannerResult>; }

export const deterministicLocalPlanner: Planner = {
  id: "deterministic-local",
  async plan({ agent, userInput, context, projectId }) {
    const records = context.records;
    const result = buildAgentWorkflowProposal(agent.id as Parameters<typeof buildAgentWorkflowProposal>[0], userInput, {
      projects: records.projects || [], tasks: records.tasks || [], inbox: records.inbox || [], habits: records.habits || [],
      journal: records.journal_metadata || [], areas: records.area_records || [], weeklyPlan: records.weekly_plans?.[0] || null,
    }, projectId);
    return { summary: result.summary, proposedSteps: result.suggestions.map((step) => ({ id: step.id, title: step.title, rationale: step.rationale, type: "proposal" as const, externalAction: false as const, requiresSeparateApproval: true as const })), requiresApproval: true, modelUsed: false, externalActionsPerformed: false, evidence: context.sources };
  },
};

export const modelAssistedPlanner: Planner = { id: "model-assisted", async plan() { throw new Error("Model Planner ist nicht aktiviert"); } };

export function getPlanner(id: AgentDefinition["plannerPolicy"]["plannerId"]) { return id === "deterministic-local" ? deterministicLocalPlanner : modelAssistedPlanner; }
