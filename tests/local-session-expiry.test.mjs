import assert from "node:assert/strict";
import test from "node:test";

import { signLocalSession, verifyLocalSession } from "../lib/shared-store.ts";

test("signed local sessions have a server-enforced lifetime", () => {
  const previousSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "local-session-expiry-test-secret";
  const now = Date.UTC(2026, 7, 25, 12, 0, 0);
  try {
    const valid = signLocalSession(`local:${now}:123e4567-e89b-42d3-a456-426614174000`);
    const expired = signLocalSession(`local:${now - 86_400_001}:123e4567-e89b-42d3-a456-426614174001`);
    const future = signLocalSession(`local:${now + 60_001}:123e4567-e89b-42d3-a456-426614174002`);
    const legacy = signLocalSession("local:123e4567-e89b-12d3-a456-426614174003");
    const malformedNonce = signLocalSession(`local:${now}:------------------------------------`);
    assert.equal(verifyLocalSession(valid, now), true);
    assert.equal(verifyLocalSession(expired, now), false);
    assert.equal(verifyLocalSession(future, now), false);
    assert.equal(verifyLocalSession(legacy, now), false);
    assert.equal(verifyLocalSession(malformedNonce, now), false);
    assert.equal(verifyLocalSession(`${valid.slice(0, -1)}x`, now), false);
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previousSecret;
  }
});
