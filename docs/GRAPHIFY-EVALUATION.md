# Graphify-Entscheidung für Agentic OS

Stand: 24.08.2026. Geprüfte Produktlinie: `rhanka/graphify`, npm-Paket `@sentropic/graphify` in Version **0.17.2**. Es wurde nichts installiert und kein Vault-Inhalt verarbeitet.

## Ergebnis

Graphify bleibt **optional** und wird nicht Kernabhängigkeit. Der vorhandene Agentic-OS-Index liefert bereits den kostenlosen strukturellen Basisnutzen: Markdown-Inventar, Wikilinks, aufgelöste Beziehungen und Graphansicht. Graphify kann darüber hinaus Ontologie-Typen, kanonische Entitäten, semantisch abgeleitete Beziehungen, Cluster, Provenienz und eine lokale Studio-Ansicht liefern. Dieser Mehrwert entsteht bei persönlichen Dokumenten jedoch überwiegend im semantischen Modelllauf – genau dort können Inhalte an einen Modellanbieter übertragen werden und Kosten entstehen.

## Verifizierte Eigenschaften

- Die aktuelle TypeScript-Linie verlangt Node.js 20+; auf Emres Rechner läuft Node.js 24.18.0 ARM64. Das erfüllt die deklarierte Engine, ist aber **noch kein vollständiger Windows-ARM-Kompatibilitätsnachweis** für alle optionalen Parser und Medienwerkzeuge.
- Paket und Repository deklarieren MIT. Das Repository beschreibt statisches HTML/JSON, Graphology/Louvain und einen read-only MCP-Server; Neo4j ist nicht erforderlich.
- Der Standard-Graphserver ist read-only. Ontologie-Mutationen verlangen explizit `--write`, Patch-Validierung und Dry-Run.
- Für Code ist ein deterministischer lokaler tree-sitter-Pass dokumentiert. Für Dokumente, Papers und Bilder sendet die semantische Extraktion laut offizieller Privacy-Sektion Inhalte an das Modell des Assistenten oder einen konfigurierten Provider.
- OCR kann Mistral verwenden; direkte Backends können OpenAI, Anthropic, Gemini, Mistral, Cohere oder lokales Ollama sein. Das kann Kosten und externe Datenübertragung verursachen.
- Die TypeScript-Linie ist aktiv, aber jung: Die am 24.08.2026 geprüfte Paketversion ist 0.17.2. Ein genauer Commit/Release muss vor einem Pilot gepinnt werden.

## Nutzen gegenüber dem eingebauten Graph

| Fähigkeit | Eingebauter Agentic-OS-Index | Graphify |
|---|---|---|
| Markdown-Dateien und Wikilinks | Bereits lokal und read-only verifiziert | Ebenfalls möglich |
| Externe Übertragung nötig | Nein | Für semantische Dokumentextraktion normalerweise ja; lokales Backend wäre gesondert zu prüfen |
| Kanonische Entitäten/Ontologie | Nur einfache stabile Beziehungen | Deutlich stärker |
| Inferenz mit Provenienz | Nein | `EXTRACTED`, `INFERRED`, `AMBIGUOUS` und Confidence |
| Interaktive lokale Ansicht | Agentic-OS-Graph | Statisches Ontology Studio |
| Betriebsaufwand | Sehr gering | Node-Paket, Cache/Artefakte, Provider-/Modellgrenze, Versionspflege |

## Sicherer Pilotvorschlag – noch nicht freigegeben

Nur nach separater Zustimmung:

1. exakte Repository-Revision und Paketversion pinnen;
2. Kopie eines kleinen **nicht sensiblen technischen** Teilkorpus außerhalb des Emre Vaults erstellen;
3. `.graphifyignore` so konfigurieren, dass Glaube, Finanzen, Gesundheit, Beziehungen, Personen und private Journale ausgeschlossen sind;
4. erst `scope inspect`, dann struktureller/lokaler Dry-Run;
5. keine Modell-/OCR-Verbindung und keine Kosten aktivieren;
6. erzeugte Artefakte auf erfundene Beziehungen, Datenabfluss und tatsächlichen Mehrwert prüfen;
7. erst danach über einen getrennten semantischen Pilot entscheiden.

Bis dahin bleibt der eingebaute, selbst kontrollierte Index der Produktionspfad.

## Primärquellen

- [Graphify README](https://github.com/rhanka/graphify/blob/main/README.md) — Projektrepository; abgerufen 24.08.2026. Belegt Funktionsumfang, Datenfluss, Privacy, read-only MCP, Studio und kontrollierten Patch-Workflow. Projektquelle mit Eigeninteresse; Aussagen wurden nicht durch eine Installation reproduziert.
- [Graphify package.json](https://raw.githubusercontent.com/rhanka/graphify/main/package.json) — Projektrepository; abgerufen 24.08.2026. Belegt Paketname, Version 0.17.2, Node >=20, Lizenzdeklaration und Abhängigkeiten.
- [Graphify LICENSE](https://raw.githubusercontent.com/rhanka/graphify/main/LICENSE) — Projektrepository; abgerufen 24.08.2026. Belegt MIT-Lizenztext.

## Offene Unsicherheiten

- Windows-ARM-Lauffähigkeit sämtlicher optionaler tree-sitter-/Medien-Abhängigkeiten ist ohne Installation nicht bewiesen.
- Qualität und Kosten semantischer Extraktion hängen vom gewählten Modell/Provider ab.
- Für nur 27 bestehende Markdown-Dateien kann der Zusatznutzen gegenüber dem bereits vorhandenen Linkgraph gering sein; das muss ein Pilot zeigen, nicht Marketingmaterial.
