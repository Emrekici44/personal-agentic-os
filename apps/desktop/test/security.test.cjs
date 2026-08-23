const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const main = readFileSync(join(__dirname, "..", "main.cjs"), "utf8");

test("desktop renderer is isolated from Node and sandboxed", () => {
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /webSecurity: true/);
});

test("desktop shell guards navigation and denies permissions", () => {
  assert.match(main, /setWindowOpenHandler/);
  assert.match(main, /will-navigate/);
  assert.match(main, /setPermissionRequestHandler/);
  assert.match(main, /callback\(false\)/);
});
