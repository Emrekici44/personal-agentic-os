import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("skill, workflow and planner transitions reject stale clients", () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "agentic-os-procedure-conflict-"));
  const storeUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const workflowUrl = pathToFileURL(path.resolve("lib/agent-workflows.ts")).href;
  const skillUrl = pathToFileURL(path.resolve("lib/local-skills.mjs")).href;
  const plannerUrl = pathToFileURL(path.resolve("lib/weekly-planner.ts")).href;
  const script = `
    const store = await import(${JSON.stringify(storeUrl)});
    const { buildAgentWorkflowProposal } = await import(${JSON.stringify(workflowUrl)});
    const { executeLocalSkill } = await import(${JSON.stringify(skillUrl)});
    const { buildWeeklyPlan } = await import(${JSON.stringify(plannerUrl)});
    const skill = store.withStoreTransaction(() => store.createSkillDefinition({ name: "Temporary Skill", purpose: "Temporary conflict contract", procedureId: "priority_review", allowedSources: ["tasks"], assignedAgentWorkflowIds: [] }));
    const skillV2 = store.withStoreTransaction(() => store.updateSkillDefinition(skill.id, { ...skill, name: "Temporary Skill v2" }));
    try { store.withStoreTransaction(() => store.updateSkillDefinition(skill.id, { ...skill, name: "Stale Skill" })); throw new Error("stale skill update accepted"); }
    catch (error) { if (!String(error.message).startsWith("Datenkonflikt")) throw error; }
    try { store.withStoreTransaction(() => store.archiveSkillDefinition(skill.id, skill.version)); throw new Error("stale skill archive accepted"); }
    catch (error) { if (!String(error.message).startsWith("Datenkonflikt")) throw error; }
    if (store.listSkillDefinitions()[0].version !== skillV2.version) throw new Error("newer skill lost");
    const preview = executeLocalSkill(skillV2, { focus: "Temporary focus", limit: 1 }, { tasks: [] });
    const run = store.withStoreTransaction(() => store.saveSkillRun(skillV2, preview));
    store.withStoreTransaction(() => store.reviewSkillRun(run.id, run.version));
    try { store.withStoreTransaction(() => store.reviewSkillRun(run.id, run.version)); throw new Error("stale skill run review accepted"); }
    catch (error) { if (!String(error.message).startsWith("Datenkonflikt")) throw error; }
    const sources = { projects: [], tasks: [], inbox: [], habits: [], journal: [], areas: [], weeklyPlan: null };
    const workflow = store.withStoreTransaction(() => store.saveAgentWorkflowRun(buildAgentWorkflowProposal("project_coach", "Temporary workflow contract", sources)));
    store.withStoreTransaction(() => store.transitionAgentWorkflowRun(workflow.id, "pause", { version: workflow.version }));
    try { store.withStoreTransaction(() => store.transitionAgentWorkflowRun(workflow.id, "review", { version: workflow.version, selectedSuggestionIds: [] })); throw new Error("stale workflow transition accepted"); }
    catch (error) { if (!String(error.message).startsWith("Datenkonflikt")) throw error; }
    const calendars = [{ id: "projects", summary: "Projects", writable: true }];
    const proposal = buildWeeklyPlan({ now: new Date("2026-08-24T08:00:00Z"), calendars, selectedCalendarIds: ["projects"], events: [], tasks: [{ id: "task", title: "Temporary outcome", status: "active", done: false }], inbox: [], projects: [] });
    const plan = store.saveWeeklyPlan(proposal);
    store.withStoreTransaction(() => store.reviewWeeklyPlan(plan.id, { version: plan.version, selectedOutcomeIds: [plan.outcomes[0].id], selectedBlockIds: plan.blocks.map((block) => block.id) }));
    try { store.withStoreTransaction(() => store.reviewWeeklyPlan(plan.id, { version: plan.version, selectedOutcomeIds: [plan.outcomes[0].id], selectedBlockIds: [] })); throw new Error("stale planner review accepted"); }
    catch (error) { if (!String(error.message).startsWith("Datenkonflikt")) throw error; }
  `;
  try {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], { cwd: temporaryRoot, encoding: "utf8", env: { ...process.env, AUTH_SECRET: "procedure-conflict-contract-key" } });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("desktop and mobile web clients send versions and reload on 409", async () => {
  const page = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../app/page.tsx", import.meta.url), "utf8"));
  for (const marker of ["version: activeRun.version", "version:editing.version", "version:selectedRun.version", "version: plan.version"]) assert.match(page, new RegExp(marker.replace(/[.:]/g, "\\$&")));
  assert.match(page, /response\.status===409\)await loadWorkflows\(\)/);
  assert.match(page, /response\.status===409\)await loadSkills\(\)/);
  assert.match(page, /response\.status===409&&url==="\/api\/planner"\)await load\(\)/);
});
