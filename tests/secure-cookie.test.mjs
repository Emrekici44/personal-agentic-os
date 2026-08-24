import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { secureCookieForRequest } from "../lib/request-security.ts";

function request(url, headers = {}) {
  const values = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  return { nextUrl: new URL(url), headers: { get: (name) => values.get(name.toLowerCase()) || null } };
}

test("private HTTPS proxy marks cookies Secure without trusting a spoofed host", () => {
  const previous = process.env.AGENTIC_OS_PRIVATE_HOST;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.AGENTIC_OS_PRIVATE_HOST = "agentic.private.ts.net";
  process.env.NODE_ENV = "development";
  try {
    assert.equal(secureCookieForRequest(request("http://127.0.0.1:3000")), false);
    assert.equal(secureCookieForRequest(request("https://agentic.private.ts.net")), true);
    assert.equal(secureCookieForRequest(request("http://127.0.0.1:3000", { host: "agentic.private.ts.net", "x-forwarded-proto": "https" })), true);
    assert.equal(secureCookieForRequest(request("http://127.0.0.1:3000", { host: "attacker.invalid", "x-forwarded-proto": "https" })), false);
  } finally {
    if (previous === undefined) delete process.env.AGENTIC_OS_PRIVATE_HOST;
    else process.env.AGENTIC_OS_PRIVATE_HOST = previous;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("session and OAuth cookies use the same request-aware Secure policy", async () => {
  const files = await Promise.all([
    readFile(new URL("../app/api/state/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/calendar/connect/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/calendar/callback/route.ts", import.meta.url), "utf8"),
  ]);
  for (const source of files) {
    assert.match(source, /secureCookieForRequest\(req\)/);
    assert.doesNotMatch(source, /secure:\s*process\.env\.NODE_ENV\s*===\s*["']production["']/);
  }
});
