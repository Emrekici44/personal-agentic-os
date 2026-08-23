# Resume handoff

## Resume point

The complete local product is in `outputs/agentic-os`. Start it with the README steps. Persistent UI state is stored under the browser key `northstar-state`.

## Paul loop

- Plan: Sunday reset evaluates calendar, tasks, ideas, priorities, energy, and protected relationships/faith/health.
- Apply: agent creates at most three outcomes and proposed blocks at no more than 60–70% capacity.
- Unify: user reviews one coherent week; duplicates and conflicting commitments are surfaced.
- Loop: approval and changes are audited; unfinished work returns to Inbox or Projects rather than silently rolling over.

## Required human checkpoints

1. Confirm the path to any existing Obsidian vault before read-only preview.
2. Create a Google OAuth Web client outside chat, register `http://localhost:3000/api/calendar/callback`, and store credentials only in `.env.local`.
3. Connect with read-only consent and verify selected calendars plus the eight-day window.
4. If writes are later enabled, approve every batch from a visible diff. The exact confirmation and 1–3 block bound are already enforced.
5. Approve a private deployment target and any cost before provisioning.
