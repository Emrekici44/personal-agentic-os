import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = [
  "state/status",
  "state/audit",
  "state/backups",
  "state/migration-preview",
  "state/preferences/[id]",
  "state/records/[kind]",
  "calendar/write-proposal",
  "calendar/write",
  "calendar/today-summary",
  "projects/[id]/workspace",
  "agents/workflows",
];

test("mutable and sensitive shared API responses are signed and explicitly non-cacheable", async () => {
  for (const file of files) {
    const source = await readFile(new URL(`../app/api/${file}/route.ts`, import.meta.url), "utf8");
    assert.match(source, /verifyLocalSession/);
    assert.match(source, /no-store, private/);
    assert.match(source, /Lokale Sitzung erforderlich/);
    assert.match(source, /status: ?401/);
  }
});

test("unauthorized mutations return 401 instead of being mislabeled as validation failures", async () => {
  for (const file of ["state/backups", "state/preferences/[id]", "state/records/[kind]"]) {
    const source = await readFile(new URL(`../app/api/${file}/route.ts`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /if \(!(?:auth|authorized)\(request\)\) throw new Error\("Lokale Sitzung erforderlich"\)/);
    assert.match(source, /if \(!(?:auth|authorized)\(request\)\) return NextResponse\.json\(\{ error: "Lokale Sitzung erforderlich"/);
  }
});

test("visible integration copy no longer claims a production mock state", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /mode: "unavailable"/);
  assert.match(page, /eingeschränkt,\s*offline oder unkonfiguriert markiert/);
  assert.doesNotMatch(page, /Alles andere bleibt klar als Mock/);
});

test("local session issuance is private and cache-free on success and denial", async () => {
  const source = await readFile(new URL("../app/api/state/session/route.ts", import.meta.url), "utf8");
  assert.match(source, /trustedPrivateHost/);
  assert.match(source, /Cache-Control':'no-store, private'/);
  assert.match(source, /status:403,headers/);
  assert.match(source, /authenticated:true,privateOnly:true\},\{headers\}/);
  assert.match(source, /httpOnly:true/);
  assert.match(source, /sameSite:'strict'/);
  assert.match(source, /response\.headers\.set\('Cache-Control','no-store, private'\)/);
});

test("project, workflow and daily calendar responses use private helpers on every path", async () => {
  for (const file of ["projects/[id]/workspace", "agents/workflows", "calendar/today-summary"]) {
    const source = await readFile(new URL(`../app/api/${file}/route.ts`, import.meta.url), "utf8");
    assert.match(source, /const respond = .*NextResponse\.json\(body, \{ \.\.\.init, headers \}\)/);
    assert.doesNotMatch(source, /return NextResponse\.json/);
  }
});
