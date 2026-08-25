import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const companion = await readFile(new URL("../apps/mobile/src/Companion.tsx", import.meta.url), "utf8");

test("Expo companion retries a failed private view once when iOS returns active", () => {
  assert.match(companion, /AppState\.addEventListener\("change"/);
  assert.match(companion, /inactive\|background/);
  assert.match(companion, /next === "active"/);
  assert.match(companion, /resumed && failed/);
  assert.match(companion, /retry\(\)/);
  assert.match(companion, /subscription\.remove\(\)/);
});

test("Expo recovery remains explicit and does not poll or broaden navigation", () => {
  assert.doesNotMatch(companion, /setInterval/);
  assert.match(companion, /actionLabel="Verbindung erneut prüfen"/);
  assert.match(companion, /target\.origin === config\.origin/);
  assert.match(companion, /onContentProcessDidTerminate/);
  assert.match(companion, /cacheEnabled=\{false\}/);
});
