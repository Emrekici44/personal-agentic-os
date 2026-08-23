import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/page.tsx", import.meta.url);
const cssPath = new URL("../app/globals.css", import.meta.url);

test("uses Emre as the local user identity without the mistaken names", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Guten Abend, Emre\./);
  assert.doesNotMatch(page, /\b(?:Eden|Eren)\b/i);
  assert.match(page, /localStorage\.setItem\("aos:" \+ k/);
});

test("keeps the futuristic shell responsive and motion-accessible", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /--bg: #030812/);
  assert.match(css, /--cyan: #2ad7ff/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.mobileNav/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
