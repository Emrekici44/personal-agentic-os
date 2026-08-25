import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { agentDefinitions, getAgentDefinition } from "../lib/runtime/agents/registry.ts";
import { assertAgentRunnable, assertAreaScopeAllowed, assertRiskAllowed, assertSkillAllowed, assertSourceAllowed, assertToolAllowed, RuntimePolicyError } from "../lib/runtime/policies/evaluator.ts";
import { assertExecutableSkill, getRuntimeSkill } from "../lib/runtime/skills/registry.ts";
import { executeReadTool, getToolDefinition, toolDefinitions } from "../lib/runtime/tools/registry.ts";
import { modelAssistedPlanner } from "../lib/runtime/planning/planner.ts";

test("agent definitions and policy evaluator fail closed", async () => {
  assert.equal(agentDefinitions.length, 6);
  assert.throws(() => getAgentDefinition("unknown"), /Unbekannter Agent/);
  assert.throws(() => assertAgentRunnable({ ...agentDefinitions[0], status: "paused" }), RuntimePolicyError);
  assert.throws(() => assertSourceAllowed(getAgentDefinition("health_planner"), "journal_metadata"), /nicht erlaubt/);
  assert.throws(() => assertSkillAllowed(getAgentDefinition("health_planner"), "project_snapshot"), /nicht erlaubt/);
  assert.throws(() => assertToolAllowed(getAgentDefinition("health_planner"), "read_projects"), /nicht erlaubt/);
  assert.throws(() => assertRiskAllowed(getAgentDefinition("health_planner"), "external_mutation"), /nicht erlaubt/);
  assert.throws(() => assertAreaScopeAllowed(getAgentDefinition("health_planner"), "finance"), /nicht erlaubt/);
  assert.throws(() => assertExecutableSkill({ ...getRuntimeSkill("daily_check"), status: "paused" }), /pausiert/);
  assert.throws(() => assertExecutableSkill({ ...getRuntimeSkill("daily_check"), executionMode: "model-assisted" }), /nicht aktiviert/);
  await assert.rejects(() => modelAssistedPlanner.plan({}), /nicht aktiviert/);
});

test("tool registry is a fixed read-only allowlist", () => {
  assert.ok(toolDefinitions.length >= 6);
  assert.ok(toolDefinitions.every((tool) => tool.capability === "read" && tool.requiresApproval === false));
  assert.throws(() => getToolDefinition("shell"), /Unbekanntes Tool/);
  assert.throws(() => getToolDefinition("calendar_write"), /Unbekanntes Tool/);
  assert.deepEqual(executeReadTool("read_tasks", { tasks: () => [] }), []);
  assert.throws(() => executeReadTool("read_tasks", {}), /nicht verfügbar/);
});

test("all built-in agent capabilities resolve through fixed registries",()=>{for(const agent of agentDefinitions){assert.ok(agent.allowedSources.length>0);assert.ok(agent.allowedSkills.includes(agent.defaultSkillId));for(const skill of agent.allowedSkills)assert.doesNotThrow(()=>getRuntimeSkill(skill));for(const tool of agent.allowedTools)assert.doesNotThrow(()=>getToolDefinition(tool));assert.ok(agent.allowedSources.every(source=>agent.contextPolicy.sourcePriorities[source]));assert.deepEqual(agent.permissionPolicy.allowedRiskClasses,["read"]);}});

test("runtime persists bounded context, steps, encrypted memory and no actions", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "agentic-os-runtime-"));
  const serviceUrl = pathToFileURL(path.resolve("lib/runtime/service.ts")).href;
  const storeUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const memoryUrl = pathToFileURL(path.resolve("lib/repositories/memory-repository.ts")).href;
  const runtimeUrl = pathToFileURL(path.resolve("lib/repositories/runtime-repository.ts")).href;
  const script = `
    const store = await import(${JSON.stringify(storeUrl)});
    const { runAgent } = await import(${JSON.stringify(serviceUrl)});
    const memory = await import(${JSON.stringify(memoryUrl)});
    const runtime = await import(${JSON.stringify(runtimeUrl)});
    const project = store.withStoreTransaction(() => store.createRecord("projects", { title: "Runtime Project", status: "active", goal: "Runtime prüfen", nextAction: "Testen" }));
    store.withStoreTransaction(() => store.createRecord("tasks", { title: "Runtime Task", status: "active", projectId: project.id, area: "Projekte", priority: "high", checklist: [], done: false }));
    const foreign = store.withStoreTransaction(() => store.createRecord("projects", { title: "Foreign Project", status: "active" }));
    store.withStoreTransaction(() => store.createRecord("tasks", { title: "Foreign Task", status: "active", projectId: foreign.id, area: "Projekte", priority: "low", checklist: [], done: false }));
    const result = await runAgent({ agentId: "project_coach", input: "Bitte Projektstand sicher prüfen", projectId: project.id });
    if (!result.proposalOnly || result.modelUsed || result.externalActionsPerformed || result.backgroundActions) throw new Error("unsafe runtime result");
    if (result.context.sources.find((entry) => entry.source === "tasks").recordCount !== 1) throw new Error("project context leaked foreign task");
    if (result.run.steps.length < 9 || result.run.steps.some((step) => step.status !== "completed")) throw new Error("run steps missing");
    if (!result.skillExecutions.length || result.run.steps.some((step) => step.evidence?.validationOnly)) throw new Error("skill was not executed");
    if (!result.run.invocationEvents.length || result.run.invocationEvents.some((event) => !["planned","validated","started","completed"].includes(event.status))) throw new Error("invocation lifecycle missing");
    if (result.toolExecutions.length !== 4 || result.toolExecutions.some((item) => item.externalActionsPerformed)) throw new Error("read tools missing or unsafe");
    if (result.memoryCandidate !== null) throw new Error("ordinary run polluted memory");
    const candidate = store.withStoreTransaction(() => memory.createMemoryCandidate({ kind: "observation", scope: "agent", scopeId: "project_coach", content: "Reviewed runtime observation", sourceType: "user_input", sourceId: result.run.id }, "user"));
    const activated = store.withStoreTransaction(() => memory.reviewMemory(candidate.id, "activate", candidate.version, "user"));
    if (activated.status !== "active" || activated.sourceId !== result.run.id) throw new Error("memory activation/provenance failed");
    const rejectedCandidate = store.withStoreTransaction(() => memory.createMemoryCandidate({ kind: "preference", scope: "project", scopeId: project.id, content: "Kurze Vorschläge", sourceType: "user_input", sourceId: "manual" }, "user"));
    const rejected = store.withStoreTransaction(() => memory.reviewMemory(rejectedCandidate.id, "reject", rejectedCandidate.version, "user"));
    if (rejected.status !== "rejected") throw new Error("memory rejection failed");
    try { memory.reviewMemory(rejectedCandidate.id, "reject", rejectedCandidate.version, "user"); throw new Error("stale memory version accepted"); } catch (error) { if (!String(error.message).includes("Datenkonflikt")) throw error; }
    const otherProjectCandidate = store.withStoreTransaction(() => memory.createMemoryCandidate({ kind: "fact", scope: "project", scopeId: foreign.id, content: "Foreign project memory", sourceType: "user_input" }, "user"));
    store.withStoreTransaction(() => memory.reviewMemory(otherProjectCandidate.id, "activate", otherProjectCandidate.version, "user"));
    const financeCandidate = store.withStoreTransaction(() => memory.createMemoryCandidate({ kind: "observation", scope: "area", scopeId: "finance", content: "Foreign area memory", sourceType: "user_input" }, "user"));
    store.withStoreTransaction(() => memory.reviewMemory(financeCandidate.id, "activate", financeCandidate.version, "user"));
    try { memory.createMemoryCandidate({ kind: "policy", scope: "global", content: "Never write", sourceType: "runtime" }, "agent"); throw new Error("agent policy accepted"); } catch (error) { if (!String(error.message).includes("Policy")) throw error; }
    try { memory.reviewMemory(rejectedCandidate.id, "activate", rejectedCandidate.version, "agent"); throw new Error("agent activation accepted"); } catch (error) { if (!String(error.message).match(/Nutzerentscheidung|Datenkonflikt/)) throw error; }
    const retrieved = memory.retrieveActiveMemories((await import(${JSON.stringify(pathToFileURL(path.resolve("lib/runtime/agents/registry.ts")).href)})).getAgentDefinition("project_coach"), project.id, "projects");
    if (!retrieved.some((item) => item.id === activated.id) || retrieved.some((item) => item.id === rejected.id)) throw new Error("scope retrieval failed");
    if (retrieved.some((item) => item.id === otherProjectCandidate.id || item.id === financeCandidate.id)) throw new Error("cross-project or cross-area memory leaked");
    const superseded = store.withStoreTransaction(() => memory.supersedeMemory(activated.id, activated.version, "user"));
    if (superseded.status !== "superseded") throw new Error("memory supersede failed");
    try { memory.supersedeMemory(otherProjectCandidate.id, 2, "agent"); throw new Error("agent supersede accepted"); } catch (error) { if (!String(error.message).includes("Nutzerentscheidung")) throw error; }
    const persisted = runtime.listRuntimeRuns().find((run) => run.id === result.run.id);
    if (!persisted || persisted.steps.length < 9 || persisted.steps.some((step, index) => step.index !== index + 1) || persisted.invocationEvents.length !== result.run.invocationEvents.length) throw new Error("runtime persistence or step ordering failed");
    try { await runAgent({ agentId: "project_coach", input: "Nicht erlaubten Skill prüfen", projectId: project.id, requestedSkillId: "area_overview" }); throw new Error("disallowed skill ran"); } catch (error) { if (!String(error.message).includes("nicht erlaubt")) throw error; }
    const failed = runtime.listRuntimeRuns().find((entry) => entry.runtimeStatus === "failed"); if (!failed || failed.steps[0]?.status !== "failed" || failed.output.errorCategory !== "policy") throw new Error("failed run was not persisted safely");
    const { DatabaseSync } = await import("node:sqlite");
    const pathModule = await import("node:path");
    const database = new DatabaseSync(pathModule.join(process.cwd(), "local-state", "agentic-os.sqlite"));
    const auditCount = database.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE entity_id=? AND action IN ('agent.run.created','agent.context.built','agent.plan.generated')").get(result.run.id).count;
    if (auditCount !== 3) throw new Error("runtime audit missing");
    database.close();
  `;
  try {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], { cwd: root, encoding: "utf8", env: { ...process.env, AUTH_SECRET: "runtime-foundation-test-secret" } });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const raw = readFileSync(path.join(root, "local-state", "agentic-os.sqlite"), "utf8");
    assert.doesNotMatch(raw, /Bitte Projektstand sicher prüfen|Kurze Vorschläge|lokaler Vorschlagslauf/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("runtime and local skills contain no model, network, shell or file execution path", () => {
  const files = ["lib/runtime/service.ts", "lib/runtime/planning/planner.ts", "lib/runtime/context/builder.ts", "lib/runtime/skills/registry.ts", "lib/runtime/skills/service.ts", "lib/runtime/tools/registry.ts", "lib/runtime/tools/service.ts", "lib/local-skills.mjs"].map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(files, /child_process|execSync|spawnSync|\bfetch\s*\(|writeFile|appendFile|responses\.create|chat\.completions/);
  assert.doesNotMatch(files, /new\s+Function|\beval\s*\(|import\s*\([^)]/);
  assert.match(files, /externalActionsPerformed: false/);
  assert.match(files, /modelUsed: false/);
  assert.match(files, /backgroundActions: false/);
});
