# Current state

Last verified: 24.08.2026, Europe/Berlin.

## Operational

- Electron remains the primary desktop UI; the verified window loads the current Next.js app.
- Expo/iPhone and Electron use the same server UI. Operational records are shared through a signed private API and the laptop-local SQLite bridge.
- Real shared CRUD is active for projects, tasks, inbox, agents, skill metadata, journal metadata and life-area records. Journal text plus private life-area details are field-encrypted. No device localStorage migration occurred.
- Shared Light/Dark preference is stored in the private operational store. The mobile wrapper follows automatic system chrome while the shared web UI uses the selected theme.
- The Emre Vault path is present in ignored local configuration. The live read-only index reports 27 Markdown notes, 37 local links and 34 resolved relationships. Existing notes remain untouched.
- Google Calendar is connected. Eight-day selected-calendar reads work. No write is prepared. Deletes, ACL, sharing, settings and background writes remain disabled.
- The one user-approved event `Kurzes Training Push` was created once, read back and audited. No other calendar write is authorized.
- Tailscale remains private/tailnet-only; Funnel and public ingress are absent.
- Emre physically accepted the repaired Expo navigation after a full Expo Go restart. The private Next origin now permits its exact MagicDNS host, and the Expo shell requires a hydration-ready signal before showing the app as usable.

## Current implementation phase

- Global control audit: every native JSX `button` has a real handler or an explicit disabled boundary; the rule is enforced by an AST-based regression test.
- Removed: obsolete first-event proposal/write control, fake Calendar week read, fake project-chat creation, fake model conversation and fake connector-details toasts.
- Added: real Calendar list + bounded read, manual ChatGPT-summary import, truthful home status, grouped desktop navigation and responsive shared theme.
- PostgreSQL server evaluation and an unstarted loopback-only PoC are documented. Docker/Podman/psql are absent; no install, account or migration occurred.
- Graphify 0.17.2 TypeScript line was evaluated from official repository/package material; it remains uninstalled and non-core.
- Journal, tasks and real persistent habits now share one focused daily workspace. The Knowledge audit reads content-free action metadata from the authenticated shared store instead of static examples.
- Glaube, Gesundheit, Finanzen, Beziehungen und beide Karrierepfade verwenden jetzt ausschließlich leere oder echte gemeinsame Datensätze mit Erstellen/Bearbeiten/Detail/Archivieren. Die früher erfundenen Werte und Personen wurden entfernt; externe Gesundheits-, Bank- oder Bewerbungsaktionen bleiben ausdrücklich deaktiviert.
- Der Sonntags-Wochenplaner ist als geführter Shared-Store-Workflow aktiv: private Quellenprüfung, Auswahl echter Google-Kalender, begrenzter 8-Tage-Read in `Europe/Berlin`, höchstens drei Outcomes, 35% Puffer, belegungs- und trainingstagssichere Vorschläge sowie synchronisierter Review. Erst danach kann ein einzelner Block in den bestehenden exakten 15-Minuten-Approval-Guard übergeben werden; es gibt keine Batch- oder Hintergrundwrites.
- Der erste reale Vorschau-Lauf wertete 8 ausgewählte Kalender und 49 Ereignisse aus. Da derzeit keine offenen Shared-Store-Aufgaben, Inbox-Einträge oder Projekte vorhanden waren, blieb der Plan ehrlich bei 0 Outcomes und 0 Fokusblöcken; `writesPerformed=false` wurde verifiziert.
- Abgelaufene Google-Access-Tokens werden jetzt serverseitig über den lokal verschlüsselt gespeicherten Refresh-Token erneuert. Der Status ist erst Online, wenn diese Erneuerung gelingt; Secrets und Tokens bleiben außerhalb UI, Logs und Git.

## Verification

- Root tests: 40/40 passed after the weekly-planner contracts, including Berlin DST, empty sources, foreign IDs, duplicates, review selection validation and unsafe block rejection.
- Root lint and optimized Next build: passed after the final UI/documentation refresh.
- Electron security checks: 2/2 passed. Expo TypeScript, lint and static web export passed.
- Browser: the private Tailscale URL passed desktop 1280-wide and mobile 390×844 checks without horizontal overflow or console errors. The life-area overview, faith empty state/editor, finance fields and split career columns rendered from the shared source.
- Electron: the current window opened the real faith area and its editor; cancel closed it without creating a record. Obsidian and Calendar still reported Online from verified sources.
- Production build, Electron checks and Expo TypeScript/lint/web export passed. Desktop and 390×844 browser checks rendered the real planner with no horizontal overflow or captured runtime error; mobile drawer opened and closed correctly.
- Git: life-area milestone `688e3c7` is on private `main`; the weekly-planner milestone is ready for its audited incremental commit.

## User boundaries

- Do not install a container runtime or start the PostgreSQL PoC without approval.
- Do not create a cloud database/account or migrate SQLite without inventory, mapping, conflict preview, backup/restore proof and explicit approval.
- Do not install/run Graphify or send Vault content to a model without a separate pilot proposal and approval.
- Do not perform another Calendar write without a new exact proposal and action-time confirmation.
