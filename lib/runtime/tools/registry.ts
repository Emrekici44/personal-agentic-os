import type { RuntimeSource, ToolDefinition } from "../types.ts";

export const toolDefinitions: readonly ToolDefinition[] = [
  ["read_projects", "Projekte lesen", "projects"], ["read_tasks", "Aufgaben lesen", "tasks"], ["read_inbox", "Inbox lesen", "inbox"],
  ["read_habits", "Habits lesen", "habits"], ["read_area_records", "Bereichseinträge lesen", "area_records"],
  ["read_weekly_plan", "Letzten Wochenplan lesen", "weekly_plans"], ["read_journal_metadata", "Journal-Metadaten lesen", "journal_metadata"],
  ["read_calendar_catalog", "Kalenderkatalog lesen", "calendar_catalog"], ["read_calendar_events", "Kalenderbelegung lesen", "calendar_events"],
].map(([id, name, source]) => ({ id, name, version: 1, source, capability: "read", riskClass: "read", requiresApproval: false, inputSchema: {} } as ToolDefinition));

export const localMutationToolDefinitions: readonly ToolDefinition[] = [
  { id: "task.create", name: "Aufgabe erstellen", version: 1, capability: "local_write", riskClass: "local_mutation", requiresApproval: true, approvalClass: "local_mutation", inputSchema: { title: "bounded", projectId: "uuid_optional", area: "enum", priority: "enum", dueAt: "date_optional" } },
  { id: "task.complete", name: "Aufgabe abschließen", version: 1, capability: "local_write", riskClass: "local_mutation", requiresApproval: true, approvalClass: "local_mutation", inputSchema: { id: "uuid", version: "integer" } },
  { id: "task.reopen", name: "Aufgabe wieder öffnen", version: 1, capability: "local_write", riskClass: "local_mutation", requiresApproval: true, approvalClass: "local_mutation", inputSchema: { id: "uuid", version: "integer" } },
  { id: "project.update_next_action", name: "Nächste Projektaktion ändern", version: 1, capability: "local_write", riskClass: "local_mutation", requiresApproval: true, approvalClass: "local_mutation", inputSchema: { id: "uuid", version: "integer", nextAction: "bounded" } },
  { id: "inbox.create", name: "Inbox-Eintrag erstellen", version: 1, capability: "local_write", riskClass: "local_mutation", requiresApproval: true, approvalClass: "local_mutation", inputSchema: { title: "bounded", content: "bounded_optional", projectId: "uuid_optional" } },
];

export function getToolDefinition(id: string) {
  const tool = [...toolDefinitions, ...localMutationToolDefinitions].find((item) => item.id === id);
  if (!tool) throw new Error("Unbekanntes Tool");
  return tool;
}

export function executeReadTool(id: string, readers: Partial<Record<RuntimeSource, () => unknown[]>>) {
  const tool = getToolDefinition(id);
  if (tool.capability !== "read" || tool.requiresApproval) throw new Error("Mutierendes Tool ist im lokalen Runtime-Pfad gesperrt");
  if (!tool.source) throw new Error("Tool-Quelle ist nicht verfügbar");
  const reader = readers[tool.source];
  if (!reader) throw new Error("Tool-Quelle ist nicht verfügbar");
  const result = reader();
  if (!Array.isArray(result)) throw new Error("Tool-Ergebnis ist nicht verifiziert");
  return result;
}
