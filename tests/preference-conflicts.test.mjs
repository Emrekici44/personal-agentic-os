import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("shared theme and branding reject stale device versions", () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "agentic-os-preference-conflict-"));
  const storeUrl = pathToFileURL(path.resolve("lib/shared-store.ts")).href;
  const script = `
    const store = await import(${JSON.stringify(storeUrl)});
    const initialTheme = store.getPreference("theme");
    if (initialTheme.version !== 0 || initialTheme.source !== "default") throw new Error("default preference must start at version zero");
    const savedTheme = store.withStoreTransaction(() => store.setPreference("theme", "light", initialTheme.version));
    if (savedTheme.version !== 1) throw new Error("first persisted preference must be version one");
    try { store.withStoreTransaction(() => store.setPreference("theme", "dark", initialTheme.version)); throw new Error("stale theme accepted"); }
    catch (error) { if (!String(error.message).startsWith("Datenkonflikt")) throw error; }
    if (store.getPreference("theme").value !== "light") throw new Error("newer theme was overwritten");
    const initialBranding = store.getPreference("branding");
    const savedBranding = store.withStoreTransaction(() => store.setPreference("branding", { name: "Temporary OS", short: "T", accent: "#27d3ff" }, initialBranding.version));
    try { store.withStoreTransaction(() => store.setPreference("branding", { name: "Stale OS", short: "S", accent: "#112233" }, initialBranding.version)); throw new Error("stale branding accepted"); }
    catch (error) { if (!String(error.message).startsWith("Datenkonflikt")) throw error; }
    if (store.getPreference("branding").version !== savedBranding.version) throw new Error("newer branding version changed");
  `;
  try {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], { cwd: temporaryRoot, encoding: "utf8", env: { ...process.env, AUTH_SECRET: "preference-conflict-contract-key" } });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("desktop and iPhone preference client reloads the shared source on 409", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/state/preferences/[id]/route.ts", import.meta.url), "utf8");
  assert.match(page, /preferenceVersions\.current\.theme/);
  assert.match(page, /preferenceVersions\.current\.branding/);
  assert.match(page, /response\.status === 409[\s\S]*await loadPreferences\(\)/);
  assert.match(page, /Theme nicht gespeichert · gemeinsamer Stand bleibt unverändert/);
  assert.match(route, /setPreference\(id, body\.value, body\.version\)/);
  assert.match(route, /publicConflict\(error\) \? 409/);
});
