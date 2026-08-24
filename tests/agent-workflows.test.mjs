import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { agentWorkflowProfiles, buildAgentWorkflowProposal } from "../lib/agent-workflows.ts";

const emptySources = { projects: [], tasks: [], inbox: [], habits: [], journal: [], areas: [], weeklyPlan: null };

test("all five core workflows produce local proposals without actions or advice claims", () => {
  assert.deepEqual(agentWorkflowProfiles.map((profile) => profile.id), ["project_coach", "faith_reflection", "health_planner", "finance_overview", "relationship_care"]);
  for (const profile of agentWorkflowProfiles) {
    const result = buildAgentWorkflowProposal(profile.id, "Bitte den nächsten sinnvollen Überblick strukturieren", emptySources);
    assert.equal(result.status, "proposal");
    assert.equal(result.provider, "local-rules");
    assert.equal(result.model, "none");
    assert.equal(result.cost, "free-local");
    assert.equal(result.externalActionsPerformed, false);
    assert.equal(result.backgroundActions, false);
    assert.equal(result.professionalAdvice, false);
    assert.ok(result.suggestions.length > 0 && result.suggestions.length <= 5);
    assert.ok(result.suggestions.every((item) => item.type === "proposal" && item.externalAction === false && item.requiresSeparateApproval === true));
  }
});

test("workflow inputs and selected project references are strictly validated", () => {
  assert.throws(() => buildAgentWorkflowProposal("project_coach", "", emptySources), /2–1000/);
  assert.throws(() => buildAgentWorkflowProposal("project_coach", "x".repeat(1001), emptySources), /2–1000/);
  assert.throws(() => buildAgentWorkflowProposal("project_coach", "Projekt prüfen", emptySources, "foreign"), /nicht gefunden/);
});

test("workflow persistence is encrypted, resumable, audited and private", async () => {
  const [store, route, page] = await Promise.all([
    readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/agents/workflows/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(store, /CREATE TABLE IF NOT EXISTS agent_workflow_runs/);
  for (const field of ["input_enc", "output_enc", "resume_enc"]) assert.match(store, new RegExp(field));
  assert.match(store, /encryptSensitive\(\{input:/);
  assert.match(store, /agent_workflow\.generate/);
  assert.match(store, /agent_workflow\.\$\{action\}/);
  assert.match(store, /externalActionApproved:false/);
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /listRecords\("projects"\)/);
  assert.match(route, /proposalOnly: true, paidApiUsed: false, externalActionsPerformed: false/);
  assert.doesNotMatch(route, /api\.openai|responses\.create|chat\.completions/);
  for (const label of ["Review speichern", "Pausieren", "Workflow fortsetzen", "Vorschlag lokal erzeugen", "Lokale Regeln"]) assert.match(page, new RegExp(label));
  assert.match(page, /keine Folgeaktion ausgeführt/i);
});

test("custom agent configuration is explicit, validated and never claims model execution", async () => {
  const [store, route, page] = await Promise.all([
    readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/records/[kind]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(store, /validateAgentConfig/);
  assert.match(store, /\['subscription','none'\]/);
  assert.match(store, /\['chatgpt-companion-manual','none'\]/);
  assert.match(store, /Eigene Agent-Konfiguration ist nicht ausführbar/);
  assert.match(route, /kind === "agents" \? validateAgentConfig\(body\) : body/);
  for (const label of ["Zugeordnete Lebensbereiche", "ChatGPT Companion · manuell", "Kein Modell", "Keine Ausführung", "Konfiguration speichern"]) assert.match(page, new RegExp(label));
  assert.match(page, /OpenAI API · Kostenfreigabe nötig/);
});
