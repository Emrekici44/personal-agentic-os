import type { ToolDefinition } from "../types.ts";

export const toolDefinitions: readonly ToolDefinition[] = [
  ["read_projects", "Projekte lesen", "projects"], ["read_tasks", "Aufgaben lesen", "tasks"], ["read_inbox", "Inbox lesen", "inbox"],
  ["read_habits", "Habits lesen", "habits"], ["read_area_records", "Bereichseinträge lesen", "area_records"],
  ["read_weekly_plan", "Letzten Wochenplan lesen", "weekly_plans"], ["read_journal_metadata", "Journal-Metadaten lesen", "journal_metadata"],
].map(([id, name, source]) => ({ id, name, source, capability: "read", riskClass: "low", requiresApproval: false, inputSchema: {} } as ToolDefinition));

export function getToolDefinition(id: string) {
  const tool = toolDefinitions.find((item) => item.id === id);
  if (!tool) throw new Error("Unbekanntes Tool");
  return tool;
}

export function executeReadTool(id: string, readers: Partial<Record<ToolDefinition["source"], () => unknown[]>>) {
  const tool = getToolDefinition(id);
  if (tool.capability !== "read" || tool.requiresApproval) throw new Error("Mutierendes Tool ist im lokalen Runtime-Pfad gesperrt");
  const reader = readers[tool.source];
  if (!reader) throw new Error("Tool-Quelle ist nicht verfügbar");
  const result = reader();
  if (!Array.isArray(result)) throw new Error("Tool-Ergebnis ist nicht verifiziert");
  return result;
}
