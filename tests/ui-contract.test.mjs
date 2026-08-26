import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/page.tsx", import.meta.url);
const cssPath = new URL("../app/globals.css", import.meta.url);
const layoutPath = new URL("../app/layout.tsx", import.meta.url);
const nextConfigPath = new URL("../next.config.ts", import.meta.url);
const mobileCompanionPath = new URL("../apps/mobile/src/Companion.tsx", import.meta.url);
const iphoneHelperPath = new URL("../scripts/start-iphone.ps1", import.meta.url);
const privateHelperPath = new URL("../scripts/start-private-access.ps1", import.meta.url);
const tailscaleIphoneHelperPath = new URL(
  "../scripts/start-iphone-tailscale.ps1",
  import.meta.url,
);

test("uses Emre as the local user identity without the mistaken names", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Was ist heute wichtig\?/);
  assert.match(page, /className="avatar">E<\/span>/);
  assert.doesNotMatch(page, /\b(?:Eden|Eren)\b/i);
  assert.match(page, /localStorage\.setItem\("aos:" \+ k/);
  assert.match(page, /CHATGPT COMPANION MODE · STANDARD/);
  assert.match(page, /Kein Scraping, kein\s+automatischer Zugriff auf deinen Verlauf/);
});

test("keeps the futuristic shell responsive and motion-accessible", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(css, /--bg: #030812/);
  assert.match(css, /--cyan: #2ad7ff/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.mobileNav/);
  assert.match(css, /\.logo>button,\.prompts button\{min-height:44px\}/);
  assert.match(page, /function MobileNav/);
  assert.match(
    page,
    /function MobileNav[\s\S]*?const choose=\(id:string\)=>\{setMoreOpen\(false\);go\(id\)\}[\s\S]*?<button[\s\S]*?onClick=\{\(\) => choose\(id\)\}[\s\S]*?type="button"/,
    "mobile navigation uses real touch buttons instead of WebView-intercepted anchors",
  );
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("gives every mobile destination and drawer control real navigation semantics", async () => {
  const page = await readFile(pagePath, "utf8");

  for (const destination of ["home", "areas", "projects", "weekly", "agents"]) {
    assert.match(page, new RegExp(`\\["${destination}",`));
  }
  assert.match(page, /href=\{`#\$\{id\}`\}/);
  assert.match(page, /window\.history\.pushState/);
  assert.match(page, /window\.addEventListener\("popstate"/);
  assert.match(page, /const next = isView\(fromHash\) \? fromHash : fromState/);
  assert.match(page, /initialView = isView\(initialHash\)/);
  assert.match(page, /aria-controls="primary-navigation"/);
  assert.match(page, /aria-expanded=\{menu\}/);
  assert.match(page, /aria-current=\{v === id \? "page"/);
  assert.match(page, /Weitere Bereiche/);
  assert.match(page, /\["brain", "Wissen"/);
  assert.match(page, /\["integrations", "Verbindungen"/);
  assert.match(page, /\["settings", "Einstellungen"/);
});

test("does not present generic action buttons without a handler as active", async () => {
  const [page, css] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /aria-disabled=\{!onClick\}/);
  assert.match(page, /disabled=\{!onClick\}/);
  assert.match(css, /\.btn:disabled/);
  assert.doesNotMatch(page, /Neuer Projekt-Chat vorbereitet|sichere Details geöffnet/);
  assert.doesNotMatch(page, /Kurzes Training Push|DIESEN TERMIN JETZT SCHREIBEN/);
  assert.match(page, /Nächste 8 Tage lesen/);
  assert.match(page, /Kein Write vorbereitet/);
});

test("shares an accessible light and dark preference across desktop and mobile web", async () => {
  const [page, css, mobileConfig] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
    readFile(new URL("../apps/mobile/app.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /api\/state\/preferences\/theme/);
  assert.match(page, /data-theme=\{theme\}/);
  assert.doesNotMatch(page, /className="themeSwitch"/);
  assert.match(page, /className="themeChoices"/);
  assert.match(css, /\.os\[data-theme="light"\]/);
  assert.match(mobileConfig, /"userInterfaceStyle": "automatic"/);
});

test("journal links only real shared counts and a content-minimal daily calendar read", async () => {
  const route = await readFile(new URL("../app/api/calendar/today-summary/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(await readFile(pagePath, "utf8"), /VERKNÜPFUNGSVORSCHAU · BEISPIEL|3 Termine|6 Habits|3 Aufgaben/);
  assert.match(await readFile(pagePath, "utf8"), /api\/calendar\/today-summary/);
  assert.match(await readFile(pagePath, "utf8"), /journalHistory/);
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /berlinLocalIso/);
  assert.match(route, /maxResults: "2500"/);
  assert.match(route, /fields: "items\(id,start,end\),nextPageToken"/);
  assert.match(route, /titlesExposed: false/);
  assert.match(route, /boundedDays: 1/);
  assert.match(route, /writesPerformed: false/);
  assert.doesNotMatch(route, /summary|description|location|attendees/);
  assert.match(await readFile(pagePath, "utf8"), /setCalendarSummary\(\{ state: "loading" \}\)/);
  assert.match(await readFile(pagePath, "utf8"), /onRetry=\{loadCalendarSummary\}/);
  assert.match(await readFile(pagePath, "utf8"), /window\.addEventListener\("agentic-os:runtime-online", recover\)/);
});

test("universal inbox provides real encrypted triage instead of fake file capture", async () => {
  const page = await readFile(pagePath, "utf8");
  for (const label of ["Triage öffnen", "Lebensbereich", "Projekt", "Agentenreferenz", "Triage speichern", "Dateiverweis", "GEMEINSAME REVIEW-ANSICHT", "Zugeordnet", "Abgeschlossen", "Inbox-Titel durchsuchen", "Archivierung bestätigen"]) assert.match(page, new RegExp(label));
  assert.match(page, /kein Datei-Upload oder Kopieren/i);
  assert.match(page, /useSharedRecords\("projects"\)/);
  assert.match(page, /useSharedRecords\("agents"\)/);
  assert.match(page, /filteredEntries/);
  assert.match(page, /completeEntry/);
  assert.match(page, /archiveSelected/);
  assert.doesNotMatch(page, /\["Idee", "Aufgabe", "Notiz", "ChatGPT-Notiz", "Link", "Datei"\]/);
});

test("ChatGPT Companion organizes only deliberate local summaries and tells provider truth", async () => {
  const page = await readFile(pagePath, "utf8");
  for (const truth of ["CHATGPT COMPANION MODE · STANDARD", "Kein Scraping", "LOKALE COMPANION-BIBLIOTHEK", "kein direkter Modellzugriff", "Kill Switch aktiv", "Lokales Modell", "Nicht verifiziert", "Providerzugriff: keiner"]) assert.match(page, new RegExp(truth, "i"));
  assert.match(page, /manual-companion-import/);
  assert.match(page, /chatgpt-subscription-companion/);
  assert.match(page, /modelAccess: "none"/);
  assert.match(page, /useSharedRecords\("inbox_items"\)/);
  assert.match(page, /useSharedRecords\("projects"\)/);
  assert.match(page, /saveOrganization/);
  assert.doesNotMatch(page, /fetch\([^\n]+chatgpt\.com[^\n]+history/i);
});

test("shared clients expose offline truth and reload after version conflicts", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /checkRuntimeHealth/);
  assert.match(page, /setInterval\(checkRuntimeHealth, 30_000\)/);
  assert.match(page, /Gemeinsamer Datenkern nicht erreichbar/);
  assert.match(page, /keinen stillen lokalen Ersatzstand/);
  assert.match(page, /response\.status===409\)await load\(\)/);
  assert.match(page, /Erneut prüfen/);
  assert.match(page, /agentic-os:runtime-online/);
  assert.match(page, /window\.dispatchEvent\(new Event\("agentic-os:runtime-online"\)\)/);
  assert.match(page, /window\.addEventListener\('agentic-os:runtime-online',recover\)/);
  assert.match(page, /setState\('error'\);throw new Error\('Gemeinsamer Datenkern nicht erreichbar'\)/);
  assert.match(page, /function RetryNotice/);
  for (const retry of [/onRetry=\{loadWorkspace\}/, /onRetry=\{loadWorkflows\}/, /onRetry=\{loadSkills\}/, /onRetry=\{loadAudit\}/, /onRetry=\{loadBackups\}/, /onRetry=\{loadArchive\}/]) assert.match(page, retry);
  assert.match(page, /workflowState\.state==="online"&&!busy/);
});

test("today derives planning and connection truth without exposing provider operations", async () => {
  const page = await readFile(pagePath, "utf8");
  for (const endpoint of ["/api/calendar/status", "/api/planner", "/api/obsidian/status"]) assert.match(page, new RegExp(endpoint.replaceAll("/", "\\/")));
  assert.match(page, /function Home\(\{ go \}: any\)/);
  assert.match(page, /function Today\(\{ go, note \}: any\)/);
  assert.match(page, /function QuickCapture/);
  assert.match(page, /const readSource = async \(url: string\)/);
  assert.match(page, /return \{ ok: false, result: null \}/);
  assert.match(page, /setPlannerState\(\{ state: planner\.ok \? "online" : "offline", plan: planner\.ok \? planner\.result\.plan \|\| null : null \}\)/);
  assert.match(page, /window\.addEventListener\("agentic-os:runtime-online",recover\)/);
  assert.match(page, /\["agents", "Agenten & Skills"/);
  assert.doesNotMatch(page, /\["chat", "Chats & Modelle"/);
});

test("loading and offline sources are never rendered as truthful zero counts", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /taskState==="error"\?"Aufgabenquelle nicht erreichbar"/);
  assert.match(page, /taskState==="online"\?`\$\{openTasks\.length\} offene Aufgaben`/);
  assert.match(page, /taskState\s*===\s*"online"\s*\?\s*`\$\{openTasks\.length\} offen`\s*:\s*taskState==="loading"\?"Lädt …":"Offline"/);
  assert.match(page, /state==="online"\?`\$\{count\} gemeinsame Einträge`:state==="loading"\?"Einträge werden geladen":"Einträge nicht erreichbar"/);
  assert.match(page, /state==="online"&&<DomainInsights/);
  assert.match(page, /onClick=\{state==="online"\?\(\) => openCreate\(\):undefined\}/);
});

test("shared record mutations fail closed while the private source is unavailable", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /if\(state!==['"]online['"]\)throw new Error\(['"]Gemeinsamer Datenkern ist nicht schreibbereit['"]\)/);
  assert.match(page, /return\{records:state===['"]online['"]\?records:\[\],state,create,update,archive,reload:load\}/);
  assert.match(page, /disabled=\{habitState !== "online"\}/);
  assert.match(page, /disabled=\{taskState !== "online"\}/);
  assert.match(page, /journalState === "online" \? completeJournal : undefined/);
  assert.match(page, /state === "online" && txt\.trim\(\)\.length >= 2 \? capture : undefined/);
  assert.match(page, /state === "online" && \(!projectId \|\| projectState === "online"\) && captureTitle\.trim\(\)\.length >= 2/);
});

test("cross-source references remain blocked until their real source is verified", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /Projektzuordnung ist gerade nicht verifizierbar/);
  assert.match(page, /disabled=\{projectState !== "online"\}/);
  assert.match(page, /Projektquelle wird geladen/);
  assert.match(page, /Skill-Referenzen nicht verifiziert/);
  assert.match(page, /projectState==="online"&&Boolean\(runInput\.projectId\)/);
  assert.match(page, /Zuordnungsquellen sind gerade nicht vollständig verifizierbar/);
  assert.match(page, /disabled=\{agentState !== "online"\}/);
  assert.match(page, /\(!triageDraft\.agentId \|\| agentState === "online"\)/);
});

test("agent and skill procedure clients discard stale controls on transport failure", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /workflowState\.state!=="online"\)throw new Error\("Private Workflow-Quelle ist nicht schreibbereit"\)/);
  assert.match(page, /setWorkflowState\(\{state:"error",profiles:\[\],runs:\[\]\}\);setActiveRunId\(""\)/);
  assert.match(page, /Private Workflow-Quelle wird geladen/);
  assert.match(page, /skillState\.state!=="online"\)throw new Error\("Private Skill-Quelle ist nicht schreibbereit"\)/);
  assert.match(page, /setSkillState\(\{state:"error",definitions:\[\],runs:\[\],catalog:\[\]\}\)/);
  assert.match(page, /skillState\.state==="online"&&editing&&<Card className="skillEditor">/);
  assert.match(page, /Private Skill-Quelle wird geladen/);
});

test("planner invalidates stale plans and exact approvals when source certainty is lost", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /setStatus\(\{ state: "loading", connected: false \}\)/);
  assert.match(page, /setCalendars\(\[\]\); setPlan\(null\); setSelectedOutcomes\(\[\]\); setSelectedBlocks\(\[\]\); setHistory\(\[\]\); setApproval\(null\); setConfirmation\(""\)/);
  assert.match(page, /status\.state!=="ready"\)throw new Error\("Private Planner-Quelle ist nicht schreibbereit"\)/);
  assert.match(page, /Write-Ergebnis ist nicht bestätigt\. Kalender vor einem neuen Versuch prüfen\./);
  assert.match(page, /plannerRequest\("\/api\/calendar\/write",[^;]+, true\)/);
  assert.match(page, /catch \(reason\) \{ setApproval\(null\); setConfirmation\(""\);/);
  assert.match(page, /status\.state === "loading" \? "Planner-Quellen werden geprüft"/);
  assert.match(page, /!plan && status\.state === "ready"/);
});

test("vault previews and audit history fail closed across reload and transport loss", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /setVault\(\{ status: "loading" \}\)/);
  assert.match(page, /setAudit\(\{ status: "loading", entries: \[\] \}\)/);
  assert.match(page, /setWriteFlow\(\{state:"loading",proposals:\[\]\}\);setActiveProposalId\(""\);setApprovalToken\(""\);setConfirmation\(""\)/);
  assert.match(page, /writeFlow\.state!=="online"\|\|!connected\)throw new Error\("Private Vault-Vorschauquelle ist nicht schreibbereit"\)/);
  assert.match(page, /invalidateWriteFlow\("Private Vault-Vorschauquelle nicht erreichbar"\)/);
  assert.match(page, /proposalInputValid=connected&&writeFlow\.state==="online"/);
  assert.match(page, /!activeProposal&&writeFlow\.state==="online"/);
  assert.match(page, /audit\.status === "online" && audit\.entries\.map/);
});

test("backup and archive recovery never render unavailable inventory as empty", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /setBackupState\(\{ state: "loading", backups: \[\], store: null \}\)/);
  assert.match(page, /setSelectedBackup\(""\); setRestorePreview\(null\)/);
  assert.match(page, /backupState\.state!=="online"\)throw new Error\("Privates Backup-Inventar ist nicht schreibbereit"\)/);
  assert.match(page, /Backup-Ergebnis nicht bestätigt\. Inventar vor erneutem Versuch prüfen\./);
  assert.match(page, /backupState\.state === "online" \? backupState\.backups\.length : backupState\.state === "loading" \? "Wird geprüft" : "Nicht erreichbar"/);
  assert.match(page, /backupState\.state === "online" && restorePreview/);
  assert.match(page, /archiveState\.state === "online" && archiveState\.records\.map/);
  assert.match(page, /invalidateArchiveSource\(message\)/);
  assert.match(page, /Archivstatus prüfen und nicht erneut bestätigen/);
});

test("integration health clears stale catalogs and exposes real calendar retry states", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /setIntegrationHealth\(\{state:"loading",connectors:\[\]\}\);setSelectedConnectorId\(""\)/);
  assert.match(page, /setCalendarStatus\(\{state:"loading",configured:false,connected:false,mode:"unavailable",catalogState:"loading"\}\);setLiveCalendars\(\[\]\);setSelectedCalendars\(\[\]\)/);
  assert.match(page, /setCalendarStatus\(\{state:"online",\.\.\.statusResult,catalogState,catalogError:/);
  assert.match(page, /Google-Status und Kalenderkatalog sind gerade nicht erreichbar/);
  assert.match(page, /calendarStatus\.catalogState === "online" && !liveCalendars\.length/);
  assert.match(page, /calendarStatus\.catalogState === "unavailable"/);
  assert.match(page, /calendarStatus\.connectionCheck !== "error" && calendarStatus\.configured/);
  assert.match(page, /Begrenzter Kalenderabruf nicht erreichbar/);
  assert.doesNotMatch(page, /TESTADAPTER/);
});

test("knowledge search stays inside the signed metadata-only vault preview", async () => {
  const [page, route] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(new URL("../app/api/obsidian/status/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /verifyLocalSession/);
  assert.match(route, /no-store, private/);
  assert.match(page, /METADATEN-SUCHE · READ-ONLY/);
  assert.match(page, /frontmatterKeys/);
  assert.match(page, /keine Volltextkörper gelesen/);
  assert.doesNotMatch(page, /note\.body/);
});

test("uses real shared life-area records and honest external connection boundaries", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /function AreaRecordWorkspace/);
  assert.match(page, /useSharedRecords\("area_records"\)/);
  assert.match(page, /ECHTE DATENQUELLE · LEER/);
  for (const boundary of ["Keine Health-Verbindung aktiv", "Keine Bank verbunden und niemals Finanztransaktionen", "keine automatische Standortabfrage", "keine externe Bewerbung oder Nachricht"]) {
    assert.match(page, new RegExp(boundary, "i"));
  }
  for (const inventedValue of ["Seite 184", "€ 42.860", "7 h 28", "Mama", "Future business"]) {
    assert.doesNotMatch(page, new RegExp(inventedValue, "i"));
  }
});

test("keeps the iPhone shell safe-area aware and resistant to touch and zoom bugs", async () => {
  const [page, css, layout, companion] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(cssPath, "utf8"),
    readFile(layoutPath, "utf8"),
    readFile(mobileCompanionPath, "utf8"),
  ]);

  assert.match(layout, /viewportFit: "cover"/);
  assert.match(css, /min-height: 100dvh/);
  assert.match(css, /font-size: 16px/);
  assert.match(css, /touch-action: manipulation/);
  assert.match(companion, /bounces=\{false\}/);
  assert.match(companion, /contentInsetAdjustmentBehavior="never"/);
  assert.match(companion, /allowsBackForwardNavigationGestures=\{false\}/);
  assert.match(companion, /isMainDocument/);
  assert.match(companion, /message\?\.type !== "agentic-os-ready"/);
  assert.match(companion, /setTimeout\(\(\) => setFailed\(true\), 12000\)/);
  assert.match(page, /mobileBridge\?\.postMessage/);
});

test("allows only the detected private LAN host for Next development assets", async () => {
  const [nextConfig, helper] = await Promise.all([
    readFile(nextConfigPath, "utf8"),
    readFile(iphoneHelperPath, "utf8"),
  ]);

  assert.match(nextConfig, /process\.env\.AGENTIC_OS_LAN_HOST/);
  assert.match(nextConfig, /allowedDevOrigins/);
  assert.match(helper, /\$env:AGENTIC_OS_LAN_HOST = \$lanAddress/);
});

test("keeps Tailscale access private, dynamic, and Funnel-free", async () => {
  const [privateHelper, iphoneHelper] = await Promise.all([
    readFile(privateHelperPath, "utf8"),
    readFile(tailscaleIphoneHelperPath, "utf8"),
  ]);

  assert.match(privateHelper, /http:\/\/127\.0\.0\.1:3211/);
  assert.match(privateHelper, /serve --bg --yes \$localUrl/);
  assert.match(privateHelper, /auth-secret/);
  assert.match(privateHelper, /\.next-private/);
  assert.match(privateHelper, /\[switch\]\$Refresh/);
  assert.match(privateHelper, /RandomNumberGenerator/);
  assert.match(privateHelper, /\$env:AUTH_SECRET/);
  assert.match(privateHelper, /\$env:APP_URL = \$privateUrl/);
  assert.doesNotMatch(privateHelper, /& \$tailscale funnel/);
  assert.match(iphoneHelper, /\$status\.TailscaleIPs/);
  assert.match(iphoneHelper, /\$env:REACT_NATIVE_PACKAGER_HOSTNAME = \$tailscaleIp/);
  assert.match(iphoneHelper, /\$privateUrl = "https:\/\/\$\{dnsName\}"/);
  assert.match(iphoneHelper, /Test-InteractivePrivateOrigin/);
  assert.match(iphoneHelper, /Headers @\{ Origin = \$Url \}/);
  assert.match(iphoneHelper, /AGENTIC_OS_PRIVATE_HOST = \$dnsName/);
});
