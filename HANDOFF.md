# Resume handoff

## Current checkpoint

Resume in `outputs/agentic-os`. The web/PWA, Electron desktop shell, and Expo Go companion share one Next.js product UI. Physical Expo launch, mobile navigation, and private Tailscale Serve are verified. Emre accepted dashboard/navigation over the Tailscale Expo route in the current hotspot topology; a true separate-network cellular test remains deferred. Exact local/Tailscale addresses are runtime-only and must never be committed.

Useful launchers:

- `Agentic OS - Laptop starten.cmd` — dedicated Electron window
- `Agentic OS - iPhone starten.cmd` — same-Wi-Fi Expo Go
- `Agentic OS - Privat unterwegs starten.cmd` — loopback server plus private Tailscale Serve
- `Agentic OS - iPhone Tailscale starten.cmd` — Expo Go over the connected tailnet
- `Agentic OS - Privat stoppen.cmd` — stops only the Agentic OS private backend process

The private route must remain Tailscale Serve/tailnet-only. Never invoke Funnel, create public tunnels, forward router ports, or silently change Windows power settings. Run Unattended is an optional manual user/admin action.

Final foundation verification: thirteen web/safety tests pass, root lint passes, Expo typecheck/lint/export passes, two Electron security tests pass, and the optimized Next.js production build passes. Responsive checks pass at 390×844 and 393×852 without horizontal overflow. A live Electron window is verified on Windows ARM and the physical iPhone navigation checkpoint is accepted.

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
3. Implement safe Obsidian synchronization next: read/index, show an exact diff, require approval for every write, audit, and backup.
4. Then perform the user-owned Google OAuth credential/consent step for read-only selected-calendar access and verify the eight-day boundary.
5. Treat any future Google write scope, API spending, installer signing, or public/cloud deployment as a new explicit approval boundary.
