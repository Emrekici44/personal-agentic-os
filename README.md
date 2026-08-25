# Agentic OS — Personal Life Operating System

`Agentic OS` is a neutral temporary name for a calm, local-first command center. Name, short name, monogram, and accent are editable in Settings without migrating user data.

## Run locally

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Run `npm run build` before a release.

For the laptop app, double-click `Agentic OS - Laptop starten.cmd`. For the no-cost iPhone companion, install Expo Go once and double-click `Agentic OS - iPhone starten.cmd`; then scan the displayed QR code while both devices are on the same Wi-Fi. Private travel access is prepared through Tailscale Personal and `tailscale serve`—never Funnel—using `Agentic OS - Privat unterwegs starten.cmd`. See `docs/DESKTOP.md`, `docs/MOBILE.md`, and `docs/REMOTE-ACCESS.md`.

The current verified mode stores operational state in the laptop-local encrypted-field SQLite bridge behind signed private APIs. Desktop and iPhone read the same source. Settings can create integrity-checkable local database backups and preview restore conflicts; restore itself remains deliberately unavailable until an exact user approval. Local storage remains only a compatibility fallback for unmigrated device values. Empty states are honest and no external account is shown as connected without live evidence.

## Ownership and privacy

This directory is the complete normal source project: application code, tests, documentation, and Git history. Open the folder directly in Visual Studio Code. The Emre Obsidian vault is deliberately outside this repository and is never uploaded. Local screenshots, environment values, databases, backups, caches, and personal state are ignored.

## Design rationale

Next.js and React remain the single UI and server source of truth. A hardened Electron shell supplies the dedicated Windows laptop window, while an Expo Go WebView shell supplies the no-cost iPhone development path without duplicating screens. The first operational mode is local-first so the system is useful before credentials exist. Every consequential connector follows preview → approval → write → audit. External secrets belong in environment variables or a managed secret store, never source files or chat.

See `docs/SETUP.md`, `docs/DESKTOP.md`, `docs/MOBILE.md`, `docs/REMOTE-ACCESS.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `ROADMAP.md`, and `STATE.md`.

## Deterministic runtime boundary

Six built-in workflows—including the Weekly Planner—use one persistent runtime with formal agent definitions, one shared Skill service, fixed Tool executors, source-bounded context, scoped memory, policy enforcement, ordered run steps, execution receipts and content-light audit. `project_coach` is the first model-assisted-capable agent, but its OpenAI planner runs only when every server-side provider, kill-switch and positive cost gate is satisfied; the committed defaults keep it disabled and explicit model requests never silently fall back. Deterministic planning remains available. Calendar, Google Tasks and Obsidian expose narrow connector actions behind exact, expiring, single-use approvals and read-back receipts; capability status remains honest when a scope or configuration is missing. This is not an autonomous agent system: no model receives credentials or direct connector authority, schedules remain proposal-only, and arbitrary tools/code, silent external writes, ChatGPT-history access and automatic policy-memory promotion remain unavailable.
