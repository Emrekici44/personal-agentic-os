# Offene Entscheidungen

Stand: 24.08.2026, Europe/Berlin. Diese Punkte blockieren nicht die übrige lokale, reversible Arbeit.

## Obsidian-Schreibfreigabe

- Benötigte Entscheidung: Eine später erzeugte exakte Markdown-Diffvorschau ausdrücklich freigeben oder verwerfen.
- Grund: Der Emre Vault enthält persönliche Wissensdaten und bleibt bis zur Aktionsfreigabe unverändert.
- Auswirkung: Erst nach Freigabe dürfte exakt die vorgeschlagene Systemnotiz oder Metadatenänderung geschrieben werden; bestehende Notizen werden nie still überschrieben, verschoben oder umbenannt.
- Kosten/Datenschutz: Keine Kosten; lokaler sensibler Inhalt. Backup-, Konflikt- und Restore-Nachweis ist Pflicht.
- Sicherer nächster Schritt: Vorschau im Agentic OS prüfen und nur den exakten Apply-Schritt separat bestätigen.

## PostgreSQL-Ziel und reale Migration

- Benötigte Entscheidung: Selbst gehostete private Instanz oder seriöse kostenlose Cloud-Stufe; anschließend separate Migrationsfreigabe.
- Grund: Emre lehnt SQLite als Endzustand ab, reale Daten dürfen aber erst nach Inventar, Mapping, Konfliktvorschau und Restore-Test umziehen.
- Auswirkung: Desktop und iPhone könnten später laptopunabhängig denselben Serverzustand verwenden.
- Kosten/Datenschutz: Je nach Ziel Wartungs-, Verfügbarkeits-, Cloud- und Datenschutzrisiken; mögliche spätere Kosten müssen vor Aktivierung sichtbar sein.
- Sicherer nächster Schritt: Zielvergleich gemeinsam abnehmen, danach nur einen reversiblen Migrationsplan genehmigen.

## Graphify-Pilot

- Benötigte Entscheidung: Separaten lokalen Pilot auf einer nicht sensiblen Kopie/technischen Teilmenge genehmigen.
- Grund: Graphify ist nicht Kernabhängigkeit; semantische Verarbeitung kann Inhalte an Modelle senden und Kosten erzeugen.
- Auswirkung: Optionaler Vergleich mit dem eingebauten selbst besessenen Graphen.
- Kosten/Datenschutz: Installation/Runtime-Kompatibilität sowie Modell- und Inhaltsabflussrisiko; externe Semantik bleibt aus.
- Sicherer nächster Schritt: Exakte TypeScript-Version, Testdatenumfang und rein strukturellen Modus vor Installation freigeben.

## Neue Verbindungen, Plugins oder kostenpflichtige Modelle

- Benötigte Entscheidung: Jede konkrete Verbindung/Installation und jede mögliche Nutzungsgebühr einzeln genehmigen.
- Grund: OAuth-Scope, Datenzugriff, externe Verarbeitung und Kosten unterscheiden sich je Anbieter.
- Auswirkung: Nur der ausdrücklich gewählte Connector oder Provider wird aktiviert.
- Kosten/Datenschutz: Anbieterabhängig; Zugangsdaten bleiben außerhalb Chat, Client und Git.
- Sicherer nächster Schritt: Health-/Kostenkarte lesen, Scope bestätigen und erst dann den offiziellen Login starten.

## Weitere externe Aktionen

- Benötigte Entscheidung: Jede Kalenderänderung, Nachricht, Finanztransaktion oder andere externe beziehungsweise folgenreiche Aktion benötigt eine neue exakte Aktionsfreigabe.
- Grund: Vorschlag und Ausführung bleiben getrennt; Hintergrundwrites sind gesperrt.
- Auswirkung: Nur der einzeln angezeigte Diff wird ausgeführt. Deletes bleiben deaktiviert.
- Kosten/Datenschutz: Aktionsabhängig; keine stillen Nebenwirkungen.
- Sicherer nächster Schritt: Exakte Vorschau mit Ziel, Inhalt und Gültigkeitsfenster prüfen und unmittelbar bestätigen oder verwerfen.
