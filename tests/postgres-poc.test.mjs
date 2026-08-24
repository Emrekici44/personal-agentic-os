import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("PostgreSQL proof of concept remains loopback-only and migration-free", async () => {
  const compose = await readFile(new URL("../infra/postgres/compose.yaml", import.meta.url), "utf8");
  const evaluation = await readFile(new URL("../docs/DATA-SERVER-EVALUATION.md", import.meta.url), "utf8");
  assert.match(compose, /127\.0\.0\.1:55432:5432/);
  assert.match(compose, /profiles: \["poc"\]/);
  assert.match(compose, /POSTGRES_PASSWORD:\s+\$\{POSTGRES_PASSWORD:\?/);
  assert.doesNotMatch(compose, /restart:\s+always/);
  assert.match(evaluation, /keine Nutzerdaten/i);
  assert.match(evaluation, /nicht ausgeführt/i);
});
