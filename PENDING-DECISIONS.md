# Offene Entscheidungen

Stand: 24.08.2026, Europe/Berlin. Diese Punkte blockieren nicht die übrige lokale, reversible Arbeit.

Die deterministische Agent Runtime benötigt aktuell keine Provider-, Kosten- oder Autonomieentscheidung. Modellgestützte Planung, Background Agents, beliebige Tools, externe Aktionen und automatische Policy-Memory-Promotion bleiben technisch deaktiviert und wären jeweils ein späterer eigener Freigabeschritt.

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

## Wiederherstellung eines lokalen Shared-Store-Backups

- Benötigte Entscheidung: Eine konkrete, zuvor auf Integrität und Datensatzabweichungen geprüfte Backupdatei ausdrücklich zur Wiederherstellung freigeben.
- Grund: Ein Restore ersetzt veränderliche operative Daten und kann neuere Desktop-/iPhone-Eingaben zurücksetzen.
- Auswirkung: Erst ein späterer separater Apply-Executor dürfte nach einem zusätzlichen Vorher-Backup genau die ausgewählte Datei atomar einspielen. Der aktuelle Stand bietet ausschließlich eine Vorschau; Restore ist technisch gesperrt.
- Kosten/Datenschutz: Keine Kosten und kein Upload. Das lokale Backup enthält verschlüsselte private Felder, aber bewusst nicht den lokalen Schlüssel; es gehört nicht in Git, Logs oder Screenshots.
- Sicherer nächster Schritt: In Einstellungen ein lokales Backup wählen, Integrität und Konfliktzähler prüfen und erst danach eine exakte Restore-Aktion separat genehmigen.

## Windows-Dauerbetrieb und Installer

- Benötigte Entscheidung: Run Unattended, optionalen Benutzer-Autostart und gegebenenfalls einen späteren signierten Windows-Installer getrennt genehmigen; Schlaf-/Energieverhalten selbst wählen.
- Grund: Privater iPhone-Zugriff funktioniert nur, wenn Laptop, Agentic-OS-Dienst und Tailscale verfügbar bleiben. Autostart und Energieeinstellungen verändern das Systemverhalten.
- Auswirkung: Nach Freigabe könnte der private Dienst nach Anmeldung zuverlässiger starten; ein Installer wäre weiterhin ein eigener geprüfter Buildschritt.
- Kosten/Datenschutz: Keine geplanten Softwarekosten; längerer Betrieb benötigt Strom. Run Unattended erhöht die Verfügbarkeitsfläche des privaten Geräts, bleibt aber tailnet-only.
- Sicherer nächster Schritt: Zuerst nur den reversiblen Benutzer-Autostart und Tailscale Run Unattended einzeln prüfen; keine Energieeinstellung automatisch ändern.

## Persönliche Dateien als echte Projektanhänge

- Benötigte Entscheidung: Für einen konkreten Dateityp und Quellordner festlegen, ob Agentic OS nur einen Verweis speichern oder eine verwaltete lokale Kopie anlegen darf.
- Grund: Dateiübernahme ist eine persönliche Dateisystemmutation und kann sensible Inhalte, Duplikate oder veraltete Kopien erzeugen.
- Auswirkung: Projekt und Inbox können bereits private verschlüsselte Web-/Dateiverweise mit einem Kurztitel verwalten. Erst nach Freigabe dürfte eine spätere Funktion Dateien inventarisieren, öffnen oder als verwaltete Kopie übernehmen.
- Kosten/Datenschutz: Keine Kosten; hohe lokale Datenschutzrelevanz. Persönliche Dateien, Pfade und Vorschauen dürfen nicht in Git, Logs oder Screenshots gelangen.
- Sicherer nächster Schritt: Vorhandene reine Referenzfunktion nutzen. Für mehr zuerst eine inhaltsfreie Inventar-/Konfliktvorschau für einen ausdrücklich gewählten Ordner erstellen, dann Öffnen oder Kopie separat freigeben.

## Physische iPhone-Abnahme des aktuellen Stands

- Benötigte Entscheidung: Nach Emres Rückkehr Expo Go einmal vollständig neu öffnen und den aktuellen Stand auf dem iPhone kurz bestätigen.
- Grund: Automatisierte 390×844-Prüfung ersetzt keine echte WebView-/Touch-Abnahme auf dem Gerät. Seit der letzten physischen Abnahme kamen Tageseditoren, Checklisten, Inbox-Filter, Companion-Bibliothek, Konfliktschutz und der einmalige Background→Active-Recovery-Pfad hinzu.
- Auswirkung: Bestätigt die aktuellen mobilen Bedienpfade; bei einem Gerätefehler bleibt der Desktop-/Serverstand unverändert und der Fehler wird separat behoben.
- Kosten/Datenschutz: Keine Kosten, kein externer Write und keine Testdaten erforderlich. Tailscale/Expo bleibt privat.
- Sicherer nächster Schritt: Expo Go vollständig beenden/neu öffnen und nacheinander `Heute`, `Inbox`, `Chats & Modelle` sowie Light/Dark ohne Speichern persönlicher Testinhalte antippen; danach bei sichtbarem Offlinezustand einmal in den Hintergrund und zurück wechseln und nur die Wiederverbindung bestätigen.
