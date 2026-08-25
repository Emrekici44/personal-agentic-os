import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("backup, diagnosis and archive timestamps share Europe Berlin display time", () => {
  assert.match(page, /const berlinDateTime = new Intl\.DateTimeFormat\("de-DE", \{ dateStyle: "short", timeStyle: "short", timeZone: "Europe\/Berlin" \}\)/);
  assert.match(page, /berlinDateTime\.format\(new Date\(backup\.createdAt\)\)/);
  assert.match(page, /berlinDateTime\.format\(new Date\(diagnosis\.latestBackupAt\)\)/);
  assert.match(page, /berlinDateTime\.format\(new Date\(record\.archivedAt\)\)/);
  assert.doesNotMatch(page, /new Intl\.DateTimeFormat\("de-DE",\s*\{\s*dateStyle:\s*"short",\s*timeStyle:\s*"short"\s*\}\)/);
});
