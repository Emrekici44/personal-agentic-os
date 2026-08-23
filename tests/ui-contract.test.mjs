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
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /--bg: #030812/);
  assert.match(css, /--cyan: #2ad7ff/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.mobileNav/);
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
});

test("keeps the iPhone shell safe-area aware and resistant to touch and zoom bugs", async () => {
  const [css, layout, companion] = await Promise.all([
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
});
