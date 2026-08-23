# Setup and integrations

## Local operation

Follow the README. Settings → Backup export downloads the current local state.

## Google Calendar first connection

1. In the user's Google Cloud project, enable Calendar API and configure an OAuth consent screen.
2. Create a Web OAuth client with the exact local and future private-host redirect URLs.
3. Store the client ID and secret in `.env.local`; do not paste them into chat or commit them.
4. Begin with Calendar read-only permission and verify work, commute, training, and Sunday planning events.
5. Enable write permission only after the change-preview and approval flow is tested.

Expected environment variable names: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, and `APP_URL`. A future hosted deployment must set these in the host's encrypted secret manager.

## Obsidian

Choose a vault directory only when ready. The first pass inventories Markdown and renders a read-only preview. Indexing writes only to application-owned storage. Vault mutation is a separate opt-in capability.

## Private deployment

Deployment has deliberately not been performed. The user must select and approve a private host/account and any possible cost. Before release: configure authentication and secrets, run the production build, verify mobile behavior, test backup/restore, and confirm the URL is not public.
