# PostgreSQL PoC (nicht aktiviert)

Dieses Verzeichnis ist eine reversible technische Probe, kein aktiver Datenpfad.

- Keine echten Daten und keine SQLite-Migration.
- Nur Loopback-Port `127.0.0.1:55432`.
- Kein Standard-Autostart (`profiles: [poc]`, `restart: no`).
- Passwort ausschließlich aus einer privaten Umgebung; niemals committen.
- App und Expo verwenden weiterhin den bestehenden Shared Store.

Auf Emres Windows-ARM-Laptop wurde am 24.08.2026 verifiziert: Docker, Podman und `psql` sind nicht installiert. Daher wurde das PoC nicht gestartet. Installation und erster Lauf brauchen eine separate Freigabe. Siehe `docs/DATA-SERVER-EVALUATION.md`.
