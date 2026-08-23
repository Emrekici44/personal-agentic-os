# Setup and integrations

## Local operation

Follow the README. Settings → Backup export downloads the current local state. Dedicated launch instructions are in `DESKTOP.md`, `MOBILE.md`, and `REMOTE-ACCESS.md`.

## Default ChatGPT Companion Mode

Use the installed ChatGPT app/subscription for conversations. Use Agentic OS for structured projects, tasks, notes, dashboards, tracking, and visualizations. Agentic OS cannot read the ChatGPT conversation history. To transfer useful context, open Universal Inbox → ChatGPT Companion Capture, request or write a structured summary in ChatGPT, and paste only the selected summary into Agentic OS. Embedded OpenAI API mode remains unconfigured and disabled behind cost ceilings and the kill switch.

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

Open the checked-out `personal-agentic-os` folder in Visual Studio Code. Source lives in `app/` and `lib/`, automated safety checks in `tests/`, and operational documentation at the project root plus `docs/`. No required source lives in a temporary directory.

## Cost consent

Local mode is the default. Any connector or provider that may incur charges must explain the cost class and require explicit approval before activation. OpenAI API mode remains disabled until a server-side key, daily/monthly ceilings, warning threshold, and local kill-switch decision are configured.

## Obsidian

The authorized Emre vault is the human-readable notes and knowledge layer. Operational records such as task state, approvals, audits, connector state, and job handoffs belong in the application-owned structured state layer, with SQLite as the planned durable local store. Synchronization to Markdown is explicit and auditable. Vault mutation remains a separate opt-in capability.

Set `AGENTIC_OS_OBSIDIAN_VAULT` only in the local server environment or use the provided Windows launchers, which resolve the authorized default below `%USERPROFILE%` only when it exists. The app reads bounded Markdown metadata and links only; see `OBSIDIAN.md`. Never commit a personal vault path or generated index.

## Private Tailscale access

The prepared no-cost remote path is a Tailscale Personal tailnet with both devices signed in, a production Next server bound to `127.0.0.1:3211`, and private HTTPS through `tailscale serve`. Funnel, public tunnels, router port forwarding, and paid hosting are forbidden by the helper. Exact user steps and the honest cellular verification boundary are in `REMOTE-ACCESS.md`.

## Private deployment

Deployment has deliberately not been performed. The user must select and approve a private host/account and any possible cost. Before release: configure authentication and secrets, run the production build, verify mobile behavior, test backup/restore, and confirm the URL is not public.
