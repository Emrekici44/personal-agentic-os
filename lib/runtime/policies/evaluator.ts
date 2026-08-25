import type { AgentDefinition, RiskClass, RuntimeSource } from "../types.ts";
import { getRuntimeSkill, assertExecutableSkill } from "../skills/registry.ts";
import { getToolDefinition } from "../tools/registry.ts";

export class RuntimePolicyError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.name = "RuntimePolicyError"; this.code = code; }
}

export function assertAgentRunnable(agent: AgentDefinition) {
  if (agent.status !== "active") throw new RuntimePolicyError("agent_paused", "Agent ist pausiert");
}

export function assertSourceAllowed(agent: AgentDefinition, source: RuntimeSource) {
  if (!agent.allowedSources.includes(source)) throw new RuntimePolicyError("source_denied", "Datenquelle ist für diesen Agenten nicht erlaubt");
}

export function assertAreaScopeAllowed(agent: AgentDefinition, area?: string) {
  if (area && area !== agent.area) throw new RuntimePolicyError("memory_scope_denied", "Memory- und Bereichs-Scope ist für diesen Agenten nicht erlaubt");
}

export function assertSkillAllowed(agent: AgentDefinition, skillId: string) {
  if (!agent.allowedSkills.includes(skillId)) throw new RuntimePolicyError("skill_denied", "Skill ist für diesen Agenten nicht erlaubt");
  return assertExecutableSkill(getRuntimeSkill(skillId));
}

export function assertToolAllowed(agent: AgentDefinition, toolId: string) {
  if (!agent.allowedTools.includes(toolId)) throw new RuntimePolicyError("tool_denied", "Tool ist für diesen Agenten nicht erlaubt");
  const tool = getToolDefinition(toolId);
  if (tool.capability !== "read") throw new RuntimePolicyError("tool_mutation_denied", "Mutierende Tools sind im Standardlauf gesperrt");
  return tool;
}

export function assertRiskAllowed(agent: AgentDefinition, risk: RiskClass, approved = false) {
  if (!agent.permissionPolicy.allowedRiskClasses.includes(risk)) throw new RuntimePolicyError("risk_denied", "Risikoklasse ist nicht erlaubt");
  if (agent.permissionPolicy.requiresApprovalFor.includes(risk) && !approved) throw new RuntimePolicyError("approval_required", "Explizite Freigabe erforderlich");
}
