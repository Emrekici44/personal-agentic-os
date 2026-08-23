import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Google OAuth JSON import stays local, validates callback, and never prints credentials", async () => {
  const script = await readFile("scripts/import-google-oauth.ps1", "utf8");
  const launcher = await readFile("Agentic OS - Google lokal importieren.cmd", "utf8");

  assert.match(script, /client_secret\*\.json/);
  assert.match(script, /http:\/\/localhost:3000\/api\/calendar\/callback/);
  assert.match(script, /\.env\.local/);
  assert.match(script, /GOOGLE_CLIENT_ID/);
  assert.match(script, /GOOGLE_CLIENT_SECRET/);
  assert.doesNotMatch(script, /Write-Host.*client_(?:id|secret)/i);
  assert.match(launcher, /import-google-oauth\.ps1/);
});
