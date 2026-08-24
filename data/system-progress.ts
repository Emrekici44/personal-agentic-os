export type ProgressStatus = "active" | "complete" | "pending" | "user_action";

export type ProgressItem = {
  evidence: string;
  href?: `#${string}`;
  id: string;
  label: string;
  status: ProgressStatus;
};

export const systemProgress = {
  currentPhase: "Wahrheit & gemeinsamer Datenkern",
  lastVerifiedAt: "24.08.2026 · Europe/Berlin",
  items: [
    {
      id: "foundation",
      label: "Web-, Desktop- und Mobile-Fundament",
      evidence: "Build, Electron und Expo verifiziert",
      href: "#home",
      status: "complete",
    },
    {
      id: "iphone",
      label: "Physischer iPhone-Test und Navigation",
      evidence: "Von Emre auf dem Gerät bestätigt",
      href: "#home",
      status: "complete",
    },
    {
      id: "private-access",
      label: "Privater Tailscale-Zugang",
      evidence: "HTTPS · tailnet-only · kein Funnel",
      href: "#integrations",
      status: "complete",
    },
    {
      id: "github-foundation",
      label: "Privates GitHub-Repository",
      evidence: "Private · main · Fundament gepusht",
      href: "#settings",
      status: "complete",
    },
    {
      id: "vault-index",
      label: "Emre Vault · Read-only Index",
      evidence: "27 Markdown · 37 Links · 34 Beziehungen · 0 Writes",
      href: "#brain",
      status: "complete",
    },
    {
      id: "vault-health",
      label: "Vault-Health und Sicherheitsprüfungen",
      evidence: "Wissen + Integrationszentrum · 18/18 Tests",
      href: "#integrations",
      status: "complete",
    },
    {
      id: "data-push",
      label: "Datenphase dokumentieren und privat pushen",
      evidence: "Secret-/Inhaltsaudit · privates main aktualisiert",
      href: "#settings",
      status: "complete",
    },
    {
      id: "google-oauth",
      label: "Google Calendar · Lesen + kontrollierte Events",
      evidence: "Online · Calendar list read + event scope verifiziert",
      href: "#integrations",
      status: "complete",
    },
    {
      id: "google-first-event",
      label: "Erster kontrollierter Testtermin",
      evidence: "Einzeln freigegeben, geschrieben, zurückgelesen und auditiert",
      href: "#integrations",
      status: "complete",
    },
    {
      id: "shared-crud",
      label: "Gemeinsame echte Daten für Kernbereiche",
      evidence: "Projekte, Aufgaben, Inbox, Agenten, Skills und Journal-Metadaten",
      href: "#projects",
      status: "active",
    },
    {
      id: "server-evaluation",
      label: "Laptop-unabhängige PostgreSQL-Architektur prüfen",
      evidence: "Kosten, Datenschutz, Backups, Offline und Exit vergleichen",
      href: "#settings",
      status: "pending",
    },
  ] as ProgressItem[],
};
