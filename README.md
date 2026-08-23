# Northstar — Personal Agentic OS

Northstar is a calm, local-first command center for planning a meaningful life without turning every ambition into another task. It is intentionally organized around Today, weekly outcomes, ideas, projects, life areas, agents, memory, integrations, and settings.

## Run locally

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Run `npm run build` before a release.

The current verified mode stores user state in browser local storage and supports a JSON backup from Settings. Demo content is visibly representative; no external account is claimed as connected.

## Design rationale

Next.js and React provide a maintainable responsive application path for desktop, mobile, and later private hosting. The first operational mode is local-first so the system is useful before credentials exist. Every consequential connector follows preview → approval → write → audit. External secrets belong in environment variables or a managed secret store, never source files or chat.

See `docs/SETUP.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `ROADMAP.md`, and `STATE.md`.
