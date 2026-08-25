import { assertSkillAllowed, assertToolAllowed, RuntimePolicyError } from "../policies/evaluator.ts";
import { RuntimeError } from "../errors.ts";
import type { AgentDefinition, PlannerResult } from "../types.ts";
export const runtimeLimits = Object.freeze({ maxPlannerPasses: 1, maxSkillInvocations: 3, maxToolIntents: 10, maxProposedActions: 10, maxMemorySuggestions: 3, maxApprovalRequirements: 5, maxRunSteps: 40, maxToolsPerSkill: 7 });
export function validatePlannerResult(agent: AgentDefinition, value: PlannerResult) {
  if (!value || typeof value.summary !== "string" || value.summary.length > 2000) throw new RuntimeError("validation", "Planner-Ergebnis ist ungültig");
  if (value.externalActionsPerformed) throw new RuntimePolicyError("planner_execution_denied", "Planner darf nicht ausführen");
  if(value.modelUsed&&agent.plannerPolicy.plannerId!=="model-assisted")throw new RuntimePolicyError("model_not_allowed","Modellplanung ist für diesen Agenten nicht erlaubt");
  if (!Array.isArray(value.skillInvocations) || value.skillInvocations.length > runtimeLimits.maxSkillInvocations || !Array.isArray(value.toolIntents) || value.toolIntents.length > runtimeLimits.maxToolIntents || value.proposedSteps.length > runtimeLimits.maxProposedActions || value.memorySuggestions.length > runtimeLimits.maxMemorySuggestions || value.approvalRequirements.length > runtimeLimits.maxApprovalRequirements) throw new RuntimeError("validation", "Planner-Ergebnis überschreitet Runtime-Limits");
  for (const invocation of value.skillInvocations) assertSkillAllowed(agent, invocation.skillId);
  for (const intent of value.toolIntents) assertToolAllowed(agent, intent.toolId);
  for (const requirement of value.approvalRequirements) if (!agent.permissionPolicy.allowedRiskClasses.includes(requirement.riskClass)) throw new RuntimePolicyError("risk_denied", "Planner fordert eine nicht erlaubte Risikoklasse");
  return value;
}
