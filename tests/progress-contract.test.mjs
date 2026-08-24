import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const progressSource = await readFile("data/system-progress.ts", "utf8");
const pageSource = await readFile("app/page.tsx", "utf8");

test("system progress is a discrete structured checklist without a decorative percentage", () => {
  assert.match(progressSource, /status: "complete"/);
  assert.match(progressSource, /"active" \| "complete"/);
  assert.match(progressSource, /"pending" \| "user_action"/);
  assert.match(progressSource, /status: "(?:active|pending|user_action)"/);
  assert.doesNotMatch(progressSource, /progressPercent|percentage|percent:/i);
  assert.match(pageSource, /systemProgress\.items\.filter/);
});

test("system progress exposes verified vault evidence and accessible live status", () => {
  assert.match(progressSource, /27 Markdown · 37 Links · 34 Beziehungen · 0 Writes/);
  assert.match(progressSource, /Google Calendar · Lesen \+ kontrollierte Events/);
  assert.match(progressSource, /Erster kontrollierter Testtermin/);
  assert.match(pageSource, /SYSTEMAUFBAU · FORTSCHRITT/);
  assert.match(pageSource, /aria-live="polite" role="status"/);
  assert.match(pageSource, /progressChecklist/);
});

test("system progress reflects the current recovery audit without fake precision", () => {
  assert.match(progressSource, /lastVerifiedAt: "25\.08\.2026 · Europe\/Berlin"/);
  assert.match(progressSource, /id: "source-recovery-truth"[\s\S]*status: "complete"/);
  assert.match(progressSource, /id: "ongoing-local-gap-audit"[\s\S]*status: "active"/);
  assert.match(progressSource, /Projekt, Usage, Journal und Calendar/);
  for (const id of ["oauth-cache-state-recovery", "calendar-evidence-recovery", "google-transport-boundary", "calendar-single-use-approval", "visible-state-language", "private-api-error-boundary", "private-https-cookie-policy", "structured-read-recovery", "atomic-shared-mutations", "procedure-version-conflicts", "preference-version-conflicts", "preference-source-recovery"]) assert.match(progressSource, new RegExp(`id: "${id}"[\\s\\S]*status: "complete"`));
  assert.match(progressSource, /keine externen Writes, Migrationen, Installationen oder Kosten/);
});
