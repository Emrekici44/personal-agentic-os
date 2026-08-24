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
- Der Projektbereich ist jetzt ein echter gemeinsamer Arbeitsraum: professionelle Karten-/Listenübersicht, editierbares Ziel, Beschreibung, Status, Zieldatum und nächste Aktion, projektgebundene Aufgaben, direkte sowie nachträgliche Inbox-Zuordnung, Wochenplanbezug und ein inhaltsarmer Audit-Verlauf. Veraltete Fake-Avatare, Demo-Ziele und die funktionslose Timeline wurden entfernt.
- Projekt-, Aufgaben- und Inbox-Updates halten ihre strukturierten SQLite-Spalten und JSON-Nutzdaten konsistent. Projektverknüpfungen werden serverseitig gegen echte, nicht archivierte Projekte validiert; die neue Workspace-API ist signiert, privat, cachefrei und gibt keine persönlichen Inhalte im Audit aus.
- Fünf echte lokale Agenten-Workflows sind verfügbar: Projekt-Coach, Glaubens-/Reflexionsassistent, Gesundheitsplaner, Finanzübersichtsassistent und Beziehungspflege-Assistent. Sie lesen ausschließlich freigegebene Shared-Store-Quellen, erzeugen deterministische Vorschläge mit `local-rules` und `model=none`, verwenden keine OpenAI-API und verursachen 0 € pro Lauf.
- Jeder Workflow besitzt klaren Input, Quellenbeleg, Vorschlagsoutput und Status. Eingabe, Output und Fortsetzungsstand werden feldverschlüsselt gespeichert; das Audit enthält nur Workflow-ID, Status und Zähler. Review, Pause und Fortsetzen sind synchronisiert. Externe oder folgenreiche Aktionen werden weder angeboten noch ausgeführt und benötigen später eine gesonderte exakte Freigabestufe.
- Glaubens-, Gesundheits-, Finanz- und Beziehungsvorschläge bleiben organisatorisch. Es gibt keine religiöse Autoritätsbehauptung, Diagnose, medizinische oder finanzielle Fachberatung, Transaktion oder automatische Nachricht.
- Skills sind keine freien Metadaten mehr: vier fest eingebaute lokale Prozeduren decken Prioritätenprüfung, Tages-Check, Lebensbereichsübersicht und Projektstand ab. Definitionen speichern Zweck, festes Eingabeschema, erlaubte echte Quellen, deterministische Schritte, Agentenreferenzen, Freigabeklasse, Status und Version.
- Skill-Läufe sind reine Vorschauen. Input/Output werden verschlüsselt, Quellenbelege bestehen aus Zählern und das Audit ist inhaltsarm. Beliebiger Code, Shell, dynamische Imports, Netzwerk, Modelle, Dateiänderungen, externe Writes und stille Agentenketten sind in Modul, API, Persistenz und UI gesperrt.
- Erstellen, Bearbeiten, zweistufiges reversibles Archivieren, lokaler Vorschau-Lauf, Review und reale Laufhistorie sind zwischen Desktop und Expo synchronisiert. Bestehende ältere Metadaten wären weiterhin nicht ausführbar, bis sie bewusst einer geprüften Prozedur zugeordnet werden.
- Der kontrollierte Obsidian-Schreibworkflow ist bis zur Nutzergrenze implementiert, ohne eine Vault-Datei zu ändern. Neue Notizen sind nur unter `00 Agentic OS/Inbox` oder `00 Agentic OS/System` vorschlagbar; Normalisierungen ergänzen ausschließlich fehlendes Frontmatter und garantieren einen byteweise unveränderten Body.
- Jede Vault-Vorschau bindet den aktuellen 27-Notizen-Index, validierten relativen Markdown-Pfad, Symlinkfreiheit, erwarteten SHA-256-Zustand, Konfliktprüfung, exakten Diff, Backupmanifest und Restore-Plan. Vorschlag und Pfad liegen verschlüsselt im Shared Store; Auditdaten enthalten keine Inhalte oder Pfade.
- Ein 15 Minuten gültiger gehashter Token und die Phrase `OBSIDIAN DIFF FREIGEBEN` können nur den Status `approved_pending_apply` setzen. Es gibt keinen Apply-Endpunkt und keine importierte Schreib-/Kopier-/Löschprimitive; die sichtbare Apply-Schaltfläche ist gesperrt.
- Das Integrationszentrum verwendet eine signierte private Health-API statt statischer Karten. Google Calendar, Obsidian und Shared Store werden serverseitig live geprüft; manuelle Gesundheits-/Finanzpfade sind nur wegen des verifizierten lokalen Stores Online. OpenAI, Google Tasks und andere externe Quellen bleiben unkonfiguriert; Tailscale ist nur bei einer tatsächlichen privaten HTTPS-Anfrage Online und sonst ehrlich `degraded`/`unconfigured`.
- Acht Connector-Verträge zeigen letzte erfolgreiche Prüfung, aktuelle Aktion, sicheren Fehlertext, Kostenklasse, Permission-Scope, Datenschutzgrenze, Reconnect-Anleitung und nicht sensible Evidenz. Eine erneute Health-Prüfung aktiviert keinen Dienst, erweitert keinen OAuth-Scope und führt 0 externe Writes/Kostenaktivierungen aus.
- Glaube besitzt nun echte Gebets-/Praxis- und Qurʾān-Felder, einen freiwilligen 5-Gebete-Tagesüberblick, aktuellen Lesestand und Verlauf aus ausschließlich selbst erfassten Datensätzen. Es gibt keine Standortautomatik, Gebetszeitberechnung oder religiöse Autoritätsbehauptung.
- Gesundheit trennt Training, Recovery, Ernährung und Messwerte mit Dauer/Intensität, Recovery 1–5, Schlaf und eigenem Messwert/Einheit. Kennzahlen und Verlaufsgrafik entstehen nur aus realen Einträgen; keine Diagnose oder medizinische Fachberatung.
- Finanzen berechnet Einnahmen/Ausgaben, Container-, Budget-, Wiederkehrend- und Sparzielzahlen nur aus manuellen Datensätzen je Währung. Keine Bank, Transaktion, Anlageentscheidung oder Finanzberatung ist verfügbar.
- Beziehungen zeigt ausschließlich echte Personen in einer privaten Konstellation sowie Geburtstage, letzten Kontakt und Follow-ups. Position 1–8 ist bewusst editierbar. Es gibt keinen Nachrichten-/Reminder-Versand. Alle neuen Spezialfelder liegen im verschlüsselten `sensitive_enc`; öffentliche Bereichsdaten enthalten weiter nur ID, Bereich, Typ, Titel und Status.

## Verification

- Root tests: 63/63 passed after specialized domains, integration-health, Obsidian-Diff, local-skill, agent-workflow, project-workspace and weekly-planner safeguards.
- Root lint and optimized Next build: passed after the final UI/documentation refresh.
- Electron security checks: 2/2 passed. Expo TypeScript, lint and static web export passed.
- Browser: the private Tailscale URL passed desktop 1280-wide and mobile 390×844 checks without horizontal overflow or console errors. The life-area overview, faith empty state/editor, finance fields and split career columns rendered from the shared source.
- Electron: the current window opened the real faith area and its editor; cancel closed it without creating a record. Obsidian and Calendar still reported Online from verified sources.
- Production build, Electron checks and Expo TypeScript/lint/web export passed. Desktop and 390×844 browser checks rendered the real planner with no horizontal overflow or captured runtime error; mobile drawer opened and closed correctly.
- Projektbrowser-Abnahme: echter leerer Shared-Store-Zustand, vollständiger Erfassungseditor mit deaktiviertem Leer-Speichern und Abbruch ohne Mutation; mobile 390×844 mit 0 horizontalem Überlauf.
- Agentenbrowser-Abnahme: alle fünf echten Workflow-Profile, Schutzgrenzen, Shared-Store-Quellen und lokale Kosten-/Modellwahrheit renderten auf Desktop und 390×844 ohne horizontalen Überlauf. Der Startknopf blieb ohne Eingabe deaktiviert; der Finanzassistent zeigte die Fachberatungs-/Transaktionsgrenze. Zur Prüfung wurde bewusst kein echter Lauf erzeugt.
- Produktionsbuild, Root-Lint/TypeScript, Electron 2/2 sowie Expo TypeScript/Lint/Web-Export sind nach dem Agentenmeilenstein grün.
- Skillbrowser-Abnahme: echter leerer Shared-Store-Zustand, Definition-Editor mit deaktiviertem Leer-Speichern und Abbruch ohne Mutation; mobile 390×844 ohne horizontalen Überlauf. Root/Lint/TypeScript, Produktionsbuild, Electron 2/2 und Expo TypeScript/Lint/Web-Export sind grün.
- Obsidianbrowser-Abnahme: echter 27-Notizen-Index, deaktivierte leere Diff-Erzeugung, funktionierender Wechsel zwischen neuer Systemnotiz und Normalisierung sowie mobile 390×844 ohne Überlauf. Es wurde keine Vorschau mit erfundenem Inhalt gespeichert. Das Vault-Manifest blieb bei 27 Markdown-Dateien und SHA-256 `F368D92A1064A853F6DD17C740ED057B516E9755BABE25F2910A5943F6DD2AB2`.
- Nach dem Obsidian-Meilenstein sind Root 55/55, TypeScript, ESLint, Produktionsbuild, Electron 2/2 und Expo TypeScript/Lint/Web-Export grün.
- Integrationsbrowser-Abnahme: Calendar/Obsidian/Shared Store live Online, OpenAI/Tasks unkonfiguriert, Tailscale im localhost-Client korrekt Degraded; Detail/Reconnect für Obsidian öffnet und 390×844 bleibt ohne horizontalen Überlauf. Root 58/58, TypeScript, ESLint, Produktionsbuild, Electron 2/2 und Expo TypeScript/Lint/Web-Export sind grün.
- Bereichsbrowser-Abnahme: Glaube zeigt 0/5 statt erfundener Praxis; leerer Gebetseditor kann nicht speichern und wurde abgebrochen. Gesundheit, Finanzen und Beziehungen zeigen ehrliche leere Analyse-/Konstellationszustände. Beziehungen bleiben auf 390×844 ohne horizontalen Überlauf. Root 63/63, TypeScript, ESLint, Produktionsbuild, Electron 2/2 und Expo TypeScript/Lint/Web-Export sind grün.
- Git: Projektarbeitsraum-Commit `b3b70cf7ec57f0205f01d70cb9163487dff89595` ist auf privatem `main`; der Agentenmeilenstein ist für seinen auditierten inkrementellen Commit bereit.

## User boundaries

- Do not install a container runtime or start the PostgreSQL PoC without approval.
- Do not create a cloud database/account or migrate SQLite without inventory, mapping, conflict preview, backup/restore proof and explicit approval.
- Do not install/run Graphify or send Vault content to a model without a separate pilot proposal and approval.
- Do not perform another Calendar write without a new exact proposal and action-time confirmation.
