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
