import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { validateRecord } from "../lib/shared-store.ts";

test("project records validate professional fields without inserting defaults", () => {
  const valid = validateRecord("projects", { title: "Eigenes Vorhaben", status: "active", goal: "Ein überprüfbares Ergebnis", nextAction: "Nächsten Schritt klären", dueDate: "2026-09-30" });
  assert.equal(valid.title, "Eigenes Vorhaben");
  assert.equal(valid.goal, "Ein überprüfbares Ergebnis");
  assert.throws(() => validateRecord("projects", { title: "Projekt", goal: "x".repeat(1201) }), /1200/);
  assert.throws(() => validateRecord("projects", { title: "Projekt", dueDate: "30.09.2026" }), /gültiges Datum/);
  assert.throws(() => validateRecord("tasks", { title: "Aufgabe", projectId: "foreign" }), /Projektzuordnung/);
});

test("project workspace API is private, content-light and linked to real shared records", async () => {
  const [store, route] = await Promise.all([
    readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/projects/[id]/workspace/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(store, /function assertProjectLink/);
  assert.match(store, /UPDATE projects SET title=/);
  assert.match(store, /UPDATE tasks SET project_id=/);
  assert.match(store, /UPDATE inbox_items SET item_type=/);
  assert.match(store, /export function projectWorkspace/);
  assert.match(store, /sourceKind==='project'/);
  assert.match(store, /personalContentExposed:false,writesPerformed:false/);
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /projectWorkspace\(id\)/);
  assert.match(route, /no-store, private/);
});

test("project UI exposes real detail workflows and no fake execution surfaces", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  for (const label of ["ZIEL & AUSRICHTUNG", "NÄCHSTE AKTION", "PROJEKT-INBOX", "UNZUGEORDNETE INBOX", "VERLAUF · INHALTSARMER AUDIT", "WOCHENPLANBEZUG"]) assert.match(page, new RegExp(label));
  assert.match(page, /createTask\(\{[^}]*projectId: selectedId/s);
  assert.match(page, /updateInbox\(\{ \.\.\.item, projectId/);
  assert.doesNotMatch(page, /<i>WP<\/i>|<i>PC<\/i>/);
  assert.doesNotMatch(page, /"Timeline"/);
  assert.match(css, /@media\(max-width:680px\).*projectWorkspaceGrid/s);
  assert.match(css, /\.projectTabs\{[^}]*overflow:auto/);
});

test("project resources are encrypted references and never file operations", async () => {
  const [page, css, store] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8"),
  ]);
  for (const truth of ["PRIVATE RESSOURCENREFERENZ", "Es öffnet, kopiert oder lädt keine Datei hoch", "Privat anzeigen", "Lokaler Dateiverweis"]) assert.match(page, new RegExp(truth));
  assert.match(page, /itemType:resourceDraft\.kind/);
  assert.match(page, /projectResources = projectInbox\.filter/);
  assert.match(store, /\['link','dateiverweis'\]\.includes\(itemType\)/);
  assert.match(store, /Link muss eine vollständige http\(s\)-Adresse sein/);
  assert.match(store, /content\?encryptSensitive\(\{content:data\.content\}\)/);
  assert.doesNotMatch(page, /window\.open\(resourceDraft|showOpenFilePicker|input[^>]+type="file"/);
  assert.doesNotMatch(store, /copyFileSync|renameSync|writeFileSync|unlinkSync/);
  assert.match(css, /@media\(max-width:680px\).*projectResourceForm/s);
});

test("resource validation and encrypted roundtrip use an isolated temporary store", () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "agentic-os-resources-"));
  const moduleUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const script = `
    const store = await import(${JSON.stringify(moduleUrl)});
    const project = store.createRecord("projects", { title: "Temporary project", status: "active" });
    const link = store.createRecord("inbox_items", { title: "Technical reference", content: "https://example.invalid/reference", itemType: "link", projectId: project.id, area: "Projekte", status: "active" });
    const visible = store.listRecords("inbox_items").find((item) => item.id === link.id);
    if (visible.content !== "https://example.invalid/reference") throw new Error("encrypted reference did not roundtrip");
    const workspace = store.projectWorkspace(project.id);
    if (workspace.counts.resources !== 1 || workspace.personalContentExposed !== false) throw new Error("resource count contract failed");
    try { store.createRecord("inbox_items", { title: "Bad URL", content: "javascript:alert(1)", itemType: "link", projectId: project.id, area: "Projekte" }); throw new Error("unsafe link accepted"); } catch (error) { if (!String(error.message).includes("http(s)")) throw error; }
    try { store.createRecord("inbox_items", { title: "Unknown kind", content: "x", itemType: "binary", projectId: project.id, area: "Projekte" }); throw new Error("unknown kind accepted"); } catch (error) { if (!String(error.message).includes("Inbox-Typ")) throw error; }
  `;
  try {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], { cwd: temporaryRoot, encoding: "utf8", env: { ...process.env, AUTH_SECRET: "resource-contract-local-only-key" } });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
