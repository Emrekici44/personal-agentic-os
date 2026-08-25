# Integrationsinventar

Stand: 24.08.2026. Status bedeutet nur dann „Online“, wenn die laufende App die Verbindung verifiziert. Dieses Dokument aktiviert keine Verbindung.

| Verbindung | Realistischer Weg | Kostenart | Daten-/Berechtigungsgrenze | Produktstatus |
|---|---|---|---|---|
| Google Calendar | Direkte Google OAuth/API | API selbst für diesen Umfang ohne aktivierte Abrechnung; Kontingente gelten | Lesen sowie exakte Create/Update/Delete-Einzelaktion; Update mit Driftprüfung, Delete immer destruktive Action-Time-Freigabe | Connector verbunden; Mutationspfade lokal/fake verifiziert, keine reale Abnahmeaktion in diesem Schritt |
| Emre Obsidian Vault | Lokaler Dateiadapter | Kostenlos | Metadaten/Links read-only; exakte einzelne Markdown Create/Update/Delete-Aktion mit Pfad-/Hash-/Backup-Grenze | Code und Temp-Vault-Tests verifiziert; keine persönliche Vault-Datei in diesem Schritt geändert |
| Tailscale | Offizieller Client + Serve, kein Funnel | Personal-Nutzung kostenlos gemäß bestehender Konfiguration | Privates Tailnet; Laptop muss erreichbar sein | Einrichtung und iPhone-Pfad physisch bestätigt; Launcher prüft vor Expo einen JavaScript-Abruf vom exakten privaten Origin |
| ChatGPT Companion | Link zur ChatGPT-App + bewusster Zusammenfassungsimport | Im bestehenden Abo; keine API-Behauptung | Kein Verlaufsscraping, nur manuell ausgewählter Text | Funktionaler manueller Import in gemeinsame Inbox |
| OpenAI API | Responses API, serverseitiger Schlüssel | Nutzungsbasiert | Schlüssel nie im Client; Provider/API Enable, Kill Switch + positive Tages/Monats/Pro-Lauf-Grenzen vor Aktivierung | Adapter implementiert, committed defaults deaktiviert, kein Request erfolgt |
| Lokales Modell | Später Ollama-kompatibler Provider | Keine Kosten pro Call, aber lokale Ressourcen | Hardware-/ARM-Kompatibilität und Modelllizenz zuerst prüfen | Nicht konfiguriert |
| Google Tasks | Direkte Tasks API | In der Regel API-Kontingent; neuer OAuth-Scope nötig | Bounded Read + exakte Create/Update/Delete-Einzelaktion; kein Silent Sync/Bulk Delete | Connector und Fake-Tests implementiert; real `scope_missing` bis expliziter Tasks-Consent |
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
