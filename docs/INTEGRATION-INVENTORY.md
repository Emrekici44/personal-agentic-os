# Integrationsinventar

Stand: 24.08.2026. Status bedeutet nur dann „Online“, wenn die laufende App die Verbindung verifiziert. Dieses Dokument aktiviert keine Verbindung.

| Verbindung | Realistischer Weg | Kostenart | Daten-/Berechtigungsgrenze | Produktstatus |
|---|---|---|---|---|
| Google Calendar | Direkte Google OAuth/API | API selbst für diesen Umfang ohne aktivierte Abrechnung; Kontingente gelten | Kalenderliste + Lesen; Event Create/Update nur nach exakter Einzelvorschau; Delete/ACL/Sharing gesperrt | Verbunden und kontrolliert; keine weiteren Writes beauftragt |
| Emre Obsidian Vault | Lokaler Dateiadapter | Kostenlos | Metadaten/Links read-only; bestehende Notizen nur nach Migrationsvorschau und Freigabe ändern | Read-only Index verifiziert: 27 Markdown, 37 Links, 34 Beziehungen |
| Tailscale | Offizieller Client + Serve, kein Funnel | Personal-Nutzung kostenlos gemäß bestehender Konfiguration | Privates Tailnet; Laptop muss erreichbar sein | Einrichtung und iPhone-Pfad physisch bestätigt; Launcher prüft vor Expo einen JavaScript-Abruf vom exakten privaten Origin |
| ChatGPT Companion | Link zur ChatGPT-App + bewusster Zusammenfassungsimport | Im bestehenden Abo; keine API-Behauptung | Kein Verlaufsscraping, nur manuell ausgewählter Text | Funktionaler manueller Import in gemeinsame Inbox |
| OpenAI API | Responses API, serverseitiger Schlüssel | Nutzungsbasiert | Schlüssel nie im Client; Kill Switch + Limits + Kostenfreigabe vor Aktivierung | Deaktiviert/unconfigured |
| Lokales Modell | Später Ollama-kompatibler Provider | Keine Kosten pro Call, aber lokale Ressourcen | Hardware-/ARM-Kompatibilität und Modelllizenz zuerst prüfen | Nicht konfiguriert |
| Google Tasks | Direkte Tasks API oder kontrollierter Import | In der Regel API-Kontingent; neue OAuth-Scopes nötig | Eigene Scope-/Consent-Prüfung; keine implizite Erweiterung des Calendar-Tokens | Nicht konfiguriert |
| Health/Training | Manuelle lokale Shared-Store-Einträge; später Dateiimport oder expliziter Hersteller-Connector | Lokal kostenlos; Anbieter abhängig | Sensible Felder lokal verschlüsselt, read-only Connector bevorzugt, keine medizinische Interpretation | Manueller lokaler Pfad Online; kein Hersteller verbunden |
| Finanzen/Banken | Manuelle lokale Shared-Store-Einträge; CSV/Export zuerst; Aggregator nur nach Prüfung | Lokal kostenlos; Aggregatoren häufig kostenpflichtig/unklar | Hochsensibel, read-only, keine Transaktionen oder Beratung | Manueller lokaler Pfad Online; keine Bank verbunden |
| Expo Go | Lokaler/Tailscale-WebView-Companion | Kostenloser Entwicklungsweg | Keine öffentliche Tunnel-/EAS-Aktivierung | Physischer iPhone-Pfad bestätigt |
| PostgreSQL | Selbst gehostetes PoC oder später verwalteter Free-Dienst | Lokal kostenlos; Cloud-Free-Grenzen veränderlich | Keine Migration ohne Inventar, Backup, Konfliktvorschau und Freigabe | PoC-Dateien vorbereitet, nicht gestartet |
| Graphify | Optionaler lokaler Pilot | Kern MIT; semantische Provider können kosten | Nur nicht sensibles Teilkorpus, kein Vault-Write, kein Provider ohne Zustimmung | Geprüft, nicht installiert, nicht Kernabhängigkeit |

## Nächste sinnvolle Reihenfolge

1. Spezialisierte lokale Bereichsansichten und Einstellungen weiter vervollständigen.
2. Einen Obsidian-Diff erst bei realem Bedarf prüfen; Apply bleibt separat gesperrt.
3. PostgreSQL-Ziel nach Cloud-/Datenschutzentscheidung auswählen und Migration nur als Vorschau erzeugen.
4. Erst danach zusätzliche Tasks-/Health-/Finance-Scopes einzeln bewerten.
