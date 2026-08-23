import {
  ShieldCheck,
  ExternalLink,
  Server,
  HardDrive,
  Cloud,
  Database,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
export default function Usage() {
  return (
    <main className="usagePage">
      <Link href="/">← Agentic OS</Link>
      <header>
        <span>ZERO-COST MODE · STANDARD</span>
        <h1>Usage & Limits</h1>
        <p>
          Jede Kostenquelle bleibt getrennt, sichtbar und standardmäßig
          ausgeschaltet.
        </p>
      </header>
      <section className="modeGrid">
        <article>
          <b>1 · Subscription companion</b>
          <em>Included</em>
          <h2>ChatGPT Pro & Codex</h2>
          <p>
            Agentic OS organisiert Links, Chats und Übergaben. Es behauptet
            keinen direkten Modellzugriff.
          </p>
          <dl>
            <dt>Präzise Limits</dt>
            <dd>Nicht über unterstützte API verfügbar</dd>
            <dt>Status</dt>
            <dd>Manuell / unbekannt</dd>
          </dl>
          <a href="https://chatgpt.com/" rel="noreferrer" target="_blank">
            Offizielle Kontoansicht <ExternalLink />
          </a>
        </article>
        <article>
          <b>2 · OpenAI API</b>
          <em className="usage">Usage-based</em>
          <h2>Responses API</h2>
          <p>
            Optional und deaktiviert. Ein eigener API-Key wäre separat von Pro
            abrechenbar.
          </p>
          <label>
            <input type="checkbox" defaultChecked disabled /> HARD KILL SWITCH
            AKTIV
          </label>
          <dl>
            <dt>Tagesschwelle</dt>
            <dd>€ 0,00</dd>
            <dt>Monatsschwelle</dt>
            <dd>€ 0,00</dd>
            <dt>Verifizierte Nutzung</dt>
            <dd>Nicht konfiguriert</dd>
          </dl>
        </article>
        <article>
          <b>3 · Local model</b>
          <em>Free*</em>
          <h2>Lokaler Provider</h2>
          <p>
            Null Kosten pro Anfrage, aber erst nach geprüfter
            Windows-ARM-Runtime und Hardwareeignung.
          </p>
          <dl>
            <dt>RAM / GPU</dt>
            <dd>Nicht verifiziert</dd>
            <dt>Status</dt>
            <dd>Unkonfiguriert</dd>
          </dl>
        </article>
      </section>
      <h2 className="sectionTitle">System- und Quotenstatus</h2>
      <section className="limitGrid">
        {[
          [
            Cloud,
            "ChatGPT Subscription",
            "Included",
            "Limits nicht maschinenlesbar",
            "Manuell",
          ],
          [
            Server,
            "OpenAI API",
            "Usage-based",
            "€ 0,00 · Kill Switch",
            "Unkonfiguriert",
          ],
          [
            HardDrive,
            "Local model",
            "Free*",
            "Keine Runtime erkannt",
            "Offline",
          ],
          [
            Database,
            "Agentic OS Storage",
            "Free",
            "Browser lokal · Backup empfohlen",
            "Online",
          ],
          [
            ShieldCheck,
            "Google Calendar",
            "Free",
            "8-Tage-Lesefenster",
            "Mock",
          ],
          [
            TriangleAlert,
            "Integration quotas",
            "Unknown",
            "Erst nach echter Verbindung",
            "Unverifiziert",
          ],
        ].map(([Icon, n, c, d, s]: any) => (
          <article key={n}>
            <Icon />
            <span>
              <b>{n}</b>
              <em>{c}</em>
            </span>
            <p>{d}</p>
            <small>{s}</small>
          </article>
        ))}
      </section>
      <aside>
        <ShieldCheck />
        <p>
          <b>Kostenschutz:</b> Agentic OS sendet im lokalen Standardmodus keine
          bezahlte API-Anfrage. Aktivierung erfordert sichtbare Preise, Tages-
          und Monatsgrenzen, Warnschwelle und ausdrückliche Freigabe.
        </p>
      </aside>
    </main>
  );
}
