# Roadmap

## Complete and verified

- Web/PWA, hardened Electron shell, Expo Go companion and private Tailscale Serve foundation.
- Physical iPhone launch and navigation acceptance checkpoint.
- Editable neutral branding, avatar `E`, dark futuristic shell and color-accented life areas.
- Real Emre Vault read-only index; no existing-note mutation.
- Google OAuth, bounded Calendar reads and controlled event write guard; one exact approved event completed.
- Shared operational SQLite bridge with signed private API, migrations, WAL, encryption helper, audit and migration-preview gate.
- Real shared projects/tasks/inbox/agent/skill/journal-metadata flows.
- Global progress checklist without invented percentages.
- Global native-button audit enforced by AST test; private Tailscale/Expo hydration guard physically accepted on iPhone.
- Production truth audit removed the final embedded Calendar/event/focus fixtures and unused mock-provider export. Test contracts now exercise only the bounded read guard and the real Planner/Calendar write boundaries.
- Command Center status is now live and reconnect-aware for Planner, Google Calendar, Obsidian and OpenAI API. Source availability is separated from data presence, so an empty but reachable Planner is no longer mislabeled as unconfigured.
- Task and life-area surfaces now distinguish verified zero counts from loading/offline sources. Domain insights, records and create controls appear only when the shared source is online; no outage is rendered as an honest empty dataset.
- Shared-record mutations now fail closed while their source is loading/offline. Stale in-memory rows are removed from active views and prominent Today/Journal/Project/Area/Agent/Inbox/Companion controls stay disabled until the signed private source is reverified.
- Cross-source selectors now carry independent readiness: Tasks, Project Coach, project snapshot Skills, Companion capture and Inbox triage cannot save or run a project/agent reference whose real source has not been verified Online.
- Agent workflow and Skill procedure clients now clear stale definitions/runs and disable review actions on transport or malformed-response failures, while preserving the distinction between an offline source and a server-side validation rejection.
- Weekly Planner recovery now clears stale plan/history/selections and exact Calendar approval material before reload and on lost source certainty. An ambiguous external-write response is never auto-retried and requires a fresh status check/proposal.
- Knowledge recovery now clears stale Vault metadata, audit entries, diff previews and in-session approval tokens before reload and after transport/malformed-response failure. Preview controls require both the read-only index and local proposal store Online; Apply remains absent/disabled.
- Backup/archive recovery now clears stale inventory selection and restore previews while loading/offline, distinguishes unavailable from verified zero, and blocks local create/preview requests until the private inventory is reverified. Restore Apply remains disabled.
- Integration Health and Calendar catalog now clear stale cards/selections during refresh, expose Loading/Offline/verified-empty independently and provide a scoped Calendar retry. The final visible `TESTADAPTER` fallback was removed; bounded read failures are handled without a write or fake catalog.
- Project workspace recovery now invalidates stale weekly/audit payloads, gates each task/inbox/resource mutation on its own verified source and renders unavailable cross-source counts as unknown rather than zero.
- Usage & Limits now invalidates all live provider/integration/storage/backup evidence during refresh or outage, suppresses precise limits and statuses until verified, and automatically rechecks after private runtime recovery.
- Journal's title-free daily Calendar evidence now reloads after verified recovery with a scoped retry, while OAuth launch and local encrypted token handoff catch transport failures and never claim an unconfirmed result.
- Manual bounded Calendar reads now derive their complete eight-day interval server-side in Europe/Berlin, independent of Windows/iPhone timezone, deduplicate selected calendars and minimize requested Google event fields.
- The structured dashboard checklist now reflects the 25 August recovery work with discrete completed/active/user-action states: one local gap audit is active, without a decorative percentage or fabricated progress.
- Command Center source refresh now isolates Calendar, Planner, Vault and OpenAI failures instead of collapsing all statuses on one malformed response, and maps internal states to clear German labels.
- Unified daily workspace with shared tasks, persistent habits and encrypted journal completion.
- Real content-free shared-store audit in Knowledge; static activity claims removed.
- Real shared life-area records for faith, health, finance, relationships and split career; encrypted private fields, honest empty states and reversible archive.
- Real Sunday weekly planner: signed private GET/generate/review API, encrypted shared plans/outcomes/focus proposals, Europe/Berlin DST-safe 8-day window, real Calendar/task/inbox/project evidence, max. 3 outcomes, 35% buffer and exact single-write handoff.
- Professional shared project workspace with real overview/detail, validated project metadata, linked tasks and inbox, weekly-plan evidence, content-light audit history and responsive desktop/mobile controls.
- Five real local agent workflows: project coach, faith/reflection, health planning, finance overview and relationship care; real Shared Store evidence, encrypted run/resume state, review/pause/resume, content-light audit and zero external/background actions.
- Safe reusable local skills: fixed deterministic procedures, pinned input/source contracts, versioned definitions, transparent agent references, encrypted preview history and technical denial of arbitrary code, shell, network, models, files, external writes and silent chains.
- Controlled Obsidian write preparation: exact new-note/frontmatter diff, validated in-vault target, current hash/conflict gate, explicit backup/restore plan, encrypted proposal history and expiring preview approval. Apply remains technically absent until Emre grants a later exact action approval.
- Evidence-based integration health center: live server checks, last success/current action/safe error, cost class, scope, privacy, reconnect guidance and extensible connector classification; no connection, scope or paid activation from the health UI.
- Specialized real-data domain workspaces: voluntary prayer/Qurʾān tracking without location guidance, organizational training/recovery/nutrition, manual finance overview without transactions/advice, and private people/birthday/follow-up constellation without messaging. All specialty fields are encrypted.
- Shared validated branding and theme preferences, real provider/integration/storage evidence in Usage & Limits, and local SHA-256/integrity-checked SQLite snapshots with restore-conflict preview. Restore apply remains intentionally absent.
- Daily Journal uses real shared task/habit counts, a one-day content-minimal Calendar count and an encrypted private history detail. All illustrative linkage counters are removed; current-store privacy inventory found no legacy plaintext journal rows.
- Universal Inbox supports real shared capture and validated triage to life area, existing project and existing agent reference. Full content is encrypted, empty capture is disabled and file handling is truthfully limited to a text reference with no upload.
- Custom Agent configuration now persists purpose, allowlisted life areas, explicit manual Companion/no-provider mode, no-model truth and metadata-only/paused status. Unverified API models and executable custom-agent claims are rejected server-side.
- Private Obsidian metadata search now uses the real 27-note index behind the signed local session. It searches only title, relative path and frontmatter key names; note bodies/values stay server-side and existing Vault files remain untouched.
- Daily task and habit planning now persists validated priority, due date, life area, real project links, daily/weekly cadence, completion and reversible archive state. Editors are shared across Electron/Expo and never seed example records or pressure-oriented streaks.
- Tasks now include up to 20 validated, stable-ID checklist items. Subitems can be edited in the shared task editor and completed directly from Today; no schema/data migration or code-capable payload is involved.
- Inbox review now provides truthful open/assigned/completed/all views, title-only local filtering, direct complete/reopen and two-step reversible archive from triage. All state remains in the encrypted shared source and no filter dispatches an agent or external action.
- ChatGPT Companion now captures only a user-chosen title/summary with optional real project and life-area metadata, stores explicit no-model/no-history provenance, and provides a searchable local library with reassignment. Provider cards separate active manual subscription workflow, disabled usage-based API and unverified local runtime.
- Shared CRUD now rejects stale update/archive versions with HTTP 409 and reloads the authoritative row, while a visible runtime-health banner replaces any temptation to write a silent device-local fallback. An isolated temporary-database test proves no stale overwrite or archive occurs.
- Shared views now recover after a verified reconnect: network failures immediately mark the affected source offline, while the existing interval/focus/online health check broadcasts a successful recovery and reloads every active Shared Store view without a device-local data fork.
- Independent encrypted stores now expose scoped recovery controls for Project history, Agent workflows, Skills, Planner sources, Knowledge audit, backup inventory and record archive. Workflow execution stays disabled until its real source is online.
- Final local UI audit covered 16 core views on desktop and 390×844. It fixed undersized mobile menu/journal prompt targets to 44 px; the repeat run found no horizontal overflow or active control below 32×32 px. Physical iPhone acceptance of this newest increment remains explicitly pending.
- Calendar status, catalog, bounded reads, OAuth entry and encrypted local token sharing now require the same signed private session and return `no-store, private`. Disconnected production routes return honest empty/unavailable states instead of mock events, and both obsolete mock proposal/approval endpoints return 410 without actions.
- Project workspaces now include shared resource references: allowlisted web links and local file references with a visible short title, encrypted private target, project linkage, explicit reveal and no file open/copy/upload primitive. Validation was executed against an isolated temporary store; no user record or file was created.
- Settings now has a signed, read-only recovery diagnosis. It checks Shared Store/WAL/schema, connector-health evidence and local backup availability, presents an ordered restart/check/preview runbook, and cannot reconnect, restore or write externally.
- All remaining sensitive Shared Store/API responses now explicitly use `no-store, private`. Unauthorized reads and mutations consistently return 401 (not a misleading validation 400), including records, preferences, backups, audit, migration preview and Calendar proposal/write routes.
- Reversible archive is now truthful end-to-end: a private content-light archive lists local records, restores one exact version to its prior status in a transaction, rejects stale/dependency conflicts and never deletes or performs an external action. Backup restore remains a separate locked boundary.
- Project, Journal and custom Agent surfaces now expose deliberate two-step archive entry points. Archiving itself is transactional and refuses active Project/Agent dependencies before changing state, so cross-client recovery does not create orphaned references.
- Local single-record restore now also has a two-step UI gate with an explicit cancel path. No restore request is sent on the first click; the existing exact-version/dependency checks remain authoritative on confirmation.

## Complete – Bedienwahrheit and responsive refinement

- Complete button/status/demo audit and keep every visible action truthful.
- Reduce desktop density while preserving the left navigation; maintain high-quality touch/mobile layouts.
- Share Light/Dark preference across server-backed clients.
- Full web/Electron/Expo verification and physical iPhone navigation retest completed.

## Decision-ready, not activated

- PostgreSQL: self-hosted/private vs Neon Free vs Supabase Free comparison documented; loopback-only schema PoC prepared but not run.
- Graphify: official TypeScript product line evaluated; optional non-sensitive pilot defined but not installed.
- Integration inventory classifies direct API, manual/import, provider/cost and unsuitable paths.

## Gated next phases

1. Choose PostgreSQL target and data-residency tradeoff.
2. Produce SQLite → PostgreSQL inventory, field mapping, conflict preview and tested rollback; request explicit migration approval.
3. Review an exact Obsidian preview when useful; a real apply/restore executor remains a separate explicit user decision and must preserve all existing notes unless its exact diff is approved.
4. Evaluate each new connector independently; no implicit OAuth scope expansion or paid activation.
5. Seed real shared tasks/projects/inbox items through the normal UI so the planner can propose the first useful three-outcome week; each eventual Calendar event still requires its own action-time approval.
6. Review the exact local restore preview only if a recovery is needed; implementing and invoking restore both require a separate exact approval.

The full evidence-based status, locally executable vertical slices and bundled decision boundaries are maintained in `MASTER-GAPS.md` and `PENDING-DECISIONS.md`.
