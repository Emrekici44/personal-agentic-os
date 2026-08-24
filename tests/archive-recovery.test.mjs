import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("archive API is private, cache-free, conflict-aware and content-light", async () => {
  const [route, store] = await Promise.all([
    readFile(new URL("../app/api/state/archive/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /no-store, private/);
  assert.match(route, /status: 401/);
  assert.match(route, /listArchivedRecords/);
  assert.match(route, /restoreArchivedRecord/);
  assert.match(route, /personalContentExposed: false/);
  assert.match(store, /BEGIN IMMEDIATE/);
  assert.match(store, /'restore',kind,id/);
  assert.match(store, /externalActionsPerformed:false/);
  assert.doesNotMatch(store.slice(store.indexOf("export function restoreArchivedRecord"), store.indexOf("export function listSkillDefinitions")), /DELETE FROM|unlinkSync|rmSync/);
});

test("archived records restore safely in an isolated temporary store", () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "agentic-os-archive-"));
  const moduleUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const script = `
    const store = await import(${JSON.stringify(moduleUrl)});
    const project = store.createRecord("projects", { title: "Temporary project", status: "planned" });
    const task = store.createRecord("tasks", { title: "Temporary task", status: "active", projectId: project.id, area: "Projekte", priority: "medium", checklist: [], done: false });
    try { store.archiveRecord("projects", project.id, project.version); throw new Error("project archived with active task"); } catch (error) { if (!String(error.message).includes("aktive Aufgaben")) throw error; }
    store.archiveRecord("tasks", task.id, task.version);
    store.archiveRecord("projects", project.id, project.version);
    const archived = store.listArchivedRecords();
    if (archived.length !== 2 || archived.some((item) => "content" in item || "text" in item)) throw new Error("archive summary contract failed");
    const archivedTask = archived.find((item) => item.id === task.id);
    try { store.restoreArchivedRecord("tasks", task.id, archivedTask.version); throw new Error("task restored before its project"); } catch (error) { if (!String(error.message).includes("Projekt")) throw error; }
    const archivedProject = archived.find((item) => item.id === project.id);
    const restoredProject = store.restoreArchivedRecord("projects", project.id, archivedProject.version);
    if (restoredProject.status !== "planned" || restoredProject.externalActionsPerformed !== false) throw new Error("project status not restored");
    const restoredTask = store.restoreArchivedRecord("tasks", task.id, archivedTask.version);
    if (!restoredTask.restored || restoredTask.deleted) throw new Error("task restore failed");
    if (store.listArchivedRecords().length !== 0 || store.listRecords("tasks").length !== 1) throw new Error("archive did not return to active records");
    try { store.restoreArchivedRecord("tasks", task.id, archivedTask.version); throw new Error("stale restore accepted"); } catch (error) { if (!/nicht gefunden|Datenkonflikt/.test(String(error.message))) throw error; }
  `;
  try {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], { cwd: temporaryRoot, encoding: "utf8", env: { ...process.env, AUTH_SECRET: "archive-contract-local-only-key" } });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("settings expose real archive recovery without claiming a database restore", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  for (const truth of ["DATENSATZ-ARCHIV · LOKAL", "Archiviert statt gelöscht", "Wiederherstellen", "Das ist kein Datenbank-Restore", "keine gelöschten oder Beispiel-Datensätze"]) assert.match(page, new RegExp(truth));
  assert.match(page, /privateApiFetch\("\/api\/state\/archive"/);
  assert.match(page, /method:"PATCH"/);
  assert.match(page, /restoreArchiveArmed!==key/);
  assert.match(page, /Wiederherstellung bestätigen/);
  assert.match(page, /setRestoreArchiveArmed\(""\)/);
  assert.match(css, /\.archiveRecords/);
  assert.match(css, /\.archiveRestoreActions/);
  assert.match(css, /@media\(max-width:720px\)\{\.archiveRecords/);
});

test("project, journal and agent records expose deliberate reversible archive controls", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const contract of ["archiveSelectedProject", "archiveSelectedEntry", "archiveAgent", "Archivierung bestätigen"]) assert.match(page, new RegExp(contract));
  assert.match(page, /setProjectArchiveArmed\(true\)/);
  assert.match(page, /setJournalArchiveArmed\(true\)/);
  assert.match(page, /setAgentArchiveArmed\(true\)/);
});
