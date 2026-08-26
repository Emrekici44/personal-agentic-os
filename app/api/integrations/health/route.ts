import { NextRequest, NextResponse } from "next/server";

import { calendarConfig, calendarScopes, hasStoredToken, refreshedAccessToken, tokenScopes } from "@/lib/google-calendar";
import { readVaultPreview, vaultConfigured } from "@/lib/obsidian-vault";
import { providerPolicy } from "@/lib/openai-provider.mjs";
import { googleTasksScopes } from "@/lib/google-tasks";
import { storeStatus, verifyLocalSession } from "@/lib/shared-store";

const headers = { "Cache-Control": "no-store, private" };
const base = (checkedAt: string) => ({ checkedAt, externalWritesPerformed: false, credentialsExposed: false });

export async function GET(request: NextRequest) {
  if (!verifyLocalSession(request.cookies.get("agentic_os_local_session")?.value)) return NextResponse.json({ error: "Lokale Sitzung erforderlich" }, { status: 401, headers });
  const checkedAt = new Date().toISOString(), calendarConfiguration = calendarConfig(), grantedScopes = tokenScopes(request.cookies.get("agentic_os_google_token")?.value);
  let calendarConnected = false, calendarError = "";
  try { calendarConnected = Boolean(await refreshedAccessToken(request.cookies.get("agentic_os_google_token")?.value)); }
  catch { calendarError = "Google-Tokenprüfung vorübergehend nicht erreichbar"; }
  let vault: any = null, vaultError = "";
  if (vaultConfigured()) {
    try { vault = await readVaultPreview(); } catch { vaultError = "Lokaler Vault-Index konnte nicht gelesen werden"; }
  }
  let shared: any = null, sharedError = "";
  try { shared = storeStatus(); } catch { sharedError = "Lokaler Shared Store konnte nicht geprüft werden"; }
  const openai = providerPolicy(process.env), privateHost = process.env.AGENTIC_OS_PRIVATE_HOST?.trim(), requestHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "", forwardedProto = request.headers.get("x-forwarded-proto") || "";
  const tasksConnected = calendarConnected && grantedScopes.includes(googleTasksScopes.write);
  const privateRouteVerifiedHere = Boolean(privateHost && requestHost.toLowerCase() === privateHost.toLowerCase() && forwardedProto === "https");
  const localRecords = shared?.counts || {};
  const connectors = [
    {
      id: "google-calendar", name: "Google Calendar", area: "Kalender & Wochenplanung",
      status: calendarConnected ? "online" : calendarConfiguration.configured || calendarError ? "degraded" : "unconfigured",
      costClass: "Free", classification: "direct_api", lastSuccessfulSync: calendarConnected ? checkedAt : null,
      currentAction: calendarConnected ? "Verbindung und gewährte Scopes serverseitig verifiziert" : calendarError ? "Tokenprüfung wiederholen; keine neue Freigabe aus einem unklaren Status starten" : calendarConfiguration.configured ? "OAuth ist konfiguriert; Verbindung erneut freigeben" : "Lokalen OAuth-Client konfigurieren",
      recentError: calendarConnected ? null : calendarError || (calendarConfiguration.configured ? "Kein aktuell verwendbarer Google-Token" : null),
      permissionScope: calendarScopes.map((scope) => scope.split("/").at(-1)),
      privacy: "Kalenderdaten bleiben im privaten Serverpfad; 8-Tage-Reads, keine Hintergrundwrites, Deletes/ACL/Sharing gesperrt.",
      reconnect: calendarConfiguration.configured ? "Im Calendar-Bereich „Lesen + kontrollierte Event-Writes freigeben“ öffnen und Google-Zustimmung selbst bestätigen." : "Google-Cloud-Webclient und lokale .env.local gemäß Setup einrichten; keine Secrets im Chat.",
      evidence: { configured: calendarConfiguration.configured, connected: calendarConnected, connectionCheck: calendarError ? "error" : "complete", storedToken: hasStoredToken(), exactApproval: true, grantedRequiredScopes: calendarScopes.every((scope) => grantedScopes.includes(scope)) },
      ...base(checkedAt),
    },
    {
      id: "obsidian", name: "Obsidian · Emre", area: "Wissen",
      status: vault ? "online" : vaultConfigured() ? "degraded" : "unconfigured", costClass: "Free", classification: "local_adapter",
      lastSuccessfulSync: vault?.indexedAt || null, currentAction: vault ? `${vault.noteCount} Markdown-Notizen read-only indiziert` : vaultConfigured() ? "Lokalen Pfad und Leserechte prüfen" : "Vault-Pfad nur lokal konfigurieren",
      recentError: vaultError || null, permissionScope: ["Lokale Markdown-Metadaten", "Lokale Links", "Read-only Index"],
      privacy: "Notiztexte, absolute Pfade, Anhänge und sensible Beziehungsdetails erscheinen nicht im Health-Protokoll.",
      reconnect: "Desktop-App über den verifizierten Launcher starten; dieser setzt den autorisierten Pfad nur lokal, falls der Vault vorhanden ist.",
      evidence: vault ? { notes: vault.noteCount, links: vault.linkCount, relationships: vault.relationshipCount, writesEnabled: false } : { writesEnabled: false },
      ...base(checkedAt),
    },
    {
      id: "shared-store", name: "Agentic OS Shared Store", area: "Gemeinsame App-Daten",
      status: shared?.online ? "online" : "offline", costClass: "Free", classification: "local_database", lastSuccessfulSync: shared?.online ? checkedAt : null,
      currentAction: shared?.online ? `Schema v${shared.schemaVersion} · WAL und Feldverschlüsselung aktiv` : "Lokalen Server/Launcher neu starten", recentError: sharedError || null,
      permissionScope: ["Private signierte App-Sitzung", "Lokale strukturierte Datensätze"], privacy: "Datenbank, WAL, Backups und Schlüssel liegen außerhalb Git und werden nicht im Browser offengelegt.",
      reconnect: "Agentic OS über den Desktop-Launcher neu starten. Keine separate Cloud-Anmeldung erforderlich.", evidence: shared ? { schemaVersion: shared.schemaVersion, wal: shared.wal, encryptedFields: shared.sensitiveFieldEncryption } : {}, ...base(checkedAt),
    },
    {
      id: "agent-runtime", name: "Agent Runtime", area: "Planner, Skills, Tools & Evidence", status: shared?.online ? "online" : "offline", costClass: "Free", classification: "local_runtime", lastSuccessfulSync: shared?.online ? checkedAt : null,
      currentAction: shared?.online ? `${Number(localRecords.agent_workflow_runs||0)} Runs · ${Number(localRecords.execution_receipts||0)} Receipts · ${Number(localRecords.approvals||0)} Approval-Artefakte` : "Runtime-Persistenz nicht verifiziert", recentError: sharedError||null,
      permissionScope: ["Deterministic local", "Allowlisted skills/tools", "Exact approvals"], privacy: "Health Evidence enthält nur Zähler und Capability-Zustände, keine Inputs, Memory-Inhalte oder Secrets.", reconnect: "Shared Store lokal wiederherstellen und Diagnose erneut laden.", evidence: { modelProvider:"disabled", externalWritesAutomatic:false, backgroundActions:false, receipts:Number(localRecords.execution_receipts||0), schedules:Number(localRecords.runtime_schedules||0) }, ...base(checkedAt),
    },
    {
      id: "openai", name: "OpenAI API", area: "Optionale Modelle",
      status: openai.configured && openai.mode === "api" && !openai.killSwitch ? "degraded" : "unconfigured", costClass: "Usage-based", classification: "optional_paid_api", lastSuccessfulSync: null,
      currentAction: "Keine Anfrage; API-Modus bleibt standardmäßig deaktiviert", recentError: null,
      permissionScope: ["Keine verifizierten Modelle", "Kein Client-Key", "Kill Switch"], privacy: "Prompts würden erst nach Kostenfreigabe serverseitig an OpenAI gesendet; aktuell findet keine Übertragung statt.",
      reconnect: "Nur nach bewusster Kostenfreigabe den lokalen OpenAI-Konfigurationslauncher verwenden; Key und Limits bleiben serverseitig in .env.local.",
      evidence: { mode: openai.mode, configured: openai.configured, killSwitch: openai.killSwitch, preciseUsageAvailable: false }, ...base(checkedAt),
    },
    {
      id: "google-tasks", name: "Google Tasks", area: "Aufgaben",
      status: tasksConnected ? "online" : calendarConfiguration.configured ? "degraded" : "unconfigured", costClass: "Free", classification: "direct_api", lastSuccessfulSync: tasksConnected ? checkedAt : null,
      currentAction: tasksConnected ? "Google-Tasks-Berechtigung serverseitig verifiziert" : calendarConfiguration.configured ? "Google-Verbindung erneut freigeben, um Tasks einzuschließen" : "Lokalen Google-OAuth-Client konfigurieren", recentError: null,
      permissionScope: ["Google Tasks lesen", "Kontrollierte Einzel-Writes nach Bestätigung"], privacy: "Tasks verwenden dieselbe private Google-OAuth-Sitzung; keine Hintergrundwrites und keine stillen Löschungen.", reconnect: "Google im Bereich Verbindungen freigeben. Calendar und Tasks werden gemeinsam transparent angefragt.", evidence: { sharedGoogleConsent: true, writeScopeGranted: tasksConnected, exactApproval: true }, ...base(checkedAt),
    },
    {
      id: "health-local", name: "Gesundheit · manuell lokal", area: "Training, Erholung, Ernährung",
      status: shared?.online ? "online" : "offline", costClass: "Free", classification: "manual_local", lastSuccessfulSync: shared?.online ? checkedAt : null, currentAction: `${Number(localRecords.area_records || 0)} gemeinsame Bereichsdatensätze verfügbar; keine Herstellerverbindung`, recentError: sharedError || null,
      permissionScope: ["Manuelle Shared-Store-Einträge"], privacy: "Sensible Felder sind lokal verschlüsselt; keine medizinische Interpretation oder externe Übertragung.", reconnect: "Lokalen Shared Store wiederherstellen oder Daten bewusst manuell/importbasiert erfassen.", evidence: { externalConnector: false, medicalAdvice: false }, ...base(checkedAt),
    },
    {
      id: "finance-local", name: "Finanzen · manuell lokal", area: "Finanzübersicht",
      status: shared?.online ? "online" : "offline", costClass: "Free", classification: "manual_local", lastSuccessfulSync: shared?.online ? checkedAt : null, currentAction: "Manuelle verschlüsselte Datensätze; kein Bankabruf", recentError: sharedError || null,
      permissionScope: ["Manuelle Shared-Store-Einträge"], privacy: "Keine Bankzugänge, Transaktionen, Anlageberatung oder externe Aggregation.", reconnect: "Lokalen Shared Store wiederherstellen; ein CSV-/Bank-Connector benötigt später separate Datenschutz- und Kostenfreigabe.", evidence: { bankConnected: false, transactionsEnabled: false }, ...base(checkedAt),
    },
    {
      id: "tailscale", name: "Tailscale Serve", area: "Privater Fernzugriff",
      status: privateRouteVerifiedHere ? "online" : privateHost ? "degraded" : "unconfigured", costClass: "Free", classification: "private_network", lastSuccessfulSync: privateRouteVerifiedHere ? checkedAt : null,
      currentAction: privateRouteVerifiedHere ? "Diese Anfrage kam über private HTTPS/MagicDNS" : privateHost ? "Private Host-Konfiguration vorhanden; in diesem Client nicht live belegt" : "In dieser Serverumgebung nicht erkannt", recentError: null,
      permissionScope: ["Tailnet-only HTTPS", "Kein Funnel", "Kein Port-Forwarding"], privacy: "Privater Tailnet-Zugriff; Hostname und IP werden nicht im Repository gespeichert.", reconnect: "Tailscale auf beiden Geräten verbinden und den privaten Windows-Launcher starten. Funnel bleibt aus.", evidence: { privateHostConfigured: Boolean(privateHost), verifiedThroughCurrentRequest: privateRouteVerifiedHere, funnel: false }, ...base(checkedAt),
    },
  ];
  return NextResponse.json({ checkedAt, connectors, catalogExtensible: true, paidActivationsPerformed: false, externalWritesPerformed: false }, { headers });
}
