import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const proposal = await readFile(new URL("../lib/obsidian-write-proposal.ts", import.meta.url), "utf8");
const store = await readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/obsidian/write-proposals/route.ts", import.meta.url), "utf8");
const ui = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("vault proposal builder is read-only and validates its exact local target", () => {
  assert.match(proposal, /from "node:fs\/promises"/);
  for (const readOnlyOperation of ["lstat", "readFile", "realpath", "stat"]) assert.match(proposal, new RegExp(`\\b${readOnlyOperation}\\b`));
  assert.doesNotMatch(proposal, /writeFile|appendFile|copyFile|rename|unlink|rm\s*\(|mkdir|createWriteStream/);
  assert.match(proposal, /Ziel liegt außerhalb des Vaults/);
  assert.match(proposal, /Symlink-Ziel ist nicht erlaubt/);
  assert.match(proposal, /Ziel muss eine Markdown-Datei sein/);
  assert.match(proposal, /00 Agentic OS\/Inbox/);
  assert.match(proposal, /00 Agentic OS\/System/);
  assert.match(proposal, /expectedNoteCount.*preview\.noteCount/);
});

test("new-note and normalization proposals provide exact diff, conflict and restore evidence", () => {
  assert.match(proposal, /new_system_note/);
  assert.match(proposal, /normalize_existing_note/);
  assert.match(proposal, /exactDiff/);
  assert.match(proposal, /SHA-256/);
  assert.match(proposal, /changed-file copy \+ manifest before atomic replace/);
  assert.match(proposal, /restore exact backup copy only after hash and path verification/);
  assert.match(proposal, /body unchanged byte-for-byte/);
  assert.match(proposal, /existingNotesModified: 0/);
  assert.match(proposal, /applyAvailable: false/);
  assert.match(proposal, /writesPerformed: false/);
});

test("approval token is hashed, expiring, revalidated and cannot apply", () => {
  assert.match(store, /version:8.*CREATE TABLE IF NOT EXISTS vault_write_proposals/s);
  assert.match(store, /target_path_enc TEXT NOT NULL,proposal_enc TEXT NOT NULL/);
  assert.match(store, /Date\.now\(\)\+15\*60\*1000/);
  assert.match(store, /timingSafeEqual/);
  assert.match(store, /OBSIDIAN DIFF FREIGEBEN/);
  assert.match(store, /approved_pending_apply/);
  assert.match(store, /vault_write\.preview/);
  assert.match(store, /vault_write\.approve_preview/);
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /revalidateVaultWriteProposal/);
  assert.match(route, /body\.action !== "approve_preview"/);
  assert.match(route, /Apply ist gesperrt/);
  assert.doesNotMatch(route, /writeFile|copyFile|rename|unlink|child_process/);
});

test("knowledge UI exposes diff and approval boundary without an enabled apply", () => {
  for (const label of ["Exakte Diff-Vorschau erzeugen", "Nur Diff zur Apply-Grenze freigeben", "Apply in Obsidian · gesperrt", "Backupplan", "Restore-Plan"]) assert.match(ui, new RegExp(label, "i"));
  assert.match(ui, /<b>0<\/b>Vault-Writes/);
  assert.match(ui, /<button disabled title="Vault-Schreiben/);
});
