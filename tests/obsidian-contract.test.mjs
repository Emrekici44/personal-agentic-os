import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const adapterPath = new URL("../lib/obsidian-vault.ts", import.meta.url);
const routePath = new URL("../app/api/obsidian/status/route.ts", import.meta.url);
const pagePath = new URL("../app/page.tsx", import.meta.url);

test("Obsidian adapter remains local, read-only, bounded, and metadata-first", async () => {
  const adapter = await readFile(adapterPath, "utf8");

  assert.match(adapter, /AGENTIC_OS_OBSIDIAN_VAULT/);
  assert.match(adapter, /\.obsidian/);
  assert.match(adapter, /\.trash/);
  assert.match(adapter, /attachments/);
  assert.match(adapter, /entry\.isSymbolicLink\(\)/);
  assert.match(adapter, /endsWith\("\.md"\)/);
  assert.match(adapter, /MAX_NOTE_BYTES/);
  assert.match(adapter, /readOnly: true/);
  assert.match(adapter, /writesEnabled: false/);
  assert.doesNotMatch(adapter, /writeFile|rename\(|unlink\(|rm\(/);
});

test("Obsidian health API is private, hides local errors, and disables writes", async () => {
  const route = await readFile(routePath, "utf8");

  assert.match(route, /verifyLocalSession/);
  assert.match(route, /agentic_os_local_session/);
  assert.match(route, /cache-control": "no-store, private"/);
  assert.match(route, /Lokale Sitzung erforderlich/);
  assert.match(route, /Vault konnte lokal nicht gelesen werden/);
  assert.match(route, /approvalRequired: true/);
  assert.match(route, /writesEnabled: false/);
});

test("Knowledge UI exposes a metadata-only search and a future write approval gate", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /\/api\/obsidian\/status/);
  assert.match(page, /echter Read-only Index/);
  assert.match(page, /METADATEN-SUCHE · READ-ONLY/);
  assert.match(page, /note\.title/);
  assert.match(page, /note\.relativePath/);
  assert.match(page, /note\.frontmatterKeys/);
  assert.match(page, /keine Volltextkörper gelesen/);
  assert.match(page, /Schreibzugriff gesperrt/);
  assert.match(page, /Vorschau, ausdrückliche Freigabe und Audit/);
});
