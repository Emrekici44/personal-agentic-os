import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile("app/page.tsx", "utf8");

test("a failed shared record source retries only on explicit recovery signals", () => {
  assert.match(page, /if\(state!=="error"\)return;const recover=\(\)=>void load\(\)/);
  assert.match(page, /window\.addEventListener\("focus",recover\)/);
  assert.match(page, /window\.addEventListener\("online",recover\)/);
  assert.match(page, /window\.removeEventListener\("focus",recover\)/);
  assert.match(page, /window\.removeEventListener\("online",recover\)/);
  assert.doesNotMatch(page, /setInterval\([^)]*load/);
});

test("core empty and offline surfaces expose scoped read-only retries", () => {
  for (const label of [
    "Aufgaben neu laden",
    "Bereiche neu laden",
    "Bereich neu laden",
    "Projekte neu laden",
    "Habits neu laden",
    "Journal neu laden",
    "Bibliothek neu laden",
    "Inbox neu laden",
    "Agenten neu laden",
  ]) {
    assert.match(page, new RegExp(`label="${label}"`));
  }
  assert.match(page, /Es werden keine lokalen Ersatz- oder Beispieldaten angezeigt/);
  assert.match(page, /es werden keine Ersatzgespräche angezeigt/);
});

test("shared mutations clear stale controls after private auth or source failures", () => {
  assert.match(page, /response\.status===401\|\|response\.status===403\|\|response\.status>=500/);
  assert.match(page, /setRecords\(\[\]\);setState\('error'\)/);
  assert.match(page, /const privateSourceFailure = \(status: number\) => status === 401 \|\| status === 403 \|\| status >= 500/);
  assert.match(page, /privateSourceFailure\(response\.status\)\) setPreferenceState\("error"\)/);
  assert.match(page, /privateSourceFailure\(response\.status\)\)\{setWorkflowState\(\{state:"error",profiles:\[\],runs:\[\]\}\)/);
  assert.match(page, /privateSourceFailure\(response\.status\)\)\{setSkillState\(\{state:"error",definitions:\[\],runs:\[\],catalog:\[\]\}\)/);
  assert.match(page, /privateSourceFailure\(response\.status\)\)invalidatePlannerSource\(\)/);
  assert.match(page, /privateSourceFailure\(response\.status\)\)invalidateWriteFlow/);
  assert.match(page, /privateSourceFailure\(response\.status\)\)invalidateBackupSource\(\)/);
});

test("agent and skill cross-source controls expose their own recovery", () => {
  for (const label of ["Skill-Referenzen neu laden", "Projekte neu laden"]) {
    assert.match(page, new RegExp(`label="${label}"`));
  }
  assert.match(page, /Projektbezüge für den Projekt-Coach sind gerade nicht verifizierbar/);
  assert.match(page, /Projektquelle für Projekt-Skills ist gerade nicht verifizierbar/);
});
