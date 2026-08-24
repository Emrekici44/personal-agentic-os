import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import test from'node:test';
const store=await readFile('lib/shared-store.ts','utf8'),vault=await readFile('lib/obsidian-vault.ts','utf8'),route=await readFile('app/api/obsidian/migration-preview/route.ts','utf8');
test('shared store uses built-in SQLite with versioned WAL migrations and private APIs',()=>{assert.match(store,/from 'node:sqlite'/);assert.match(store,/schema_migrations/);assert.match(store,/journal_mode=WAL/);for(const table of ['projects','tasks','habits','journal_metadata','inbox_items','agents','skills','area_records','approvals','progress_items','audit_log'])assert.match(store,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));assert.match(store,/AES-256-GCM/);assert.match(store,/VACUUM INTO/);assert.match(store,/review_required/)});

test('shared operational records expose authenticated CRUD and route skills through their safe API',async()=>{
  const route=await readFile(new URL('../app/api/state/records/[kind]/route.ts',import.meta.url),'utf8');
  for(const operation of ['listRecords','createRecord','updateRecord','archiveRecord'])assert.match(route,new RegExp(operation));
  assert.match(route,/verifyLocalSession/);
  assert.match(store,/crudKinds=.*projects.*tasks.*habits.*journal_metadata.*inbox_items.*agents.*skills/s);
  assert.match(store,/kind==='skills'.*Skills benötigen die sichere Prozedur-API/s);
  assert.match(store,/createSkillDefinition/);
  assert.match(store,/INSERT INTO audit_log/);
});
test('life-area CRUD encrypts private content and archives instead of deleting',()=>{
  assert.match(store,/version:3.*CREATE TABLE IF NOT EXISTS area_records/s);
  assert.match(store,/sensitive_enc TEXT NOT NULL/);
  assert.match(store,/areaRecordPayload.*encryptSensitive/s);
  assert.match(store,/kind==='area_records'.*decryptSensitive/s);
  for(const area of ['faith','health','finance','relations','career'])assert.match(store,new RegExp(`${area}:\\[`));
  assert.match(store,/area==='career'.*employee.*business/s);
  assert.match(store,/UPDATE \$\{kind\} SET status='archived'/);
  assert.doesNotMatch(store,/DELETE FROM area_records/);
});
test('vault normalization is preview-only and preserves existing notes',()=>{assert.match(vault,/previewVaultNormalization/);assert.match(vault,/existingNotesModified:0/);assert.match(vault,/proposedMoves:0/);assert.match(vault,/proposedRenames:0/);assert.match(vault,/sensitiveWritesRequireApproval:true/);assert.match(route,/no-store, private/);assert.match(route,/writesPerformed:false/)});

test('shared theme and branding preferences are authenticated, validated and audited',async()=>{
  const preferences=await readFile(new URL('../app/api/state/preferences/[id]/route.ts',import.meta.url),'utf8');
  assert.match(preferences,/verifyLocalSession/);
  assert.match(store,/preferenceIds=\['theme','branding'\]/);
  assert.match(store,/\['dark','light'\]/);
  assert.match(store,/Produktname muss 2 bis 60 Zeichen/);
  assert.match(store,/\^#\[0-9a-f\]\{6\}\$/);
  assert.match(store,/preference\.update/);
});

test('local backups are integrity checked and restoration remains preview-only',async()=>{
  const route=await readFile(new URL('../app/api/state/backups/route.ts',import.meta.url),'utf8');
  assert.match(store,/PRAGMA wal_checkpoint\(FULL\)/);
  assert.match(store,/VACUUM INTO/);
  assert.match(store,/PRAGMA integrity_check/);
  assert.match(store,/sha256File/);
  assert.match(store,/applyAvailable:false/);
  assert.match(store,/restorePerformed:false/);
  assert.match(store,/conflictReviewRequired/);
  assert.match(route,/verifyLocalSession/);
  assert.match(route,/action !== "create_backup"/);
  assert.match(route,/action !== "preview_restore"/);
  assert.doesNotMatch(route,/renameSync|copyFileSync|unlinkSync|rmSync/);
});

test('journal text is encrypted and excluded from public JSON for new writes',()=>{
  assert.match(store,/delete publicData\.text/);
  assert.match(store,/kind==='journal_metadata'.*encryptSensitive\(\{text:data\.text\}\)/s);
  assert.match(store,/kind==='journal_metadata'\)delete visible\.text/);
  assert.match(store,/kind==='area_records'\|\|kind==='journal_metadata'/);
  assert.match(store,/legacyJournalPlaintextRows/);
});

test('audit feed exposes only action metadata behind the private session',async()=>{
  const [store,route]=await Promise.all([
    readFile(new URL('../lib/shared-store.ts',import.meta.url),'utf8'),
    readFile(new URL('../app/api/state/audit/route.ts',import.meta.url),'utf8'),
  ]);
  const auditFunction=store.slice(store.indexOf('export function listAuditEntries'),store.indexOf('const preferenceIds'));
  assert.match(store,/SELECT action,entity_type,created_at FROM audit_log/);
  assert.doesNotMatch(auditFunction,/metadata_json|entity_id/);
  assert.match(route,/verifyLocalSession/);
  assert.match(route,/personalContentExposed: false/);
});
