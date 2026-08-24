import crypto from "node:crypto";

const agentWorkflowIds = new Set([
  "project_coach",
  "faith_reflection",
  "health_planner",
  "finance_overview",
  "relationship_care",
]);

export const skillProcedureCatalog = [
  {
    id: "priority_review",
    name: "Prioritäten prüfen",
    category: "Planung",
    purpose: "Ordnet offene Aufgaben, Projekte und Inbox-Einträge als lokale Vorschau.",
    allowedSources: ["tasks", "projects", "inbox_items"],
    defaultSources: ["tasks", "projects", "inbox_items"],
    inputSchema: {
      focus: { type: "string", required: true, minLength: 2, maxLength: 500, label: "Fokus" },
      limit: { type: "integer", required: false, minimum: 1, maximum: 5, default: 3, label: "Maximale Vorschläge" },
    },
    deterministicSteps: ["Freigegebene Quellen lesen", "Offene Einträge nach Termin und Aktualität ordnen", "Höchstens fünf lokale Vorschläge zeigen"],
  },
  {
    id: "daily_check",
    name: "Tages-Check",
    category: "Planung",
    purpose: "Stellt Aufgaben, Routinen und vorhandene Journal-Metadaten für einen Tag zusammen.",
    allowedSources: ["tasks", "habits", "journal_metadata"],
    defaultSources: ["tasks", "habits", "journal_metadata"],
    inputSchema: {
      date: { type: "date", required: true, label: "Datum" },
      limit: { type: "integer", required: false, minimum: 1, maximum: 5, default: 5, label: "Maximale Hinweise" },
    },
    deterministicSteps: ["Datum validieren", "Freigegebene Tagesquellen filtern", "Vorhandene Einträge ohne Interpretation zusammenstellen"],
  },
  {
    id: "area_overview",
    name: "Lebensbereich überblicken",
    category: "Übersicht",
    purpose: "Erstellt aus vorhandenen Bereichseinträgen, Aufgaben und Routinen eine sachliche Übersicht.",
    allowedSources: ["area_records", "tasks", "habits"],
    defaultSources: ["area_records", "tasks", "habits"],
    inputSchema: {
      area: { type: "enum", required: true, values: ["faith", "health", "finance", "relations", "career"], label: "Lebensbereich" },
      limit: { type: "integer", required: false, minimum: 1, maximum: 5, default: 5, label: "Maximale Hinweise" },
    },
    deterministicSteps: ["Lebensbereich validieren", "Nur zugeordnete Datensätze zählen", "Titelbasierte Vorschau ohne Fachberatung erzeugen"],
  },
  {
    id: "project_snapshot",
    name: "Projektstand prüfen",
    category: "Projekte",
    purpose: "Zeigt Ziel, nächste Aktion und verknüpfte offene Einträge eines echten Projekts.",
    allowedSources: ["projects", "tasks", "inbox_items", "weekly_plans"],
    defaultSources: ["projects", "tasks", "inbox_items", "weekly_plans"],
    inputSchema: {
      projectId: { type: "uuid", required: true, label: "Projekt" },
      limit: { type: "integer", required: false, minimum: 1, maximum: 5, default: 5, label: "Maximale Hinweise" },
    },
    deterministicSteps: ["Projektzuordnung validieren", "Verknüpfte Quellen filtern", "Projektstand als schreibfreie Vorschau ausgeben"],
  },
];

export const skillSafetyContract = Object.freeze({
  approvalClass: "local_read_proposal",
  arbitraryCode: false,
  shell: false,
  dynamicImports: false,
  network: false,
  fileWrites: false,
  modelCalls: false,
  externalWrites: false,
  backgroundChains: false,
});

const getProcedure = (id) => skillProcedureCatalog.find((item) => item.id === id);
const uniqueStrings = (values) => [...new Set((Array.isArray(values) ? values : []).map(String))];
const limitedText = (value, min, max, label) => {
  const result = String(value || "").trim();
  if (result.length < min || result.length > max) throw new Error(`${label} muss ${min}–${max} Zeichen haben`);
  return result;
};
const safeLimit = (value, fallback = 5) => {
  const result = value === undefined || value === "" ? fallback : Number(value);
  if (!Number.isInteger(result) || result < 1 || result > 5) throw new Error("Limit muss zwischen 1 und 5 liegen");
  return result;
};
const stableId = (...parts) => crypto.createHash("sha256").update(parts.map(String).join("|")).digest("hex").slice(0, 16);
const item = (source, sourceId, title, rationale) => ({ id: stableId(source, sourceId, title), source, sourceId, title, rationale, type: "proposal", externalAction: false });

export function normalizeSkillDefinition(input, existing = {}) {
  const procedureId = String(input?.procedureId || existing.procedureId || "");
  const procedure = getProcedure(procedureId);
  if (!procedure) throw new Error("Unbekannte lokale Prozedur");
  const name = limitedText(input?.name ?? input?.title ?? existing.name, 2, 80, "Skillname");
  const purpose = limitedText(input?.purpose ?? existing.purpose, 2, 500, "Zweck");
  const allowedSources = uniqueStrings(input?.allowedSources ?? existing.allowedSources ?? procedure.defaultSources);
  if (!allowedSources.length || allowedSources.some((source) => !procedure.allowedSources.includes(source))) throw new Error("Nicht erlaubte Datenquelle");
  const assignedAgentWorkflowIds = uniqueStrings(input?.assignedAgentWorkflowIds ?? existing.assignedAgentWorkflowIds ?? []);
  if (assignedAgentWorkflowIds.some((id) => !agentWorkflowIds.has(id))) throw new Error("Unbekannte Agentenzuordnung");
  const status = String(input?.status || existing.status || "active");
  if (!["active", "paused"].includes(status)) throw new Error("Skillstatus muss aktiv oder pausiert sein");
  return {
    name,
    title: name,
    purpose,
    procedureId,
    category: procedure.category,
    status,
    allowedSources,
    assignedAgentWorkflowIds,
    inputSchema: procedure.inputSchema,
    deterministicSteps: procedure.deterministicSteps,
    approvalClass: skillSafetyContract.approvalClass,
    permissions: skillSafetyContract,
    executionMode: "deterministic-local",
  };
}

export function executeLocalSkill(definition, rawInput, sourceRecords) {
  const normalized = normalizeSkillDefinition(definition, definition);
  if (normalized.status !== "active") throw new Error("Nur aktive Skills können ausgeführt werden");
  const input = rawInput && typeof rawInput === "object" && !Array.isArray(rawInput) ? rawInput : {};
  const limit = safeLimit(input.limit, normalized.procedureId === "priority_review" ? 3 : 5);
  const sources = Object.fromEntries(normalized.allowedSources.map((source) => [source, Array.isArray(sourceRecords[source]) ? sourceRecords[source] : []]));
  const output = [];
  let summary = "";

  if (normalized.procedureId === "priority_review") {
    const focus = limitedText(input.focus, 2, 500, "Fokus");
    const tasks = (sources.tasks || []).filter((entry) => !entry.done && !["completed", "archived"].includes(entry.status));
    tasks.sort((a, b) => String(a.dueAt || "9999").localeCompare(String(b.dueAt || "9999")) || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    for (const task of tasks) output.push(item("tasks", task.id, task.title, task.dueAt ? `Offene Aufgabe · Termin ${String(task.dueAt).slice(0, 10)}` : "Offene Aufgabe ohne Termin"));
    for (const project of (sources.projects || []).filter((entry) => entry.status !== "archived" && entry.nextAction)) output.push(item("projects", project.id, project.nextAction, `Nächste Aktion aus „${project.title}“`));
    for (const inboxEntry of (sources.inbox_items || []).filter((entry) => entry.status !== "archived")) output.push(item("inbox_items", inboxEntry.id, inboxEntry.title, "Noch nicht abgeschlossener Inbox-Eintrag"));
    summary = `${output.length} reale Kandidaten für den Fokus „${focus}“ gefunden.`;
  } else if (normalized.procedureId === "daily_check") {
    const date = String(input.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) throw new Error("Gültiges Datum erforderlich");
    for (const task of (sources.tasks || []).filter((entry) => !entry.done && (!entry.dueAt || String(entry.dueAt).slice(0, 10) === date))) output.push(item("tasks", task.id, task.title, task.dueAt ? "An diesem Tag fällig" : "Offene Aufgabe ohne Termin"));
    for (const habit of (sources.habits || []).filter((entry) => entry.status === "active")) output.push(item("habits", habit.id, habit.title, `Aktive Routine · ${habit.cadence || "Rhythmus nicht gesetzt"}`));
    const journals = (sources.journal_metadata || []).filter((entry) => entry.entryDate === date);
    summary = `${output.length} offene Aufgaben/Routinen und ${journals.length} vorhandene Journal-Metadatensätze für ${date}.`;
  } else if (normalized.procedureId === "area_overview") {
    const area = String(input.area || "");
    if (!["faith", "health", "finance", "relations", "career"].includes(area)) throw new Error("Gültiger Lebensbereich erforderlich");
    const records = (sources.area_records || []).filter((entry) => entry.area === area);
    const tasks = (sources.tasks || []).filter((entry) => entry.area === area && !entry.done);
    const habits = (sources.habits || []).filter((entry) => entry.area === area && entry.status === "active");
    for (const record of records) output.push(item("area_records", record.id, record.title, "Vorhandener Bereichseintrag"));
    for (const task of tasks) output.push(item("tasks", task.id, task.title, "Offene zugeordnete Aufgabe"));
    for (const habit of habits) output.push(item("habits", habit.id, habit.title, "Aktive zugeordnete Routine"));
    summary = `${records.length} Bereichseinträge, ${tasks.length} offene Aufgaben und ${habits.length} aktive Routinen gefunden.`;
  } else {
    const projectId = String(input.projectId || "");
    if (!/^[0-9a-f-]{36}$/i.test(projectId)) throw new Error("Gültiges Projekt erforderlich");
    const project = (sources.projects || []).find((entry) => entry.id === projectId);
    if (!project) throw new Error("Projekt wurde in den erlaubten Quellen nicht gefunden");
    if (project.goal) output.push(item("projects", project.id, project.goal, "Aktuelles Projektziel"));
    if (project.nextAction) output.push(item("projects", project.id, project.nextAction, "Aktuell hinterlegte nächste Aktion"));
    for (const task of (sources.tasks || []).filter((entry) => entry.projectId === projectId && !entry.done)) output.push(item("tasks", task.id, task.title, "Offene Projektaufgabe"));
    for (const inboxEntry of (sources.inbox_items || []).filter((entry) => entry.projectId === projectId)) output.push(item("inbox_items", inboxEntry.id, inboxEntry.title, "Verknüpfter Inbox-Eintrag"));
    const weeklyLinks = (sources.weekly_plans || []).filter((plan) => (plan.outcomes || []).some((entry) => entry.sourceId === projectId)).length;
    summary = `Projekt „${project.title}“ mit ${output.length} realen Hinweisen und ${weeklyLinks} Wochenplanbezug/-bezügen geprüft.`;
  }

  const visibleItems = output.slice(0, limit);
  return {
    status: "preview",
    summary,
    items: visibleItems,
    input,
    sourceEvidence: Object.fromEntries(normalized.allowedSources.map((source) => [source, (sources[source] || []).length])),
    deterministicSteps: normalized.deterministicSteps,
    approvalClass: normalized.approvalClass,
    executionMode: "deterministic-local",
    writesPerformed: false,
    externalActionsPerformed: false,
    modelCalls: false,
    networkCalls: false,
    fileWrites: false,
  };
}
