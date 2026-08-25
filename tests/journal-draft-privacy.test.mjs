import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("new journal drafts remain session-only instead of plaintext local storage", () => {
  assert.doesNotMatch(page, /store\.set\("journal"/);
  assert.doesNotMatch(page, /setJournal\(store\.get\("journal"/);
  assert.match(page, /Entwurf nur in dieser Sitzung/);
  assert.match(page, /nicht automatisch in Browser- oder Gerätespeicher geschrieben/);
});

test("legacy plaintext drafts require visible import or two-stage discard", () => {
  for (const text of ["Alte lokale Entwurfskopie gefunden", "Alten Entwurf übernehmen", "Lokale Kopie verwerfen …", "Lokale Kopie endgültig verwerfen"]) assert.match(page, new RegExp(text));
  assert.match(page, /legacyDiscardArmed/);
  assert.match(page, /localStorage\.removeItem\("aos:journal"\)/);
  assert.match(page, /localStorage\.removeItem\("ns:journal"\)/);
  assert.match(page, /onSharedJournalSaved\?\.\(\)/);
  assert.match(page, /Die lokale Alt-Kopie wird erst nach dem erfolgreichen gemeinsamen Abschluss entfernt/);
});
