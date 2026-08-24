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

  assert.match(page, /Guten Abend, Emre\./);
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
  assert.match(page, /function MobileNav/);
  assert.match(
    page,
    /function MobileNav[\s\S]*?<button[\s\S]*?onClick=\{\(\) => go\(id\)\}[\s\S]*?type="button"/,
    "mobile navigation uses real touch buttons instead of WebView-intercepted anchors",
  );
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("gives every mobile destination and drawer control real navigation semantics", async () => {
  const page = await readFile(pagePath, "utf8");

  for (const destination of ["home", "areas", "inbox", "habits", "agents"]) {
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
  assert.match(page, /aria-label=\{theme === "dark" \? "Light Mode aktivieren"/);
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
  assert.match(companion, /setTimeout\(\(\) => setFailed\(true\), 8000\)/);
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
  assert.doesNotMatch(privateHelper, /& \$tailscale funnel/);
  assert.match(iphoneHelper, /\$status\.TailscaleIPs/);
  assert.match(iphoneHelper, /\$env:REACT_NATIVE_PACKAGER_HOSTNAME = \$tailscaleIp/);
  assert.match(iphoneHelper, /\$privateUrl = "https:\/\/\$\{dnsName\}"/);
  assert.match(iphoneHelper, /Test-InteractivePrivateOrigin/);
  assert.match(iphoneHelper, /Headers @\{ Origin = \$Url \}/);
  assert.match(iphoneHelper, /AGENTIC_OS_PRIVATE_HOST = \$dnsName/);
});
