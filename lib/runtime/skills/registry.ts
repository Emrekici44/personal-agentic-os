import { skillProcedureCatalog } from "../../local-skills.mjs";
import type { SkillDefinition } from "../types.ts";

export const runtimeSkillDefinitions: readonly SkillDefinition[] = skillProcedureCatalog.map((skill) => ({
  id: skill.id,
  name: skill.name,
  description: skill.purpose,
  version: 1,
  inputSchema: skill.inputSchema,
  allowedSources: skill.allowedSources.map((source) => source === "inbox_items" ? "inbox" : source) as SkillDefinition["allowedSources"],
  executionMode: "deterministic-local",
  permissionPolicy: { allowedRiskClasses: ["read"], requiresApprovalFor: ["local_mutation", "external_mutation"] },
  status: "active",
}));

export function getRuntimeSkill(id: string) {
  const skill = runtimeSkillDefinitions.find((item) => item.id === id);
  if (!skill) throw new Error("Unbekannter Skill");
  return skill;
}

export function assertExecutableSkill(skill: SkillDefinition) {
  if (skill.status !== "active") throw new Error("Skill ist pausiert");
  if (skill.executionMode !== "deterministic-local") throw new Error("Model-assisted Skills sind nicht aktiviert");
  return skill;
}
