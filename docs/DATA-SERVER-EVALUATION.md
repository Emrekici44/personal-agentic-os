# Datenserver-Entscheidung – geprüfter Zwischenstand

Stand: 24.08.2026. Diese Entscheidungsvorlage erzeugt **kein Konto**, migriert **keine Nutzerdaten** und aktiviert **keinen kostenpflichtigen Dienst**.

## Kurzentscheidung

SQLite bleibt bis zu einer ausdrücklich freigegebenen Migration unangetastet. Für einen laptop-unabhängigen Endzustand ist verwaltetes PostgreSQL technisch plausibler als ein Datenbankserver auf Emres Heim-Laptop: Der Laptop ist sonst weiterhin Verfügbarkeits-, Wartungs- und Backup-Single-Point-of-Failure. Ein lokaler PostgreSQL-Container ist dennoch als reversibles Schema- und Export-PoC sinnvoll. Für die spätere echte Datenmigration empfiehlt sich zunächst ein kontrollierter Vergleich zwischen **Neon Free** und **Supabase Free**; die Entscheidung braucht vorher eine Datenklassifizierung und Emres ausdrückliche Account-/Cloud-Freigabe.

## Vergleich

| Kriterium | PostgreSQL selbst gehostet (Laptop + Tailscale) | Neon Free | Supabase Free |
|---|---|---|---|
| Kosten | Software/Image kostenlos; Strom, Wartung und Backup liegen bei Emre | 0 USD, ohne Kreditkarte; aktuell 0,5 GB/Projekt und 100 CU-Stunden/Monat/Projekt | 0 USD; aktuell 500 MB/Projekt, zwei aktive Free-Projekte |
| Laptop-unabhängig | Nein; Server ist bei Schlaf/Update/Defekt weg | Ja | Ja; Free-Projekt pausiert laut Preisseite nach einer Woche Inaktivität |
| Windows ARM | Offizielles Postgres-Image unterstützt `arm64v8`; Docker Desktop für Windows ARM ist laut Docker noch Early Access. Auf diesem Laptop sind Docker, Podman und `psql` nicht installiert. | Clientseitig normale TLS-PostgreSQL-Verbindung; kein lokaler Server nötig | Clientseitig HTTPS/PostgreSQL; kein lokaler Server nötig |
| Auth/Netz | App-API bleibt einzige Schnittstelle; PostgreSQL nur Loopback/Tailnet, eigene Rollenpflege | Credentials/TLS; öffentliche Cloud-Endpunkte, App-API muss Auth erzwingen | Integriertes Auth/RLS möglich; Schlüssel-/Policy-Konfiguration erhöht Komplexität |
| Backups | Emre muss `pg_dump`, Restore-Test und Offsite-Kopie betreiben | Kurzes Restore-/History-Fenster im Free-Plan; zusätzlicher eigener logischer Export empfohlen | Free hat keine automatischen Backups; Supabase empfiehlt regelmäßige CLI-Dumps und Offsite-Backups |
| Verschlüsselung | TLS ist in PostgreSQL möglich, aber selbst zu konfigurieren; Feldverschlüsselung bleibt App-Aufgabe | Transport/Provider-Infrastruktur; besonders sensible Felder weiterhin in der App verschlüsseln | Transport/Provider-Infrastruktur; besonders sensible Felder weiterhin in der App verschlüsseln |
| Offline | Desktop/iPhone brauchen eine lokale Queue und Konfliktvorschau | Gleich | Gleich |
| Wartung | Höchste Last: Updates, Hardening, Backups, Monitoring, Verfügbarkeit | Gering | Gering bis mittel; mehr Plattformdienste und Policies |
| Exit/Export | Voll kontrollierbar über `pg_dump` | PostgreSQL-kompatibler Dump/Restore | PostgreSQL-kompatibler Dump; Free-Backups müssen selbst organisiert werden |

## Reversibles PoC

Unter `infra/postgres/` liegt ein **nicht gestartetes** PoC:

- offizielles PostgreSQL-Image, auf eine konkrete Hauptversion begrenzt;
- Port ausschließlich an `127.0.0.1:55432`, niemals öffentlich;
- Compose-Profil `poc`, sodass es nicht versehentlich mit einem normalen Start hochfährt;
- leeres v1-Schema für die operativen Entitäten;
- keine App-Umschaltung, keine SQLite-Berührung und keine Nutzerdatenmigration;
- Geheimniswerte müssen aus einer privaten, ignorierten Umgebungsdatei kommen.

Das PoC wurde statisch geprüft, aber **nicht ausgeführt**, weil auf dem Windows-ARM-Laptop derzeit kein Container-Runtime installiert ist. Eine Installation wäre eine eigene Nutzergrenze.

## Migrationstor

Vor einer echten Migration müssen separat vorliegen:

1. Inventar und Feldmapping SQLite → PostgreSQL;
2. Klassifizierung sensibler Felder und Verschlüsselungsentscheidung;
3. Konfliktvorschau für Desktop-/iPhone-Zustand;
4. getesteter Dump und Restore;
5. Rückrollplan auf den unveränderten SQLite-Stand;
6. ausdrückliche Freigabe für Dienst/Account, Datenübertragung und Migration.

## Primärquellen

- [PostgreSQL: sichere TCP/IP-Verbindungen mit TLS](https://www.postgresql.org/docs/current/ssl-tcp.html) — PostgreSQL Global Development Group; aktuelle Dokumentation; abgerufen 24.08.2026. Belegt TLS-Fähigkeit und eigene Serverkonfiguration.
- [PostgreSQL: pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html) — PostgreSQL Global Development Group; aktuelle Dokumentation; abgerufen 24.08.2026. Belegt portablen logischen Export.
- [Docker Desktop auf Windows](https://docs.docker.com/desktop/setup/install/windows-install/) — Docker; abgerufen 24.08.2026. Belegt Windows-ARM-Status und Voraussetzungen.
- [Offizielles PostgreSQL-Container-Image](https://hub.docker.com/_/postgres) — Docker Official Images/PostgreSQL Community; abgerufen 24.08.2026. Belegt `arm64v8`-Unterstützung.
- [Neon Pricing](https://neon.com/pricing) — Neon; abgerufen 24.08.2026. Belegt die aktuellen Free-Grenzen. Anbieterquelle; Konditionen können sich ändern.
- [Supabase Pricing](https://supabase.com/pricing) — Supabase; abgerufen 24.08.2026. Belegt Free-Grenzen und Pausierung. Anbieterquelle; Konditionen können sich ändern.
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting) — Supabase; abgerufen 24.08.2026. Belegt Docker-Empfehlung und Betreiberpflichten.
- [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups) — Supabase; abgerufen 24.08.2026. Belegt fehlende automatische Free-Backups und empfohlenen manuellen Export.
