# Restlücken gegen Emres vollständigen Masterauftrag

Stand: 24.08.2026, Europe/Berlin. Diese Liste verwendet nur diskrete Zustände. Sie ist kein Prozentwert und kein Versprechen über ungeprüfte Funktionen.

## Verifiziert nutzbar

| Bereich | Reale Evidenz | Grenze |
| --- | --- | --- |
| Web, Electron, Expo | Eine gemeinsame responsive Next-Oberfläche; gehärtete Electron-Shell; physische iPhone-Navigation abgenommen | Electron ist ein verifizierter Entwicklungsstarter, noch kein signierter Windows-Installer |
| Privater Zugriff | Tailscale Serve über privates HTTPS/MagicDNS, kein Funnel | Laptop muss laufen und wach bleiben |
| Gemeinsamer Datenkern | Signierte private API, lokales SQLite/WAL, versionierte Migrationen, AES-256-GCM-Feldschutz, Audit, Backups und 409-Versionskonflikte statt Silent Merge | SQLite ist die aktuelle Brücke, nicht Emres gewünschter Endzustand |
| Heute | Echte gemeinsame Aufgaben mit Priorität/Fälligkeit/Bereich/Projekt und flexibler Checkliste; tägliche/wöchentliche Habits; verschlüsseltes Journal; Calendar-Tageszahl ohne Titel | Keine Hintergrund-Erinnerungen oder Systembenachrichtigungen |
| Projekte | Echte Details, Aufgaben, Inbox, nächste Aktion, Wochenplanbezug und inhaltsarmer Verlauf | Dateien sind noch nicht als verwaltete lokale Projektobjekte implementiert |
| Wochenplanung | Reale Calendar-/Task-/Inbox-/Projektquellen, max. drei Outcomes, 35% Puffer, Training-/Belegungsschutz, Review | Faith-/Relationship-Schutz bleibt unverifiziert, solange keine passenden Nutzerdaten vorhanden sind |
| Agenten und Skills | Fünf deterministische lokale Vorschlagsworkflows; vier feste sichere Prozedurtypen; verschlüsselte Laufhistorie | Kein autonomer Agent, kein Modell und keine externe Aktion wird behauptet |
| Lebensbereiche | Echte/leere gemeinsame Datensätze für Glaube, Gesundheit, Finanzen, Beziehungen und gesplittete Karriere | Keine externen Hersteller-, Bank-, Gebetszeit- oder Messaging-Verbindungen |
| Wissen | Reeller 27-Notizen-Vault-Index, 37 Links, 34 Beziehungen, private Metadatensuche, exakte Diffvorschau | Kein Vault-Apply; bestehende Notizen unverändert |
| Google Calendar | Verbunden, begrenzte Reads, enges Event-Scope, exakte Einzelwrite-Freigabe | Keine Hintergrundwrites, Deletes, ACL, Sharing oder Settings |
| Einstellungen und Usage | Geteiltes Branding/Theme, lokales geprüftes Backup, Restore-Vorschau, ehrliche Provider-/Limitgrenzen | Restore-Apply und bezahlte Provider technisch gesperrt |
| Private API und Calendar-Leerzustände | Status, Katalog, Reads, OAuth-Einstieg und lokale Token-Übernahme verlangen dieselbe signierte Sitzung; frühere Mock-Endpunkte sind deaktiviert | OAuth-Callback bleibt ausschließlich an den kurzlebigen verschlüsselten Google-State gebunden |
| Projektressourcen | Echte Web-/Dateiverweise mit öffentlichem Kurztitel, verschlüsselter Referenz, Projektzuordnung und inhaltsarmem Audit | Kein automatisches Öffnen, Kopieren, Uploaden oder Dateisystem-Inventar |

## Lokal weiter ausführbar

| Priorität | Restpunkt | Sicherer nächster vertikaler Schritt | Abnahmekriterium |
| --- | --- | --- | --- |
Alle derzeit im Ledger beschriebenen lokal reversiblen Vertikalschnitte sind umgesetzt. Der nächste lokale Schritt ist ein erneuter Restlücken-/Recovery-Audit; alle externen oder mutierenden Punkte bleiben unten gebündelt.

Der Recovery-Audit ist ebenfalls umgesetzt: Einstellungen prüfen den privaten Store, Connector-Verträge und Backup-Inventar nur lesend und zeigen einen sicheren Wiederanlaufpfad. Restore/Reconnect bleiben getrennte Grenzen.
Aktive Shared-Store-Ansichten härten den Laufzeitpfad zusätzlich: Netzwerkfehler werden unmittelbar als Offline gezeigt; nach einer zentral verifizierten Wiederverbindung laden die betroffenen Desktop-/Expo-Ansichten automatisch aus der gemeinsamen Quelle nach. Es gibt weiterhin keinen stillen lokalen Daten-Fork.
Auch unabhängige Quellen wie Agentenläufe, Skills, Planner, Knowledge-Audit, Backups und Archiv besitzen konkrete Retry-Aktionen. Folgecontrols bleiben gesperrt, wenn ihre echte Quelle fehlt; Offline bedeutet nicht „leere Beispieldaten“.

Auch „reversibel archiviert“ ist jetzt vollständig bedienbar: das lokale Datensatz-Archiv kann eine exakte Version in ihren vorherigen Status zurückholen. Das ist ausdrücklich kein Backup-Restore und keine externe Aktion.
Projekt, Journal und eigene Agent-Konfiguration besitzen zusätzlich einen zweistufigen Archiv-Einstieg. Die Transaktion blockiert Projekte beziehungsweise Agenten mit aktiven Verknüpfungen, bevor der Status geändert wird; damit bleibt der gemeinsame Datengraph konsistent.
Die Einzelwiederherstellung im Archiv ist ebenfalls zweistufig und abbrechbar. Der erste Klick verändert nichts; erst die sichtbare Bestätigung darf den bereits versions- und abhängigkeitsgesicherten lokalen Restore aufrufen.
Der lokale Bedienaudit ist abgeschlossen: 16 Kernansichten wurden auf Desktop und 390×844 ohne horizontalen Überlauf geprüft; alle sichtbaren aktiven mobilen Buttons erreichen mindestens 32 px in beiden Dimensionen, Menü/Journal-Impulse mindestens 44 px. Der physische Expo-Nachtest bleibt eine gebündelte Nutzeraktion.

## Nutzerentscheidung oder externe Grenze

Die gebündelten Details stehen in `PENDING-DECISIONS.md`. Kein Punkt hier blockiert lokale reversible Arbeit.

- PostgreSQL-Ziel, Account/Installation und reale Migration.
- Exakter Obsidian-Apply oder lokaler Backup-Restore.
- Graphify-Installation/Pilot.
- Neue OAuth-Verbindung, Plugin, Modellprovider oder mögliche Kosten.
- Weitere Calendar-Writes, Nachrichten, Transaktionen oder Gesundheitsaktionen.
- Run Unattended, Windows-Autostart/Installer und Schlaf-/Energieverhalten.
- Echte Dateiübernahme aus persönlichen Ordnern.
- Physischer Expo-Nachtest des aktuellen Nachtstands.

## Wahrheitsregeln

- Grün/Online bedeutet eine aktuelle technische Prüfung, nicht nur vorhandene Konfiguration.
- Die Startseite bezieht Planner-, Calendar-, Vault- und OpenAI-API-Status aus aktuellen privaten Endpunkten und trennt Erreichbarkeit von vorhandenen Nutzerdatensätzen.
- Leere reale Quellen bleiben leer; die Anwendung erzeugt keine persönlichen Beispiele.
- Ein sichtbarer Wert `0` erscheint nur nach erfolgreicher Quellprüfung. Lade-/Offlinezustände unterdrücken Zähler, Charts und mutierende Bereichscontrols, statt Nichterreichbarkeit als leeren Bestand darzustellen.
- Der gemeinsame Records-Client hält bei Loading/Offline keine sichtbaren Altstände bereit und lehnt Create/Update/Archive vor dem Request ab. Entwürfe dürfen lokal erhalten bleiben, werden aber nie still als zweite operative Datenquelle gespeichert.
- Fremdschlüssel-Auswahlen für Projekte, Agenten und Skill-Referenzen bleiben ebenfalls fail-closed: fehlende Kataloge werden als Loading/Offline bezeichnet und können keinen scheinbar gültigen leeren oder alten Bezug speichern.
- Deterministische Agenten- und Skill-Läufe folgen derselben Recovery-Wahrheit: alte Runs/Definitionen verschwinden nach Transportfehlern aus aktiven Controls; Retry lädt den privaten Stand neu, ohne lokale Ersatzläufe oder autonome Fortsetzung.
- Der Wochenplaner hält keine alte exakte Kalenderfreigabe über einen Reload/Offlinewechsel hinweg. Bei unklarem Write-Ergebnis wird nicht erneut gesendet; Statusprüfung und neue exakte Vorschau sind Pflicht.
- Vault-Metadaten, Audit, Diffvorschauen und kurzlebige Vorschau-Token überleben keinen unbestätigten Reloadzustand. Der echte Apply-Pfad bleibt technisch nicht vorhanden; Recovery kann daher keinen Vault-Write auslösen.
- Backup-/Archiv-Inventare zeigen Loading/Offline statt erfundener `0`; Auswahl und Restore-Vorschau werden vor Retry verworfen. Ein unbekanntes Backup-Ergebnis wird nicht still wiederholt, Restore-Apply bleibt gesperrt.
- Connector-/Kalenderkataloge werden beim Refresh invalidiert und unterscheiden Loading/Offline von einer verifiziert leeren Liste. Es existiert keine sichtbare `TESTADAPTER`-Behauptung mehr; begrenzte Reads fangen Transportfehler ohne Ersatzdaten ab.
- Produktmodule enthalten keine eingebetteten Kalender-, Ereignis-, Fokusblock- oder Provider-Mocks mehr; Testverträge prüfen echte Guards ohne sie als Nutzerdatenpfad bereitzuhalten.
- ChatGPT Pro ist kein API-Zugang. Companion Mode ist ein manueller Übergabepfad.
- SQLite ist operative Quelle, Obsidian dauerhafte Wissensquelle und Google Calendar externe Ereignisquelle, bis Emre eine andere Migration ausdrücklich freigibt.
- Keine kostenpflichtige oder öffentliche Fähigkeit wird still aktiviert.
