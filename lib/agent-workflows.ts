import crypto from "node:crypto";

export const agentWorkflowProfiles = [
  { id: "project_coach", name: "Projekt-Coach", area: "Projekte", purpose: "Ordnet Ziele, nächste Aktionen, Aufgaben und Wochenplanbezug.", boundary: "Erzeugt nur organisatorische Vorschläge; ändert keine Projekte oder Kalender.", sources: ["projects", "tasks", "inbox", "weekly_plans"] },
  { id: "faith_reflection", name: "Glaubens- & Reflexionsassistent", area: "Glaube", purpose: "Hilft, vorhandene Praxis- und Reflexionseinträge ruhig zu überblicken.", boundary: "Keine religiöse Autorität; sensible Inhalte bleiben lokal und jeder Schreibschritt braucht Freigabe.", sources: ["faith_records", "journal_metadata"] },
  { id: "health_planner", name: "Gesundheitsplaner", area: "Gesundheit", purpose: "Ordnet Training, Erholung, Habits und offene Gesundheitsaufgaben.", boundary: "Nur Organisation, keine Diagnose oder medizinische Fachberatung.", sources: ["health_records", "habits", "tasks"] },
  { id: "finance_overview", name: "Finanzübersichtsassistent", area: "Finanzen", purpose: "Strukturiert manuelle Konten-, Budget-, Ziel- und wiederkehrende Einträge.", boundary: "Keine Finanzberatung, Transaktion, Bankverbindung oder Anlageentscheidung.", sources: ["finance_records", "tasks"] },
  { id: "relationship_care", name: "Beziehungspflege-Assistent", area: "Beziehungen", purpose: "Ordnet vorhandene Personen-, Kontakt- und Follow-up-Einträge datensparsam.", boundary: "Keine Nachrichten oder Erinnerungen werden extern versendet; private Notizen werden nicht protokolliert.", sources: ["relationship_records", "tasks"] },
] as const;

export type AgentWorkflowId = typeof agentWorkflowProfiles[number]["id"];
export const isAgentWorkflowId = (value: unknown): value is AgentWorkflowId => agentWorkflowProfiles.some((profile) => profile.id === value);

type Sources = { projects: any[]; tasks: any[]; inbox: any[]; habits: any[]; journal: any[]; areas: any[]; weeklyPlan: any | null };
const suggestion = (title: string, rationale: string) => ({ id: crypto.randomUUID(), title, rationale, type: "proposal", externalAction: false, requiresSeparateApproval: true });

export function buildAgentWorkflowProposal(workflowId: AgentWorkflowId, userInput: string, sources: Sources, projectId?: string) {
  const input = userInput.trim();
  if (input.length < 2 || input.length > 1000) throw new Error("Arbeitsauftrag muss 2–1000 Zeichen enthalten");
  if (!isAgentWorkflowId(workflowId)) throw new Error("Unbekannter Workflow");
  const area = (name: string) => sources.areas.filter((record) => record.area === name);
  const proposed: Array<ReturnType<typeof suggestion>> = [];
  let summary = "";
  if (workflowId === "project_coach") {
    const projects = projectId ? sources.projects.filter((project) => project.id === projectId) : sources.projects;
    if (projectId && !projects.length) throw new Error("Ausgewähltes Projekt wurde nicht gefunden");
    const tasks = projectId ? sources.tasks.filter((task) => task.projectId === projectId) : sources.tasks;
    const inbox = projectId ? sources.inbox.filter((item) => item.projectId === projectId) : sources.inbox;
    summary = projects.length ? `${projects.length} echte Projekte, ${tasks.filter((task) => !task.done).length} offene Aufgaben und ${inbox.length} verknüpfte Inbox-Einträge ausgewertet.` : "Keine echten Projekte im gemeinsamen Store gefunden.";
    if (!projects.length) proposed.push(suggestion("Erstes echtes Projekt abgrenzen", "Ziel, Ergebnis und einen kleinsten nächsten Schritt bewusst erfassen."));
    else {
      const missingGoal = projects.filter((project) => !project.goal).length, missingNext = projects.filter((project) => !project.nextAction).length;
      if (missingGoal) proposed.push(suggestion("Offene Projektziele klären", `${missingGoal} Projekt(e) haben noch kein überprüfbares Ziel.`));
      if (missingNext) proposed.push(suggestion("Nächste Aktionen konkretisieren", `${missingNext} Projekt(e) haben noch keinen nächsten Schritt.`));
      if (tasks.some((task) => !task.done)) proposed.push(suggestion("Offene Projektaufgaben priorisieren", "Nur die wichtigsten offenen Aufgaben für den nächsten Wochenplan prüfen."));
    }
  } else if (workflowId === "faith_reflection") {
    const records = area("faith");
    summary = records.length ? `${records.length} vorhandene Glaubens-/Reflexionseinträge und ${sources.journal.length} Journal-Metadatensätze organisatorisch ausgewertet.` : "Keine vorhandenen Glaubens-/Reflexionseinträge im gemeinsamen Store gefunden.";
    proposed.push(records.length ? suggestion("Ruhigen Reflexionspunkt auswählen", "Einen vorhandenen Eintrag bewusst ansehen; keine religiöse Bewertung wird erzeugt.") : suggestion("Optional einen ersten Reflexionseintrag erfassen", "Nur wenn gewünscht; Agentic OS gibt keine religiöse Praxis vor."));
  } else if (workflowId === "health_planner") {
    const records = area("health"), healthTasks = sources.tasks.filter((task) => /gesund|health|training|erholung|recovery/i.test(`${task.area || ""} ${task.title || ""}`));
    summary = `${records.length} Gesundheitsdatensätze, ${sources.habits.length} Habits und ${healthTasks.length} passende Aufgaben organisatorisch ausgewertet.`;
    proposed.push(records.length || sources.habits.length ? suggestion("Training und Erholung gemeinsam prüfen", "Belastung, Routinen und vorhandene Recovery-Einträge ohne medizinische Interpretation gegenüberstellen.") : suggestion("Nur gewünschte Gesundheitsgrundlagen erfassen", "Keine Diagnose; zunächst höchstens Training, Erholung oder eine Routine dokumentieren."));
  } else if (workflowId === "finance_overview") {
    const records = area("finance");
    summary = `${records.length} manuelle Finanzdatensätze ausgewertet; keine Bankdaten oder Transaktionen abgerufen.`;
    proposed.push(records.length ? suggestion("Manuelle Übersicht auf Lücken prüfen", "Kontenrahmen, wiederkehrende Posten, Budgets und Ziele nur organisatorisch abgleichen.") : suggestion("Optional eine manuelle Finanzstruktur beginnen", "Nur selbst gewählte Container oder Ziele erfassen; keine Finanz- oder Anlageberatung."));
  } else {
    const records = area("relations");
    summary = `${records.length} private Beziehungseinträge datensparsam ausgewertet; keine Nachricht oder Erinnerung versendet.`;
    proposed.push(records.length ? suggestion("Einen passenden Follow-up bewusst auswählen", "Vorhandene Kontaktpflege prüfen, ohne private Notizinhalte im Audit zu speichern.") : suggestion("Optional eine Person oder wichtige Frist erfassen", "Nur mit bewusst gewählten Angaben; es wird niemand automatisch kontaktiert."));
  }
  return {
    workflowId, input, summary, suggestions: proposed.slice(0, 5),
    sourceEvidence: { projects: sources.projects.length, tasks: sources.tasks.length, inbox: sources.inbox.length, habits: sources.habits.length, journal: sources.journal.length, areaRecords: sources.areas.length, weeklyPlanAvailable: Boolean(sources.weeklyPlan) },
    provider: "local-rules", model: "none", cost: "free-local", status: "proposal", currentStep: "review", externalActionsPerformed: false, backgroundActions: false, professionalAdvice: false,
  };
}
