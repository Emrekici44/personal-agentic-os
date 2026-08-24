import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { executeLocalSkill, normalizeSkillDefinition, skillProcedureCatalog, skillSafetyContract } from "../lib/local-skills.mjs";

const source = await readFile(new URL("../lib/local-skills.mjs", import.meta.url), "utf8");
const store = await readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/skills/route.ts", import.meta.url), "utf8");
const ui = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("catalog exposes only fixed deterministic local procedures", () => {
  assert.deepEqual(skillProcedureCatalog.map((item) => item.id), ["priority_review", "daily_check", "area_overview", "project_snapshot"]);
  assert.equal(skillSafetyContract.approvalClass, "local_read_proposal");
  for (const permission of ["arbitraryCode", "shell", "dynamicImports", "network", "fileWrites", "modelCalls", "externalWrites", "backgroundChains"]) assert.equal(skillSafetyContract[permission], false);
  assert.doesNotMatch(source, /child_process|\beval\s*\(|new\s+Function|\bfetch\s*\(|import\s*\(/);
});

test("definition validation pins schema, sources, agents and approval class", () => {
  const definition = normalizeSkillDefinition({ name: "Prioritäten", purpose: "Offene Einträge nachvollziehbar ordnen", procedureId: "priority_review", allowedSources: ["tasks"], assignedAgentWorkflowIds: ["project_coach"] });
  assert.equal(definition.executionMode, "deterministic-local");
  assert.equal(definition.approvalClass, "local_read_proposal");
  assert.deepEqual(definition.allowedSources, ["tasks"]);
  assert.equal(definition.inputSchema.focus.required, true);
  assert.throws(() => normalizeSkillDefinition({ ...definition, allowedSources: ["finance_accounts"] }), /Nicht erlaubte Datenquelle/);
  assert.throws(() => normalizeSkillDefinition({ ...definition, assignedAgentWorkflowIds: ["unknown_agent"] }), /Unbekannte Agentenzuordnung/);
  assert.throws(() => normalizeSkillDefinition({ ...definition, procedureId: "shell" }), /Unbekannte lokale Prozedur/);
});

test("preview execution is deterministic, bounded and performs no action", () => {
  const definition = normalizeSkillDefinition({ name: "Prioritäten", purpose: "Offene Einträge nachvollziehbar ordnen", procedureId: "priority_review", allowedSources: ["tasks", "projects"], assignedAgentWorkflowIds: [] });
  const sources = {
    tasks: [{ id: "task-1", title: "Echte Aufgabe", status: "active", done: false, dueAt: "2026-08-25", updatedAt: "2026-08-24" }],
    projects: [{ id: "project-1", title: "Echtes Projekt", status: "active", nextAction: "Nächsten Schritt prüfen" }],
  };
  const first = executeLocalSkill(definition, { focus: "Diese Woche", limit: 2 }, sources);
  const second = executeLocalSkill(definition, { focus: "Diese Woche", limit: 2 }, sources);
  assert.deepEqual(first.items, second.items);
  assert.equal(first.items.length, 2);
  assert.equal(first.writesPerformed, false);
  assert.equal(first.externalActionsPerformed, false);
  assert.equal(first.modelCalls, false);
  assert.equal(first.networkCalls, false);
  assert.equal(first.fileWrites, false);
  assert.throws(() => executeLocalSkill(definition, { focus: "x", limit: 2 }, sources), /2–500/);
  assert.throws(() => executeLocalSkill(definition, { focus: "ok", limit: 6 }, sources), /zwischen 1 und 5/);
});

test("daily, area and project procedures use only real supplied records", () => {
  const daily = normalizeSkillDefinition({ name: "Tagescheck", purpose: "Tag lokal überblicken", procedureId: "daily_check" });
  const dailyOutput = executeLocalSkill(daily, { date: "2026-08-24", limit: 5 }, { tasks: [], habits: [], journal_metadata: [] });
  assert.equal(dailyOutput.items.length, 0);
  assert.match(dailyOutput.summary, /0 offene Aufgaben\/Routinen/);
  const area = normalizeSkillDefinition({ name: "Bereich", purpose: "Bereich lokal überblicken", procedureId: "area_overview" });
  assert.throws(() => executeLocalSkill(area, { area: "unknown", limit: 5 }, { area_records: [], tasks: [], habits: [] }), /Gültiger Lebensbereich/);
  const project = normalizeSkillDefinition({ name: "Projektstand", purpose: "Projekt lokal überblicken", procedureId: "project_snapshot" });
  assert.throws(() => executeLocalSkill(project, { projectId: "not-an-id" }, { projects: [], tasks: [], inbox_items: [], weekly_plans: [] }), /Gültiges Projekt/);
});

test("skill persistence, private API and UI preserve approval and audit boundaries", () => {
  assert.match(store, /version:7.*CREATE TABLE IF NOT EXISTS skill_runs/s);
  assert.match(store, /input_enc TEXT NOT NULL,output_enc TEXT NOT NULL/);
  assert.match(store, /skill\.create|skill\.update|skill\.archive/);
  assert.match(store, /skill\.run\.preview|skill\.run\.review/);
  assert.match(store, /Skills benötigen die sichere Prozedur-API/);
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /loadAllowedSources/);
  assert.match(route, /previewOnly: true/);
  assert.match(route, /externalActionsPerformed: false/);
  assert.doesNotMatch(route, /OpenAI|child_process|exec\s*\(|spawn\s*\(/i);
  for (const label of ["Skill definieren", "Vorschau lokal ausführen", "Archivierung bestätigen", "Vorschau als geprüft markieren", "keine stille Kette"]) assert.match(ui, new RegExp(label, "i"));
});
