# Resume handoff

## Awaiting approved master task list — 2026-08-24

Keep the current Electron/Next services usable and make no further speculative UI or feature changes. Calendar create verification is complete. Shared SQLite/Vault normalization foundations are committed with zero localStorage imports and zero existing-vault mutations. Resume only from the originating thread's approved master list; first restore the vault path through the standard launcher, then re-run the read-only normalization preview before requesting any migration approval.

## Active Google Calendar boundary — 2026-08-24

The initially requested pause was immediately cancelled by the user. Next and Electron remain active, and the existing Tailscale Serve configuration can reach the app without enabling Funnel or changing Windows power settings. The verified Desktop shortcut remains available for future starts.

Read-only OAuth and the bounded read were verified before Emre requested controlled event writes. Open `http://localhost:3000/api/calendar/connect` for the revised consent and stop at the Google-owned screen. The intended grants are only calendar-list read access and event access. Every real create/update still requires a separate exact local proposal and per-action approval; deletes remain disabled. Never expose `.env.local`, print credentials, or delete the downloaded OAuth JSON before the revised connection succeeds.

Last real-vault evidence: 27 Markdown notes, 37 local links, and 34 resolved relationships, read-only. Tailscale installation and tailnet-only Serve configuration remain in place. Private GitHub `main` is the source-of-truth checkpoint.

## Current checkpoint

Resume in `outputs/agentic-os`. The web/PWA, Electron desktop shell, and Expo Go companion share one Next.js product UI. Physical Expo launch, mobile navigation, and private Tailscale Serve are verified. Emre accepted dashboard/navigation over the Tailscale Expo route in the current hotspot topology; a true separate-network cellular test remains deferred. Exact local/Tailscale addresses are runtime-only and must never be committed.

Useful launchers:

- `Agentic OS - Laptop starten.cmd` — dedicated Electron window
- `Agentic OS - iPhone starten.cmd` — same-Wi-Fi Expo Go
- `Agentic OS - Privat unterwegs starten.cmd` — loopback server plus private Tailscale Serve
- `Agentic OS - iPhone Tailscale starten.cmd` — Expo Go over the connected tailnet
- `Agentic OS - Privat stoppen.cmd` — stops only the Agentic OS private backend process

The private route must remain Tailscale Serve/tailnet-only. Never invoke Funnel, create public tunnels, forward router ports, or silently change Windows power settings. Run Unattended is an optional manual user/admin action.

Final foundation and first-data verification: eighteen web/safety tests pass, root lint passes, Expo typecheck/lint/export passes, two Electron security tests pass, and the optimized Next.js production build including the Obsidian route passes. Responsive checks pass at 390×844 and 393×852 without horizontal overflow. A live Electron window is verified on Windows ARM, the physical iPhone navigation checkpoint is accepted, and the server-only Obsidian read-only health/index is verified against the authorized vault without a write. `data/system-progress.ts` is the maintainable source for the command-center `Systemaufbau / Fortschritt` checklist.

The private repository is `https://github.com/Emrekici44/personal-agentic-os`. Previews remain local-only and ignored. The authorized vault is `%USERPROFILE%\Documents\Obsidian Vault\Emre`; original content must remain untouched. Additive files exist only in the documented numbered system directories.

## Product and safety rules

- `Agentic OS` is a neutral temporary name; name, short name, monogram, and accent stay editable.
- ChatGPT Companion Mode uses the ChatGPT app/subscription for conversations and the OS for structured work. No automatic conversation-history access or scraping.
- OpenAI API mode stays disabled without explicit cost consent, server-side key, ceilings, and kill switch.
- Consequential integration changes stay preview → exact approval → write → audit.
- Obsidian is the human-readable knowledge layer; structured operational state belongs in the local store/planned SQLite with deliberate synchronization.

## Exact next actions

1. Keep Windows awake, plugged in, signed into Tailscale, and start the desired local/private launcher when remote access is needed.
2. If Emre wants automatic daily reliability, obtain explicit approval before configuring Windows startup and Tailscale Run Unattended; never alter sleep/power policy silently.
3. The Obsidian read/index health connection is live. Any next write synchronization must show an exact diff, require approval for every write, audit, and backup.
4. Perform the user-owned Google OAuth credential/consent step for read-only selected-calendar access and verify the eight-day boundary. Credentials belong only in local/server configuration, never chat or Git.
5. Treat any future Google write scope, API spending, installer signing, or public/cloud deployment as a new explicit approval boundary.

Current action: wait for Emre to select the visible Google account, then verify read-only consent and connection.
