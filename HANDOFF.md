# Resume handoff

Checkpoint date: 24.08.2026, Europe/Berlin.

## Resume location

Project root: `outputs/agentic-os`. Private source remote: `https://github.com/Emrekici44/personal-agentic-os`, branch `main`.

## Current safe state

- Standard ignored local configuration includes the authorized Emre Vault path; never print `.env.local` values.
- Local state, database/WAL/backups, OAuth tokens, Vault content and preview images remain ignored.
- Electron and the local Next dev service are currently usable. The verified desktop shortcut/launcher remains unchanged.
- Calendar reads are safe; no pending write proposal exists.
- Existing Vault notes remain unchanged.
- PostgreSQL PoC is files-only and deliberately inactive. Docker/Podman/psql were not installed.
- Graphify is not installed.
- Physical iPhone navigation acceptance passed after the private-origin/hydration repair. No new QR was required.
- Life-area examples were replaced by the authenticated shared `area_records` store. Private details are encrypted; existing data was not imported or rewritten.
- The real weekly planner is available at `#weekly` in desktop and as `Woche` in the mobile bottom bar. It generated a verified read-only preview from 8 Google calendars / 49 bounded events with 0 outcomes, 0 blocks and 0 writes because the shared task/inbox/project sources were empty.
- Google token refresh is server-only and persists the renewed bundle encrypted under ignored `local-state`; no token or credential is exposed.
- Projects now open a full shared workspace. With the current real store at 0 projects/tasks/inbox, the UI shows honest empty states; the create editor was opened and cancelled in desktop/mobile validation without mutating Emre's data. Once Emre creates a real project, its tasks, inbox links, plan links and metadata-only audit will sync through the laptop API.

## Immediate continuation

1. Keep the verified project workspace, weekly planner, life-area CRUD and daily workspace usable in Electron/Expo.
2. Add real shared projects/tasks/inbox items through the normal UI, then regenerate and review a useful week.
3. Any selected focus block must still enter the exact single-event approval screen; never test the final write without Emre's action-time confirmation.
4. Ask Emre before any PostgreSQL target/account, real migration, Vault mutation, Graphify installation or new external connector activation.

## Non-negotiable boundaries

- No costs, accounts, public deployment, Funnel, router port forwarding or power-setting change.
- No additional Calendar write without exact proposal and action-time approval.
- No existing Vault mutation without preview, backup and explicit approval.
- No real-data database migration until inventory, mapping, conflicts and rollback are reviewed.
