import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
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
