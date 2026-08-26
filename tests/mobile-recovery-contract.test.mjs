import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const companion = await readFile(new URL("../apps/mobile/src/Companion.tsx", import.meta.url), "utf8");
const shell = await readFile(new URL("../apps/mobile/src/ShellScreen.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

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
  assert.match(companion, /setTimeout\(\(\) => setFailed\(true\), 12000\)/);
  assert.match(companion, /onLoadEnd=\{\(\) => \{[\s\S]*?setLoading\(false\)/);
});

test("Expo stays a thin safe-area-aware shell around the shared product", () => {
  assert.match(companion, /source=\{\{ uri: config\.url \}\}/);
  assert.doesNotMatch(companion, /useSafeAreaInsets/);
  assert.match(shell, /useSafeAreaInsets/);
  assert.match(companion, /contentInsetAdjustmentBehavior="never"/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test("mobile shell and navigation use the simplified personal product language", () => {
  for (const label of ["Agentic OS wird geöffnet", "Personal OS nicht erreichbar", "Verbindung einrichten"]) assert.match(companion, new RegExp(label));
  for (const retired of ["TAILNET LINK INITIALIZING", "LOCAL LINK INITIALIZING", "EXPO SHELL PREVIEW"]) assert.doesNotMatch(companion, new RegExp(retired));
  for (const primary of ["Heute", "Leben", "Projekte", "Planung"]) assert.match(page, new RegExp(`"${primary}"`));
  assert.match(page, />Mehr<\/span>/);
  for (const secondary of ["Agenten & Skills", "Wissen", "Verbindungen", "Einstellungen"]) assert.match(page, new RegExp(`"${secondary}"`));
  assert.match(page, /className="mobileMore"/);
  assert.match(css, /max-height:500px/);
});
