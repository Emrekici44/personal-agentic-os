import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");

test("private UI ships restrictive browser headers without breaking local HTTP", () => {
  for (const value of [
    "Content-Security-Policy",
    "Permissions-Policy",
    "Referrer-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "camera=()",
    "microphone=()",
    "geolocation=()",
  ]) assert.match(config, new RegExp(value.replace(/[()]/g, "\\$&")));
  assert.doesNotMatch(config, /Strict-Transport-Security/);
});

test("unsafe eval is limited to the local development runtime", () => {
  assert.match(config, /process\.env\.NODE_ENV === "development"/);
  assert.match(config, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.match(config, /: "script-src 'self' 'unsafe-inline'"/);
});
