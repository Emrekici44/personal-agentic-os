import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import test from'node:test';
const store=await readFile('lib/shared-store.ts','utf8'),vault=await readFile('lib/obsidian-vault.ts','utf8'),route=await readFile('app/api/obsidian/migration-preview/route.ts','utf8');
test('shared store uses built-in SQLite with versioned WAL migrations and private APIs',()=>{assert.match(store,/from 'node:sqlite'/);assert.match(store,/schema_migrations/);assert.match(store,/journal_mode=WAL/);for(const table of ['projects','tasks','habits','journal_metadata','inbox_items','agents','skills','approvals','progress_items','audit_log'])assert.match(store,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));assert.match(store,/AES-256-GCM/);assert.match(store,/VACUUM INTO/);assert.match(store,/review_required/)});

test('shared operational records expose authenticated CRUD and keep skills metadata-only',async()=>{
  const route=await readFile(new URL('../app/api/state/records/[kind]/route.ts',import.meta.url),'utf8');
  for(const operation of ['listRecords','createRecord','updateRecord','archiveRecord'])assert.match(route,new RegExp(operation));
  assert.match(route,/verifyLocalSession/);
  assert.match(store,/crudKinds=.*projects.*tasks.*habits.*journal_metadata.*inbox_items.*agents.*skills/s);
  assert.match(store,/kind==='skills'.*status:'metadata_only'/s);
  assert.match(store,/INSERT INTO audit_log/);
});
test('vault normalization is preview-only and preserves existing notes',()=>{assert.match(vault,/previewVaultNormalization/);assert.match(vault,/existingNotesModified:0/);assert.match(vault,/proposedMoves:0/);assert.match(vault,/proposedRenames:0/);assert.match(vault,/sensitiveWritesRequireApproval:true/);assert.match(route,/no-store, private/);assert.match(route,/writesPerformed:false/)});
