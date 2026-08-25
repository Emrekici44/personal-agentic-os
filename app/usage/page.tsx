"use client";

import { ShieldCheck, ExternalLink, Server, HardDrive, Cloud, Database, TriangleAlert, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { runtimeHealthTransition, type RuntimeSourceState } from "@/lib/runtime-recovery";
import { privateApiFetch } from "@/lib/private-client";

const label: Record<string, string> = { online: "Online", degraded: "Eingeschränkt", offline: "Offline", unconfigured: "Nicht konfiguriert" };
const costLabel: Record<string, string> = { Free: "Kostenfrei", "Free*": "Kostenfrei*", Included: "Enthalten", "Usage-based": "Nutzungsbasiert", Unknown: "Ungeklärt" };
const berlinDateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Berlin" });
const berlinTime = new Intl.DateTimeFormat("de-DE", { timeStyle: "medium", timeZone: "Europe/Berlin" });

export default function Usage() {
  const [state, setState] = useState<any>({ loading: true, error: false, openai: null, integrations: [], storage: null, backups: [], checkedAt: null });
  const runtimeStateRef = useRef<RuntimeSourceState>("checking");
  const refresh = useCallback(async () => {
    setState({ loading: true, error: false, openai: null, integrations: [], storage: null, backups: [], checkedAt: null });
    try {
      const sessionResponse = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!sessionResponse.ok) throw new Error();
      const [openaiResponse, integrationResponse, backupResponse] = await Promise.all([
        privateApiFetch("/api/openai/status", { cache: "no-store" }),
        privateApiFetch("/api/integrations/health", { cache: "no-store" }),
        privateApiFetch("/api/state/backups", { cache: "no-store" }),
      ]);
      if (!openaiResponse.ok || !integrationResponse.ok || !backupResponse.ok) throw new Error();
      const [openai, integrations, backups] = await Promise.all([openaiResponse.json(), integrationResponse.json(), backupResponse.json()]);
      runtimeStateRef.current = "online";
      setState({ loading: false, error: false, openai, integrations: integrations.connectors || [], storage: backups.store, backups: backups.backups || [], checkedAt: integrations.checkedAt });
    } catch {
      runtimeStateRef.current = "offline";
      setState({ loading: false, error: true, openai: null, integrations: [], storage: null, backups: [], checkedAt: null });
    }
  }, []);
  const checkRuntime = useCallback(async () => {
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      const response = await privateApiFetch("/api/state/status", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      const transition = runtimeHealthTransition(runtimeStateRef.current, result.online ? "online" : "offline");
      runtimeStateRef.current = transition.state;
      if (transition.state === "offline") setState({ loading: false, error: true, openai: null, integrations: [], storage: null, backups: [], checkedAt: null });
      if (transition.recovered) await refresh();
    } catch {
      runtimeStateRef.current = "offline";
      setState({ loading: false, error: true, openai: null, integrations: [], storage: null, backups: [], checkedAt: null });
    }
  }, [refresh]);
  useEffect(() => {
    void refresh();
    const interval = window.setInterval(checkRuntime, 30_000);
    const recheck = () => void checkRuntime();
    window.addEventListener("online", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [checkRuntime, refresh]);
  const verified = !state.loading && !state.error;
  const connection = (id: string) => state.integrations.find((item: any) => item.id === id);
  const calendar = connection("google-calendar");
  const lastBackup = state.backups?.[0];
  const statusRows = [
    { Icon: Cloud, name: "ChatGPT Subscription", cost: "Enthalten", detail: "Kein unterstützter präziser Plan-Zähler", status: "Manuell / nicht verfügbar" },
    { Icon: Server, name: "OpenAI API", cost: "Nutzungsbasiert", detail: state.loading ? "Status wird geprüft" : state.error ? "Private Statusquelle nicht erreichbar" : state.openai?.configured ? `Kill Switch ${state.openai.killSwitch ? "aktiv" : "inaktiv"}` : "Kein Server-Key konfiguriert", status: state.loading ? "Prüft" : state.error ? "Nicht erreichbar" : state.openai?.configured ? "Konfiguriert" : "Nicht konfiguriert" },
    { Icon: HardDrive, name: "Lokales Modell", cost: "Kostenfrei*", detail: "Keine kompatible Runtime verifiziert", status: "Nicht konfiguriert" },
    { Icon: Database, name: "Agentic OS Storage", cost: "Kostenfrei", detail: state.loading ? "Status wird geprüft" : state.error ? "Private Statusquelle nicht erreichbar" : state.storage ? `${state.storage.engine} · Schema v${state.storage.schemaVersion} · WAL` : "Status nicht verfügbar", status: state.loading ? "Prüft" : state.error ? "Nicht erreichbar" : state.storage?.online ? "Online" : "Nicht geprüft" },
    { Icon: ShieldCheck, name: "Google Calendar", cost: costLabel[verified ? calendar?.costClass || "Unknown" : "Unknown"] || "Ungeklärt", detail: state.loading ? "Berechtigungen werden geprüft" : state.error ? "Verbindungsstatus nicht erreichbar" : Array.isArray(calendar?.permissionScope) ? calendar.permissionScope.join(" · ") : "Berechtigungen nicht geprüft", status: state.loading ? "Prüft" : state.error ? "Nicht erreichbar" : label[calendar?.status] || "Nicht geprüft" },
    { Icon: TriangleAlert, name: "Integrationsquoten", cost: "Ungeklärt", detail: "Nur zeigen, wenn ein Anbieter sie verlässlich meldet", status: "Manuell / nicht verfügbar" },
  ];
  return (
    <main className="usagePage">
      <div className="usageTopline">
        <Link href="/#settings">← Einstellungen</Link>
        <button onClick={refresh} disabled={state.loading} type="button"><RefreshCw /> {state.loading ? "Prüft" : "Live-Status prüfen"}</button>
      </div>
      <header>
        <span>KOSTENKONTROLLE · LOKALER STANDARD</span>
        <h1>Usage & Limits</h1>
        <p>Freie lokale Nutzung ist der Standard. Mögliche Gebühren werden vor jeder Aktivierung erklärt und benötigen deine ausdrückliche Freigabe.</p>
        {state.error && <small className="usageError">Live-Status derzeit nicht vollständig erreichbar. Es werden keine Werte erfunden.</small>}
      </header>
      <section className="modeGrid">
        <article>
          <b>1 · Subscription Companion</b><em>Enthalten</em>
          <h2>ChatGPT Pro & Codex</h2>
          <p>Agentic OS organisiert Projekte, Aufgaben, Wissen und Übergaben. Deine Subscription wird nicht als API-Zugang ausgegeben.</p>
          <dl><dt>Präzise Limits</dt><dd>Nicht über unterstützte API verfügbar</dd><dt>Status</dt><dd>Manuell / unbekannt</dd></dl>
          <a href="https://chatgpt.com/" rel="noreferrer" target="_blank">Offizielle Kontoansicht <ExternalLink /></a>
        </article>
        <article>
          <b>2 · OpenAI API</b><em className="usage">Nutzungsbasiert</em>
          <h2>Responses API</h2>
          <p>Optional, serverseitig und unabhängig von Pro abrechenbar. Ohne positiven Grenzwert und deaktivierten Kill Switch geht keine Anfrage hinaus.</p>
          <label><input type="checkbox" checked={verified && Boolean(state.openai?.killSwitch)} readOnly disabled /> HARD KILL SWITCH {verified ? state.openai?.killSwitch === false ? "INAKTIV" : "AKTIV" : "NICHT VERIFIZIERT"}</label>
          <dl><dt>Tagesschwelle</dt><dd>{verified ? `€ ${Number(state.openai?.dailyLimit || 0).toFixed(2)}` : "—"}</dd><dt>Monatsschwelle</dt><dd>{verified ? `€ ${Number(state.openai?.monthlyLimit || 0).toFixed(2)}` : "—"}</dd><dt>Nutzungsquelle</dt><dd>{verified && state.openai?.usageSource === "unavailable" ? "Nicht verfügbar" : verified ? "Nicht geprüft" : "Nicht verifiziert"}</dd></dl>
        </article>
        <article>
          <b>3 · Lokales Modell</b><em>Kostenfrei*</em>
          <h2>Lokaler Provider</h2>
          <p>Keine Kosten pro Anfrage, aber erst nach separater Runtime- und Hardwareprüfung. Es ist aktuell kein Modell verbunden.</p>
          <dl><dt>RAM / GPU</dt><dd>Nicht verifiziert</dd><dt>Status</dt><dd>Nicht konfiguriert</dd></dl>
        </article>
      </section>
      <h2 className="sectionTitle">Verifizierter System- und Quotenstatus</h2>
      <section className="limitGrid">
        {statusRows.map(({ Icon, name, cost, detail, status }) => (
          <article key={name}><Icon /><span><b>{name}</b><em>{cost}</em></span><p>{detail}</p><small>{status}</small></article>
        ))}
      </section>
      <section className="usageEvidence">
        <article><b>Lokale Backups</b><strong>{verified ? state.backups.length : "—"}</strong><small>{!verified ? state.loading ? "Inventar wird geprüft" : "Inventar nicht erreichbar" : lastBackup ? `Zuletzt ${berlinDateTime.format(new Date(lastBackup.createdAt))}` : "Noch keines erstellt"}</small></article>
        <article><b>Speicherschutz</b><strong>{verified ? state.storage?.sensitiveFieldEncryption || "Nicht geprüft" : "—"}</strong><small>Feldverschlüsselung; keine Behauptung über Festplattenverschlüsselung</small></article>
        <article><b>Letzte Live-Prüfung</b><strong>{state.checkedAt ? berlinTime.format(new Date(state.checkedAt)) : "—"}</strong><small>Europe/Berlin · nur nicht sensible Health-Evidenz</small></article>
      </section>
      <aside><ShieldCheck /><p><b>Kostenschutz:</b> Keine bezahlte API wird still aktiviert. Ein späterer API-Modus benötigt sichtbare Preisart, Tages-/Monatsgrenzen, Warnschwelle und ausdrückliche Freigabe.</p></aside>
    </main>
  );
}
