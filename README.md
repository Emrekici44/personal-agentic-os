# Agentic OS — Personal Life Operating System

`Agentic OS` is a neutral temporary name for a calm, local-first command center. Name, short name, monogram, and accent are editable in Settings without migrating user data.

## Run locally

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Run `npm run build` before a release.

The current verified mode stores user state in browser local storage and supports a JSON backup from Settings. Demo content is visibly representative; no external account is claimed as connected.

## Ownership and privacy

This directory is the complete normal source project: application code, tests, documentation, and Git history. Open the folder directly in Visual Studio Code. The Emre Obsidian vault is deliberately outside this repository and is never uploaded. Local screenshots, environment values, databases, backups, caches, and personal state are ignored.

## Design rationale

Next.js and React provide a maintainable responsive application path for desktop, mobile, and later private hosting. The first operational mode is local-first so the system is useful before credentials exist. Every consequential connector follows preview → approval → write → audit. External secrets belong in environment variables or a managed secret store, never source files or chat.

See `docs/SETUP.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `ROADMAP.md`, and `STATE.md`.
