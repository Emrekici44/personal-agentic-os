# Current state

Last verified: 24.08.2026, Europe/Berlin.

## Operational

- Electron remains the primary desktop UI; the verified window loads the current Next.js app.
- Expo/iPhone and Electron use the same server UI. Operational records are shared through a signed private API and the laptop-local SQLite bridge.
- Real shared CRUD is active for projects, tasks, inbox, agents, skill metadata and journal metadata. Sensitive journal text is field-encrypted. No device localStorage migration occurred.
- Shared Light/Dark preference is stored in the private operational store. The mobile wrapper follows automatic system chrome while the shared web UI uses the selected theme.
- The Emre Vault path is present in ignored local configuration. The live read-only index reports 27 Markdown notes, 37 local links and 34 resolved relationships. Existing notes remain untouched.
- Google Calendar is connected. Eight-day selected-calendar reads work. No write is prepared. Deletes, ACL, sharing, settings and background writes remain disabled.
- The one user-approved event `Kurzes Training Push` was created once, read back and audited. No other calendar write is authorized.
- Tailscale remains private/tailnet-only; Funnel and public ingress are absent.

## Current implementation phase

- Global control audit: every JSX `button`/`Btn` has a real handler or an explicit disabled boundary.
- Removed: obsolete first-event proposal/write control, fake Calendar week read, fake project-chat creation, fake model conversation and fake connector-details toasts.
- Added: real Calendar list + bounded read, manual ChatGPT-summary import, explicit demo boundaries for unconnected life-area data, truthful home status, grouped desktop navigation and responsive shared theme.
- PostgreSQL server evaluation and an unstarted loopback-only PoC are documented. Docker/Podman/psql are absent; no install, account or migration occurred.
- Graphify 0.17.2 TypeScript line was evaluated from official repository/package material; it remains uninstalled and non-core.

## Verification

- Root tests: 27/27 passed after the final UI/documentation refresh.
- Root lint and optimized Next build: passed after the final UI/documentation refresh.
- Electron security checks: 2/2 passed. Expo TypeScript, lint and static web export passed.
- Browser: desktop 1280-wide and mobile 390×844 had no horizontal overflow or console errors. Mobile bottom navigation, drawer and theme toggle worked. Live bounded Calendar read returned a count only; no event details were surfaced in artifacts.
- Electron: current window visually and accessibly loaded the refreshed dashboard; Obsidian and Calendar both reported Online from verified sources.
- Git: commits `1901733` and `7208f76` are on private `main`; local HEAD and `origin/main` matched after push.

## User boundaries

- Do not install a container runtime or start the PostgreSQL PoC without approval.
- Do not create a cloud database/account or migrate SQLite without inventory, mapping, conflict preview, backup/restore proof and explicit approval.
- Do not install/run Graphify or send Vault content to a model without a separate pilot proposal and approval.
- Do not perform another Calendar write without a new exact proposal and action-time confirmation.
