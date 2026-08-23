import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const progressSource = await readFile("data/system-progress.ts", "utf8");
const pageSource = await readFile("app/page.tsx", "utf8");

test("system progress is a discrete structured checklist without a decorative percentage", () => {
  assert.match(progressSource, /status: "complete"/);
  assert.match(progressSource, /status: "active"/);
  assert.match(progressSource, /status: "user_action"/);
  assert.doesNotMatch(progressSource, /progressPercent|percentage|percent:/i);
  assert.match(pageSource, /systemProgress\.items\.filter/);
});

test("system progress exposes verified vault evidence and accessible live status", () => {
  assert.match(progressSource, /27 Markdown · 37 Links · 34 Beziehungen · 0 Writes/);
  assert.match(progressSource, /Google Calendar · Read-only OAuth/);
  assert.match(pageSource, /SYSTEMAUFBAU · FORTSCHRITT/);
  assert.match(pageSource, /aria-live="polite" role="status"/);
  assert.match(pageSource, /progressChecklist/);
});
