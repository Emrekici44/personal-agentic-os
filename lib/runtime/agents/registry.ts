import type { AgentDefinition } from "../types.ts";

const readOnly = { allowedRiskClasses: ["read"] as const, requiresApprovalFor: ["local_mutation", "external_mutation"] as const };
const memory = { readScopes: ["global", "agent", "project", "area"] as const, candidateKinds: ["preference", "fact", "observation", "summary"] as const, automaticActivation: false as const };

export const agentDefinitions: readonly AgentDefinition[] = [
  { id: "project_coach", name: "Projekt-Coach", description: "Lokaler Projektüberblick", objective: "Ziele, nächste Aktionen, Aufgaben und Wochenplanbezug ordnen.", area: "projects", boundary: "Nur organisatorische Vorschläge; keine Projekt- oder Kalenderänderung.", allowedSkills: ["project_snapshot", "priority_review"], allowedTools: ["read_projects", "read_tasks", "read_inbox", "read_weekly_plan"], allowedSources: ["projects", "tasks", "inbox", "weekly_plans"], plannerPolicy: { plannerId: "deterministic-local" }, memoryPolicy: memory, permissionPolicy: readOnly, status: "active", version: 1 },
  { id: "faith_reflection", name: "Glaubens- & Reflexionsassistent", description: "Lokale Reflexionsorganisation", objective: "Vorhandene Praxis- und Reflexionseinträge ruhig überblicken.", area: "faith", boundary: "Keine religiöse Autorität oder automatische Schreibaktion.", allowedSkills: ["area_overview"], allowedTools: ["read_area_records", "read_journal_metadata"], allowedSources: ["area_records", "journal_metadata"], plannerPolicy: { plannerId: "deterministic-local" }, memoryPolicy: memory, permissionPolicy: readOnly, status: "active", version: 1 },
  { id: "health_planner", name: "Gesundheitsplaner", description: "Lokale Gesundheitsorganisation", objective: "Training, Erholung, Habits und Aufgaben ordnen.", area: "health", boundary: "Keine Diagnose oder medizinische Fachberatung.", allowedSkills: ["area_overview", "daily_check"], allowedTools: ["read_area_records", "read_habits", "read_tasks"], allowedSources: ["area_records", "habits", "tasks"], plannerPolicy: { plannerId: "deterministic-local" }, memoryPolicy: memory, permissionPolicy: readOnly, status: "active", version: 1 },
  { id: "finance_overview", name: "Finanzübersichtsassistent", description: "Lokale manuelle Finanzübersicht", objective: "Manuelle Finanzdaten und Aufgaben strukturieren.", area: "finance", boundary: "Keine Beratung, Transaktion oder Bankverbindung.", allowedSkills: ["area_overview"], allowedTools: ["read_area_records", "read_tasks"], allowedSources: ["area_records", "tasks"], plannerPolicy: { plannerId: "deterministic-local" }, memoryPolicy: memory, permissionPolicy: readOnly, status: "active", version: 1 },
  { id: "relationship_care", name: "Beziehungspflege-Assistent", description: "Lokale Beziehungspflege-Organisation", objective: "Personen-, Kontakt- und Follow-up-Einträge ordnen.", area: "relations", boundary: "Keine Nachricht oder automatische Erinnerung.", allowedSkills: ["area_overview"], allowedTools: ["read_area_records", "read_tasks"], allowedSources: ["area_records", "tasks"], plannerPolicy: { plannerId: "deterministic-local" }, memoryPolicy: memory, permissionPolicy: readOnly, status: "active", version: 1 },
];

export function getAgentDefinition(id: string) {
  const definition = agentDefinitions.find((agent) => agent.id === id);
  if (!definition) throw new Error("Unbekannter Agent");
  return definition;
}
