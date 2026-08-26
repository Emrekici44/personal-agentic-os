# Produkt-Audit: Personal Life OS

Stand: 26. August 2026

## Produktgrenze

Das System dient genau einer Person. Sichtbare Funktionen müssen Aufgaben, Gewohnheiten, Lebensbereiche, Projekte, Planung, Wissen oder persönliche Agenten unmittelbar verbessern. Laufzeit-, Policy-, Receipt-, Registry- und Connector-Begriffe sind keine Produktnavigation.

## Entscheidungen

### KEEP

- Verschlüsselter lokaler Shared Store mit versionierten Änderungen und reversiblem Archiv
- Aufgaben, Habits, Projekte, Inbox, Journal und spezialisierte Lebensbereichsdaten
- Google Calendar mit echtem Verbindungsstatus, begrenzten Reads und exakter Bestätigung vor Writes
- Obsidian als menschenlesbare, lokale Wissensquelle
- Private Session, Origin-Prüfung, Secret-Grenzen, Backups und sichere Wiederherstellung
- Desktop-, Mobile- und privater Remote-Zugriff

### SIMPLIFY

- `app/page.tsx`: von 19 gleichrangigen Produktansichten auf acht Hauptziele; bestehende Domain-Workspaces werden schrittweise aus dem Monolithen gelöst
- Heute: Quick Capture, Tagesfokus, Aufgaben und Habits in einem Einstieg statt Kommando-, Inbox- und Tages-Silos
- Planung: Wochenplanung und Kalender als ein Nutzerkonzept
- Agenten: verständliche Konfiguration und Arbeitsergebnisse; Runtime-Evidenz bleibt intern
- Einstellungen: Modelle, Darstellung, Datenschutz, Backup und Diagnose mit progressiver Offenlegung
- Verbindungen: Status und nutzerverständliche Aktionen statt Capability-Matrix

### MERGE

- Agenten + Skills → **Agenten & Skills**
- Gesundheit, Finanzen, Karriere, Beziehungen und Glaube → **Leben**
- Inbox + Aufgaben + Habits + Tagesüberblick → **Heute**
- Kalender + Wochenplanung → **Planung**
- Chat-Zusammenfassungen → Inbox/Wissen; Modellwahl → Agenten/Einstellungen

### DELETE AUS DEM NORMALEN PRODUKTPFAD

- Systemaufbau-Fortschritt und Roadmap-Status auf der Startseite
- Runtime Operations, Run Steps, Execution Receipts und Memory-Policy-Review in der Agentenansicht
- Connector Workbench und Capability-Verträge als Alltagsoberfläche
- separate Navigation für Chats, Skills, Inbox und Journal
- simulierte Aktivität, Fake-Provider-Verfügbarkeit, Fake-Banking und bedeutungslose Scores

Die zugehörige Sicherheitsmechanik wird erst entfernt, wenn alle aktiven Schreibpfade nachweislich ohne sie auskommen. Unsichtbar machen und technisch löschen sind bewusst zwei getrennte Schritte.

## Zielnavigation

1. Heute
2. Leben
3. Projekte
4. Planung
5. Agenten & Skills
6. Wissen
7. Verbindungen
8. Einstellungen

## Architekturleitplanken

- Domainnamen statt generischer Runtime-Typen an UI- und API-Grenzen
- Ein kanonisches Projektkonzept und gemeinsame Referenzen aus Aufgaben, Wissen und Agenten
- Gebete sind Habits mit Faith-Metadaten, kein zweiter Erledigungszustand
- Finanz-Fakten und Prognosen werden getrennt gespeichert und dargestellt
- Externe Verbindungen zeigen ausschließlich verifizierte Zustände
- Keine neue Framework-Schicht für die Vereinfachung

## Noch offene technische Reduktion

- Den 68-KB-Shared-Store nach stabilen Domain-Grenzen in direkte Repositories teilen
- Nicht mehr erreichbare Legacy-Views und deren Tests nach Datenmigration vollständig löschen
- Agent-Workflow und Skill-Ausführung auf einen kleinen persönlichen Job-Service reduzieren
- Finanzdatenmodell um Konten, Transaktionen, Budgets, Positionen und Net-Worth-Snapshots erweitern
- Faith-Habit-Migration implementieren, damit Gebete nur einen kanonischen Tageszustand besitzen
- Heute-Kalenderansicht mit echten Ereignissen statt reinem Verbindungsstatus ergänzen

