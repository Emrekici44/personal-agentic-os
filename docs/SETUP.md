# Setup and integrations

## Local operation

Follow the README. Settings → Backup export downloads the current local state.

## Google Calendar first connection

1. In the user's Google Cloud project, enable Calendar API and configure an OAuth consent screen.
2. Create a Web OAuth client with the exact local and future private-host redirect URLs.
3. Register exactly `http://localhost:3000/api/calendar/callback` as the local redirect URI.
4. Copy `.env.example` to `.env.local`, set the four values, and generate `AUTH_SECRET` locally. Never paste values into chat or commit the file.
5. Restart Agentic OS, connect from Integrations, select calendars, and verify the bounded week.
6. The current connector is read-only. Write scope and actual commit logic require a separate reviewed change and renewed consent.

Expected environment variable names: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, and `APP_URL`. A future hosted deployment must set these in the host's encrypted secret manager.

Without them, Agentic OS automatically uses clearly labeled fixed test data that cannot contact or modify Google.

## Visual Studio Code

Open `C:\Users\ekici\Documents\Codex\2026-08-23\personal-agentic-os\outputs\agentic-os` as the project folder. Source lives in `app/` and `lib/`, automated safety checks in `tests/`, and operational documentation at the project root plus `docs/`. No required source lives in a temporary directory.

## Cost consent

Local mode is the default. Any connector or provider that may incur charges must explain the cost class and require explicit approval before activation. OpenAI API mode remains disabled until a server-side key, daily/monthly ceilings, warning threshold, and local kill-switch decision are configured.

## Obsidian

Choose a vault directory only when ready. The first pass inventories Markdown and renders a read-only preview. Indexing writes only to application-owned storage. Vault mutation is a separate opt-in capability.

## Private deployment

Deployment has deliberately not been performed. The user must select and approve a private host/account and any possible cost. Before release: configure authentication and secrets, run the production build, verify mobile behavior, test backup/restore, and confirm the URL is not public.
