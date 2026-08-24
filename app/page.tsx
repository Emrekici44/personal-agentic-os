"use client";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import * as I from "lucide-react";
import { systemProgress } from "@/data/system-progress";
type View =
  | "home"
  | "agents"
  | "skills"
  | "areas"
  | "journal"
  | "habits"
  | "finance"
  | "health"
  | "relations"
  | "faith"
  | "career"
  | "projects"
  | "inbox"
  | "chat"
  | "integrations"
  | "brain"
  | "settings";
const areas = [
  ["faith", "Glaube", "#a887d4", "5 Gebete · Qurʾān S. 184", I.MoonStar],
  [
    "career",
    "Karriere",
    "#df9a52",
    "2 Wege · 3 Meilensteine",
    I.BriefcaseBusiness,
  ],
  [
    "health",
    "Gesundheit",
    "#5fae8d",
    "3 Trainings · Erholung gut",
    I.HeartPulse,
  ],
  [
    "finance",
    "Finanzen",
    "#6098c8",
    "Budget 68% · Sparziel 42%",
    I.WalletCards,
  ],
  [
    "relations",
    "Beziehungen",
    "#dc7f91",
    "2 Kontakte · 1 Geburtstag",
    I.UsersRound,
  ],
  ["projects", "Projekte", "#d1a33c", "4 aktiv · 6 geparkt", I.LayoutGrid],
] as const;
const agents = [
  [
    "Wochenplaner",
    "Plant drei Outcomes mit 35% Puffer",
    ["Karriere", "Gesundheit"],
    "gpt-5.4",
    "online",
  ],
  [
    "Projekt-Coach",
    "Hält Ziele und nächste Schritte klar",
    ["Projekte"],
    "gpt-5.4",
    "busy",
  ],
  [
    "Glaube & Reflexion",
    "Begleitet Routinen und Reflexion",
    ["Glaube"],
    "gpt-5.4-mini",
    "online",
  ],
  [
    "Health Planner",
    "Ordnet Training, Essen und Erholung",
    ["Gesundheit"],
    "gpt-5.4-mini",
    "online",
  ],
  [
    "Finanz-Überblick",
    "Liest und strukturiert, handelt nie",
    ["Finanzen"],
    "gpt-5.4",
    "unconfigured",
  ],
  [
    "Beziehungspflege",
    "Hilft Zusagen und Menschen zu erinnern",
    ["Beziehungen"],
    "gpt-5.4-mini",
    "online",
  ],
];
const skills = [
  ["Wochenreset", "Planung", "Wochenplaner", "Bereit"],
  ["Deep-Work-Schutz", "Energie", "Wochenplaner", "Bereit"],
  ["Projekt-Dekomposition", "Projekte", "Projekt-Coach", "Bereit"],
  ["Tagesreflexion", "Glaube", "Glaube & Reflexion", "Bereit"],
  ["Trainingswoche", "Gesundheit", "Health Planner", "Bereit"],
  ["Budget-Review", "Finanzen", "Finanz-Überblick", "Konfiguration"],
  ["Kontakt-Impuls", "Beziehungen", "Beziehungspflege", "Bereit"],
  ["Vault-Import", "Wissen", "—", "Read-only"],
];
const nav: any[] = [
  ["home", "Kommando", I.Gauge],
  ["inbox", "Inbox", I.Inbox],
  ["areas", "Lebensbereiche", I.Orbit],
  ["journal", "Journal", I.NotebookPen],
  ["habits", "Habits & Aufgaben", I.ListChecks],
  ["projects", "Projekte", I.PanelsTopLeft],
  ["agents", "Agenten", I.Bot],
  ["skills", "Skills", I.Sparkles],
  ["chat", "Chats & Modelle", I.MessagesSquare],
  ["brain", "Wissen", I.Network],
  ["integrations", "Verbindungen", I.PlugZap],
  ["settings", "Einstellungen", I.Settings2],
];
const viewIds = new Set<View>([
  ...nav.map(([id]) => id as View),
  ...areas.map(([id]) => id as View),
]);
const isView = (candidate: unknown): candidate is View =>
  typeof candidate === "string" && viewIds.has(candidate as View);
const store = {
  get: (k: string, d: any) => {
    if (typeof window === "undefined") return d;
    try {
      const current = localStorage.getItem("aos:" + k);
      const legacy = localStorage.getItem("ns:" + k);
      return JSON.parse(current || legacy || "null") ?? d;
    } catch {
      return d;
    }
  },
  set: (k: string, v: any) =>
    localStorage.setItem("aos:" + k, JSON.stringify(v)),
};
export default function App() {
  const [v, setV] = useState<View>("home"),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState(""),
    [tasks, setTasks] = useState<any[]>([]),
    [journal, setJournal] = useState(""),
    [mood, setMood] = useState("ruhig"),
    [vaultOnline, setVaultOnline] = useState(false),
    [brand, setBrand] = useState({
      name: "Agentic OS",
      short: "AOS",
      accent: "#27d3ff",
    });
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setTasks(
      store.get("tasks", [
        { id: 1, t: "Wochenplan bestätigen", area: "Projekte", done: false },
        { id: 2, t: "Qurʾān: 4 Seiten lesen", area: "Glaube", done: true },
        { id: 3, t: "Mama anrufen", area: "Beziehungen", done: false },
      ]),
    );
    setJournal(store.get("journal", ""));
    const savedBrand = store.get("brand", {
      name: "Agentic OS",
      short: "AOS",
      accent: "#27d3ff",
    });
    const migratedBrand = {
      ...savedBrand,
      accent:
        savedBrand.accent === "#6f8d78" ? "#27d3ff" : savedBrand.accent,
    };
    setBrand(migratedBrand);
    store.set("brand", migratedBrand);
    fetch("/api/obsidian/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((status) => setVaultOnline(status.status === "online"))
      .catch(() => setVaultOnline(false));
  }, []);
  const saveTasks = (x: any[]) => {
    setTasks(x);
    store.set("tasks", x);
  };
  const note = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2400);
  };
  const showView = useCallback((next: View) => {
    if (!viewIds.has(next)) return;
    setV(next);
    setMenu(false);
    requestAnimationFrame(() => {
      window.scrollTo({ behavior: "auto", left: 0, top: 0 });
      contentRef.current?.focus({ preventScroll: true });
    });
  }, []);
  const navigate = useCallback(
    (next: View) => {
      const nextHash = `#${next}`;
      if (window.location.hash !== nextHash) {
        window.history.pushState({ view: next }, "", nextHash);
      }
      showView(next);
    },
    [showView],
  );
  useEffect(() => {
    const syncFromHistory = () => {
      const fromState = window.history.state?.view;
      const fromHash = window.location.hash.slice(1);
      const next = isView(fromHash) ? fromHash : fromState;
      showView(isView(next) ? next : "home");
    };

    if (!window.history.state?.view) {
      const initialHash = window.location.hash.slice(1);
      const initialView = isView(initialHash) ? initialHash : "home";
      window.history.replaceState(
        { view: initialView },
        "",
        `#${initialView}`,
      );
    }
    syncFromHistory();
    window.addEventListener("hashchange", syncFromHistory);
    window.addEventListener("popstate", syncFromHistory);
    return () => {
      window.removeEventListener("hashchange", syncFromHistory);
      window.removeEventListener("popstate", syncFromHistory);
    };
  }, [showView]);
  useEffect(() => {
    if (!menu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menu]);
  const title = nav.find((n) => n[0] === v)?.[1] || brand.name;
  return (
    <div className="os">
      <aside
        aria-label="Hauptnavigation"
        className={menu ? "open" : ""}
        id="primary-navigation"
      >
        <div className="logo">
          <b style={{ background: brand.accent }}>{brand.short.slice(0, 3)}</b>
          <span>
            {brand.name}
            <small>life operating system</small>
          </span>
          <button aria-label="Menü schließen" onClick={() => setMenu(false)}>
            <I.X />
          </button>
        </div>
        <nav>
          {nav.map(([id, n, Icon]) => (
            <a
              aria-current={v === id ? "page" : undefined}
              className={v === id ? "active" : ""}
              href={`#${id}`}
              onClick={(event) => {
                event.preventDefault();
                navigate(id);
              }}
              key={id}
            >
              <Icon />
              {n}
              {id === "inbox" && <em>4</em>}
            </a>
          ))}
        </nav>
        <div className="privacy">
          <I.ShieldCheck />
          <span>
            <b>Lokal geschützt</b>
            <small>Keine Konten verbunden</small>
          </span>
        </div>
      </aside>
      <main>
        <header>
          <button
            aria-controls="primary-navigation"
            aria-expanded={menu}
            aria-label="Hauptmenü öffnen"
            className="hamb"
            onClick={() => setMenu((current) => !current)}
          >
            <I.Menu />
          </button>
          <div>
            <small>SONNTAG · 23. AUGUST</small>
            <h1>{title}</h1>
          </div>
          <button
            aria-label="Wissen durchsuchen"
            className="search"
            onClick={() => navigate("brain")}
          >
            <I.Search />
            Suchen
          </button>
          <span className="avatar">E</span>
        </header>
        <section
          aria-label={title}
          className="content"
          ref={contentRef}
          tabIndex={-1}
        >
          {v === "home" && <Home go={navigate} tasks={tasks} vaultOnline={vaultOnline} />}{" "}
          {v === "areas" && <Areas go={navigate} />} {v === "faith" && <Faith note={note} />}
          {v === "career" && <Career />}
          {v === "finance" && <Finance />}
          {v === "health" && <Health />}
          {v === "relations" && <Relations />}
          {v === "projects" && <Projects note={note} />}
          {v === "habits" && <Habits tasks={tasks} save={saveTasks} />}{" "}
          {v === "journal" && (
            <Journal
              text={journal}
              setText={(x: string) => {
                setJournal(x);
                store.set("journal", x);
              }}
              mood={mood}
              setMood={setMood}
              note={note}
            />
          )}{" "}
          {v === "agents" && <Agents note={note} />}{" "}
          {v === "skills" && <Skills />}
          {v === "chat" && <Chats note={note} />}{" "}
          {v === "inbox" && <Inbox note={note} />}{" "}
          {v === "integrations" && <Integrations note={note} />}{" "}
          {v === "brain" && <Brain />}
          {v === "settings" && (
            <Settings
              brand={brand}
              save={(x: any) => {
                setBrand(x);
                store.set("brand", x);
                note("Branding lokal gespeichert");
              }}
            />
          )}
        </section>
      </main>
      {menu && (
        <button
          aria-label="Menü schließen"
          className="shade"
          onClick={() => setMenu(false)}
        />
      )}{" "}
      {toast && (
        <div className="toast">
          <I.CheckCircle2 />
          {toast}
        </div>
      )}
      <MobileNav v={v} go={navigate} />
    </div>
  );
}
const Tag = ({ children }: any) => <span className="tag">{children}</span>;
const Card = ({ children, className = "" }: any) => (
  <div className={"card " + className}>{children}</div>
);
const Btn = ({ children, onClick, soft = false }: any) => (
  <button
    aria-disabled={!onClick}
    className={soft ? "btn soft" : "btn"}
    disabled={!onClick}
    onClick={onClick}
  >
    {children}
  </button>
);
function Intro({ eyebrow, title, children, action }: any) {
  return (
    <div className="intro">
      <div>
        <Tag>{eyebrow}</Tag>
        <h2>{title}</h2>
        {children}
      </div>
      {action}
    </div>
  );
}
function Home({ go, tasks, vaultOnline }: any) {
  return (
    <>
      <Intro eyebrow="DEIN SYSTEM AUF EINEN BLICK" title="Guten Abend, Emre.">
        <p>Was braucht heute wirklich deine Aufmerksamkeit?</p>
      </Intro>
      <div className="focusrow">
        <Card className="now">
          <div className="row">
            <Tag>HEUTIGER FOKUS</Tag>
            <span className="pulse">Ruhiger Fokus</span>
          </div>
          <h3>Wochenplanung bewusst abschließen</h3>
          <p>Drei Ergebnisse, geschützte Erholung und 36% freie Kapazität.</p>
          <div className="steps">
            <span className="done">
              <I.Check />
              Kalender gelesen
            </span>
            <span className="done">
              <I.Check />
              Prioritäten gewählt
            </span>
            <span>Freigabe ausstehend</span>
          </div>
          <Btn onClick={() => go("integrations")}>
            Plan prüfen <I.ArrowRight />
          </Btn>
        </Card>
        <Card className="day">
          <Tag>HEUTE</Tag>
          {[
            ["11:00", "Wochenplanung", "focus"],
            ["17:30", "Training", "health"],
            ["20:30", "Reflexion", "faith"],
          ].map((x) => (
            <div className="event" key={x[0]}>
              <time>{x[0]}</time>
              <i className={x[2]} />
              <span>
                <b>{x[1]}</b>
                <small>
                  {x[2] === "health" ? "Danach kein Deep Work" : "Geschützt"}
                </small>
              </span>
            </div>
          ))}
        </Card>
      </div>
      <SystemProgress go={go} />
      <div className="sectionhead">
        <h3>Lebensbereiche</h3>
        <button onClick={() => go("areas")}>
          Alle öffnen <I.ArrowRight />
        </button>
      </div>
      <div className="area-strip">
        {areas.map(([id, n, c, s, Icon]) => (
          <button
            style={{ "--c": c } as any}
            onClick={() => go(id as View)}
            key={id}
          >
            <span>
              <Icon />
            </span>
            <b>{n}</b>
            <small>{s}</small>
            <i>
              <em
                style={{
                  width:
                    id === "career" ? "72%" : id === "finance" ? "58%" : "81%",
                }}
              />
            </i>
          </button>
        ))}
      </div>
      <div className="homegrid">
        <Card>
          <div className="row">
            <Tag>PRIORITÄTEN</Tag>
            <b>{tasks.filter((x: any) => !x.done).length} offen</b>
          </div>
          {tasks.slice(0, 3).map((t: any) => (
            <div className="miniTask" key={t.id}>
              <i className={t.done ? "checked" : ""}>{t.done && <I.Check />}</i>
              <span>
                {t.t}
                <small>{t.area}</small>
              </span>
            </div>
          ))}
        </Card>
        <Card>
          <Tag>SYSTEMSTATUS</Tag>
          {[
            ["Wochenplaner", "online"],
            ["Google Calendar", "unconfigured"],
            ["OpenAI", "unconfigured"],
            ["Obsidian", vaultOnline ? "online" : "unconfigured"],
          ].map((x) => (
            <div className="statusline" key={x[0]}>
              <i className={x[1]} />
              {x[0]}
              <small>{x[1]}</small>
            </div>
          ))}
        </Card>
        <Card className="capacity">
          <Tag>WOCHENKAPAZITÄT</Tag>
          <div className="donut">
            <b>64%</b>
            <span>geplant</span>
          </div>
          <p>36% bleiben als Puffer geschützt.</p>
        </Card>
      </div>
    </>
  );
}
function SystemProgress({ go }: any) {
  const completeCount = systemProgress.items.filter(
    (item) => item.status === "complete",
  ).length;
  const activeItem = systemProgress.items.find((item) => item.status === "active");
  const userAction = systemProgress.items.find(
    (item) => item.status === "user_action",
  );

  const openProgressLink = (event: MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (!href) return;
    event.preventDefault();
    go(href.slice(1));
  };

  return (
    <section aria-labelledby="system-progress-title" className="card systemProgress">
      <div className="progressHead">
        <div>
          <Tag>SYSTEMAUFBAU · FORTSCHRITT</Tag>
          <h3 id="system-progress-title">{systemProgress.currentPhase}</h3>
          <p aria-live="polite" role="status">
            {activeItem ? `Aktiv: ${activeItem.label}` : "Kein interner Schritt aktiv"}
          </p>
        </div>
        <span className="progressCount">
          <b>{completeCount} von {systemProgress.items.length}</b>
          Schritte abgeschlossen
        </span>
      </div>
      <ol className="progressChecklist">
        {systemProgress.items.map((item) => (
          <li className={item.status} key={item.id}>
            <i aria-hidden="true">
              {item.status === "complete" ? (
                <I.Check />
              ) : item.status === "active" ? (
                <I.LoaderCircle />
              ) : item.status === "user_action" ? (
                <I.UserRoundCheck />
              ) : (
                <I.Circle />
              )}
            </i>
            <span>
              <b>{item.label}</b>
              <small>{item.evidence}</small>
            </span>
            {item.href && (
              <a
                aria-label={`${item.label} öffnen`}
                href={item.href}
                onClick={(event) => openProgressLink(event, item.href)}
              >
                Öffnen <I.ChevronRight />
              </a>
            )}
          </li>
        ))}
      </ol>
      <footer>
        <span>
          <I.Clock3 /> Zuletzt verifiziert: {systemProgress.lastVerifiedAt}
        </span>
        {userAction && (
          <a
            href={userAction.href}
            onClick={(event) => openProgressLink(event, userAction.href)}
          >
            <I.TriangleAlert /> Wartet auf dich: {userAction.label}
          </a>
        )}
      </footer>
    </section>
  );
}
function Areas({ go }: any) {
  return (
    <>
      <Intro
        eyebrow="SECHS BEREICHE · EIN LEBEN"
        title="Dein Leben in Balance."
      >
        <p>
          Jeder Bereich hat seine eigene Sprache, Farbe und Aufmerksamkeit –
          verbunden durch ein System.
        </p>
      </Intro>
      <div className="area-grid">
        {areas.map(([id, n, c, s, Icon], i) => (
          <Card className="areaHero" key={id}>
            <div style={{ "--c": c } as any} className="areaIcon">
              <Icon />
            </div>
            <Tag>
              {
                [
                  "SPIRITUELL",
                  "WIRKUNG",
                  "ENERGIE",
                  "SICHERHEIT",
                  "VERBINDUNG",
                  "GESTALTUNG",
                ][i]
              }
            </Tag>
            <h3>{n}</h3>
            <p>{s}</p>
            <div className="metric">
              <b>{[82, 72, 78, 68, 75, 64][i]}%</b>
              <span>stabil</span>
            </div>
            <button onClick={() => go(id as View)}>
              Dashboard öffnen <I.ArrowRight />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
function Faith({ note }: any) {
  return (
    <div className="domain faithDomain">
      <Intro
        eyebrow="GLAUBE · PERSÖNLICHE PRAXIS"
        title="Im Rhythmus des Tages."
      >
        <p>
          Eine respektvolle private Übersicht. Zeiten sind konfigurierbar und
          keine religiöse Autorität.
        </p>
      </Intro>
      <div className="prayers">
        {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((p, i) => (
          <div className={i < 3 ? "complete" : ""} key={p}>
            <i>{i < 3 ? <I.Check /> : <I.Moon />}</i>
            <b>{p}</b>
            <time>{["04:47", "13:22", "17:10", "20:31", "22:06"][i]}</time>
          </div>
        ))}
      </div>
      <div className="domainGrid">
        <Card className="quran">
          <Tag>QURʾĀN</Tag>
          <h3>Seite 184</h3>
          <p>Al-Anfāl · persönliches Lesetempo</p>
          <div className="bookProgress">
            <i style={{ width: "31%" }} />
          </div>
          <div className="row">
            <span>
              <b>31%</b>
              <small>Gesamtfortschritt</small>
            </span>
            <span>
              <b>4 Seiten</b>
              <small>Wochenziel</small>
            </span>
          </div>
        </Card>
        <Card>
          <Tag>PERSÖNLICHE DUʿĀS</Tag>
          {[
            "Dankbarkeit bewahren",
            "Klarheit für den beruflichen Weg",
            "Gesundheit für die Familie",
          ].map((x) => (
            <div className="dua" key={x}>
              <I.Heart />
              {x}
            </div>
          ))}
          <button className="link" onClick={() => note("Duʿā-Erfassung geöffnet · bleibt lokal")}>
            <I.Plus />
            Duʿā hinzufügen
          </button>
        </Card>
        <Card>
          <Tag>REFLEXION</Tag>
          <blockquote>
            „Wo habe ich heute Ruhe, Geduld und Aufrichtigkeit erlebt?“
          </blockquote>
          <textarea placeholder="Privater Gedanke …" />
        </Card>
      </div>
    </div>
  );
}
function Career() {
  return (
    <div className="domain careerDomain">
      <Intro eyebrow="KARRIERE" title="Stabilität heute. Freiheit morgen.">
        <p>Zwei Wege, bewusst koordiniert statt gegeneinander ausgespielt.</p>
      </Intro>
      <div className="careerSplit">
        <section>
          <div className="pathTitle">
            <span>
              <I.Building2 />
            </span>
            <div>
              <Tag>ANGESTELLT</Tag>
              <h3>Current role</h3>
            </div>
            <b>Stabil</b>
          </div>
          <Goal n="01" t="Im Job zuverlässig und gesund leisten" p="82%" />
          <h4>Diese Woche</h4>
          {[
            "Projektübergabe vorbereiten",
            "Feedback-Gespräch notieren",
            "Lernzeit: 45 Minuten",
          ].map((x, i) => (
            <Checkline key={x} t={x} done={i === 0} />
          ))}
        </section>
        <section>
          <div className="pathTitle">
            <span>
              <I.Rocket />
            </span>
            <div>
              <Tag>SELBSTSTÄNDIG</Tag>
              <h3>Future business</h3>
            </div>
            <b className="amber">Aufbau</b>
          </div>
          <Goal
            n="02"
            t="Angebot validieren und ersten Kunden gewinnen"
            p="58%"
          />
          <h4>Nächste Meilensteine</h4>
          {[
            "Angebot auf einer Seite",
            "5 Zielkunden sprechen",
            "Pilotprojekt definieren",
          ].map((x, i) => (
            <Checkline key={x} t={x} done={i === 0} />
          ))}
        </section>
      </div>
      <Card className="bridge">
        <I.GitMerge />
        <div>
          <Tag>DIE BRÜCKE</Tag>
          <h3>
            5 Stunden pro Woche investieren – ohne Energie aus dem Hauptjob zu
            leihen.
          </h3>
        </div>
        <span>2 / 5 Std.</span>
      </Card>
    </div>
  );
}
function Health() {
  return (
    <div className="domain healthDomain">
      <Intro
        eyebrow="GESUNDHEIT · ORGANISATORISCH"
        title="Stärker werden. Gut regenerieren."
      >
        <p>
          Training, Ernährung und Erholung in einem ehrlichen Überblick – keine
          medizinische Beratung.
        </p>
      </Intro>
      <div className="healthTop">
        {[
          ["Trainingswoche", "3 / 4", "Einheiten"],
          ["Schlaf", "7 h 28", "Ø 7 Tage"],
          ["Erholung", "Gut", "subjektiv"],
          ["Protein", "128 g", "Tageswert · Mock"],
        ].map((x) => (
          <Card key={x[0]}>
            <Tag>{x[0]}</Tag>
            <h3>{x[1]}</h3>
            <small>{x[2]}</small>
          </Card>
        ))}
      </div>
      <div className="healthGrid">
        <Card className="chart">
          <div className="row">
            <div>
              <Tag>TRAININGSVOLUMEN</Tag>
              <h3>Letzte 8 Wochen</h3>
            </div>
            <b>+12%</b>
          </div>
          <div
            className="fitnessBars"
            role="img"
            aria-label="Trainingsvolumen steigt über acht Wochen moderat an"
          >
            {[42, 48, 45, 57, 61, 66, 71, 76].map((h, i) => (
              <i style={{ height: h + "%" }} key={i}>
                <span>W{i + 1}</span>
              </i>
            ))}
          </div>
        </Card>
        <Card>
          <Tag>NÄCHSTE EINHEIT</Tag>
          <h3>Push · moderat</h3>
          <p>
            Montag, 17:30 · 60 Minuten. Danach bleibt der Abend frei von Deep
            Work.
          </p>
          {[
            ["Bankdrücken", "3 × 8"],
            ["Schulterdrücken", "3 × 10"],
            ["Trizeps", "2 × 12"],
          ].map((x) => (
            <div className="exercise" key={x[0]}>
              <b>{x[0]}</b>
              <span>{x[1]}</span>
            </div>
          ))}
        </Card>
        <Card>
          <Tag>REGENERATION</Tag>
          {[
            ["Schlafqualität", 78],
            ["Muskelgefühl", 66],
            ["Stress", 42],
            ["Energie", 72],
          ].map((x) => (
            <div className="recovery" key={x[0] as string}>
              <div>
                <b>{x[0]}</b>
                <span>{x[1]}%</span>
              </div>
              <i>
                <em style={{ width: x[1] + "%" }} />
              </i>
            </div>
          ))}
        </Card>
        <Card>
          <Tag>ERNÄHRUNG</Tag>
          <div className="nutrition">
            <div>
              <b>2.180</b>
              <span>kcal · Mock</span>
            </div>
            <div>
              <b>128 g</b>
              <span>Protein</span>
            </div>
            <div>
              <b>2,1 l</b>
              <span>Wasser</span>
            </div>
          </div>
          <p>
            Datenquelle unverbunden. Werte dienen nur der visuellen Planung.
          </p>
        </Card>
      </div>
    </div>
  );
}
function Finance() {
  return (
    <div className="domain financeDomain">
      <Intro
        eyebrow="FINANZEN · PRIVATE DATEN"
        title="Klarheit ohne Aktionismus."
      >
        <p>Beispieldaten · keine Bank verbunden · niemals Transaktionen.</p>
      </Intro>
      <div className="moneytop">
        {[
          ["Nettovermögen", "€ 42.860", "+3,2%"],
          ["Monatlicher Cashflow", "+ € 1.240", "August"],
          ["Sparquote", "28%", "Ziel 30%"],
          ["Freies Budget", "€ 684", "bis Monatsende"],
        ].map((x) => (
          <Card key={x[0]}>
            <Tag>{x[0]}</Tag>
            <h3>{x[1]}</h3>
            <small>{x[2]}</small>
          </Card>
        ))}
      </div>
      <div className="financegrid">
        <Card className="chart">
          <div className="row">
            <div>
              <Tag>NETTOWERT-TREND</Tag>
              <h3>12 Monate</h3>
            </div>
            <b>+ € 6.420</b>
          </div>
          <div className="bars">
            {[42, 47, 45, 52, 55, 60, 58, 66, 70, 74, 79, 86].map((h, i) => (
              <i style={{ height: h + "%" }} key={i} />
            ))}
          </div>
        </Card>
        <Card>
          <Tag>BUDGETS</Tag>
          {[
            ["Wohnen", 900, 900],
            ["Lebensmittel", 310, 420],
            ["Mobilität", 180, 260],
            ["Freizeit", 145, 240],
          ].map((x) => (
            <div className="budget" key={x[0]}>
              <div>
                <b>{x[0]}</b>
                <span>
                  € {x[1]} / {x[2]}
                </span>
              </div>
              <i>
                <em style={{ width: (+x[1] / +x[2]) * 100 + "%" }} />
              </i>
            </div>
          ))}
        </Card>
        <Card>
          <Tag>SPARZIELE</Tag>
          <Goal n="01" t="Notgroschen · € 8.400 / 12.000" p="70%" />
          <Goal n="02" t="Business-Start · € 3.200 / 10.000" p="32%" />
        </Card>
        <Card>
          <Tag>WIEDERKEHREND</Tag>
          {[
            ["Miete", "– € 900", "01. Sep"],
            ["Versicherungen", "– € 146", "03. Sep"],
            ["Gehalt", "+ € 2.940", "30. Aug"],
          ].map((x) => (
            <div className="transaction" key={x[0]}>
              <I.Repeat2 />
              <b>{x[0]}</b>
              <span>
                {x[1]}
                <small>{x[2]}</small>
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
function Relations() {
  const [selected, setSelected] = useState("Mama");
  return (
    <div className="domain relationDomain">
      <Intro
        eyebrow="BEZIEHUNGEN · PRIVAT"
        title="Menschen, die dein Leben tragen."
      >
        <p>Notizen bleiben verborgen, bis du eine Person bewusst öffnest.</p>
      </Intro>
      <div className="relationgrid">
        <Card className="constellation">
          <Tag>DEINE KONSTELLATION</Tag>
          <div className="people">
            {[
              ["M", "Mama", "family"],
              ["A", "Partnerin", "love"],
              ["Y", "Yusuf", "friend"],
              ["S", "Sarah", "friend"],
              ["B", "Bruder", "family"],
            ].map((x, i) => (
              <button
                aria-pressed={selected === x[1]}
                className={"person p" + i + (selected === x[1] ? " active" : "")}
                key={x[1]}
                onClick={() => setSelected(x[1])}
              >
                <i>{x[0]}</i>
                <span>{x[1]}</span>
              </button>
            ))}
          </div>
          <p aria-live="polite" className="selectionNote">
            {selected} ausgewählt · private Details bleiben geschlossen.
          </p>
        </Card>
        <Card>
          <Tag>NÄCHSTE IMPULSE</Tag>
          {[
            ["Mama", "Heute anrufen", "vor 6 Tagen"],
            ["Yusuf", "Kaffee vereinbaren", "vor 3 Wochen"],
            ["Sarah", "Geburtstag am 29. Aug", "in 6 Tagen"],
          ].map((x) => (
            <div className="contact" key={x[0]}>
              <i>{x[0][0]}</i>
              <span>
                <b>{x[0]}</b>
                <small>{x[1]}</small>
              </span>
              <em>{x[2]}</em>
            </div>
          ))}
        </Card>
        <Card>
          <Tag>WICHTIGE DATEN</Tag>
          <div className="birthday">
            <b>29</b>
            <span>
              AUG<small>Sarah · Geburtstag</small>
            </span>
          </div>
          <div className="birthday">
            <b>12</b>
            <span>
              SEP<small>Jahrestag</small>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
function Projects({ note }: any) {
  const [view, setView] = useState("Board");
  const p = [
    [
      "Agentic OS",
      "System im Alltag verankern",
      "Aktiv",
      "68%",
      "12 Chats · 4 Skills",
    ],
    [
      "Selbstständigkeit",
      "Angebot validieren",
      "Fokus",
      "58%",
      "7 Notizen · 2 Agenten",
    ],
    ["Health Baseline", "Stabile Routinen", "Aktiv", "82%", "3 Meilensteine"],
    ["Wohnung optimieren", "Räume vereinfachen", "Geparkt", "24%", "5 Ideen"],
  ];
  return (
    <>
      <Intro
        eyebrow="FLEXIBLER PROJEKTRAUM"
        title="Vorhaben, die sich mit dir entwickeln."
        action={
          <Btn onClick={() => note("Projekt-Erfassung geöffnet · noch nicht gespeichert")}>
            <I.Plus />
            Projekt
          </Btn>
        }
      />
      <div className="projectTools">
        {["Board", "Liste", "Timeline"].map((item) => (
          <button
            aria-pressed={view === item}
            className={view === item ? "active" : ""}
            key={item}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
        <span />
        <button onClick={() => note("Projektfilter geöffnet")}>
          <I.Filter />
          Filter
        </button>
      </div>
      <div className="projects">
        {p.map((x, i) => (
          <Card key={x[0]}>
            <div className="row">
              <span className={"projectSymbol s" + i}>
                <I.FolderKanban />
              </span>
              <em>{x[2]}</em>
            </div>
            <h3>{x[0]}</h3>
            <p>{x[1]}</p>
            <div className="projectbar">
              <i style={{ width: x[3] }} />
            </div>
            <div className="projectmeta">
              <span>
                <I.CheckSquare />
                Nächste Aktion
              </span>
              <span>
                <I.MessagesSquare />
                {x[4]}
              </span>
            </div>
            <div className="avatars">
              <i>WP</i>
              <i>PC</i>
              <button
                aria-label={`Agent oder Skill zu ${x[0]} hinzufügen`}
                onClick={() => note(`${x[0]}: Zuordnung geöffnet`)}
              >
                <I.Plus />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
function Habits({ tasks, save }: any) {
  const [txt, setTxt] = useState("");
  const add = () => {
    if (txt.trim()) {
      save([...tasks, { id: Date.now(), t: txt, area: "Inbox", done: false }]);
      setTxt("");
    }
  };
  return (
    <>
      <Intro
        eyebrow="KLARHEIT STATT DRUCK"
        title="Habits, Aufgaben & Checklisten."
      >
        <p>Kein Punktesystem. Nur ein ehrlicher Blick auf das, was trägt.</p>
      </Intro>
      <div className="habitgrid">
        <Card>
          <div className="row">
            <Tag>HEUTE</Tag>
            <b>3 von 6</b>
          </div>
          {[
            ["Fajr bewusst beten", true, "Glaube"],
            ["10 Minuten bewegen", true, "Gesundheit"],
            ["Qurʾān lesen", true, "Glaube"],
            ["2 Liter Wasser", false, "Gesundheit"],
            ["Tagesjournal", false, "Reflexion"],
            ["Früh schlafen", false, "Gesundheit"],
          ].map((x) => (
            <Checkline
              key={x[0] as string}
              t={x[0] as string}
              done={x[1] as boolean}
              meta={x[2] as string}
            />
          ))}
        </Card>
        <Card>
          <Tag>AUFGABEN</Tag>
          <div className="taskadd">
            <input
              value={txt}
              onChange={(e) => setTxt(e.target.value)}
              placeholder="Neue Aufgabe …"
            />
            <button onClick={add}>
              <I.Plus />
            </button>
          </div>
          {tasks.map((t: any) => (
            <button
              className="taskrow"
              onClick={() =>
                save(
                  tasks.map((x: any) =>
                    x.id === t.id ? { ...x, done: !x.done } : x,
                  ),
                )
              }
              key={t.id}
            >
              <i className={t.done ? "done" : ""}>{t.done && <I.Check />}</i>
              <span className={t.done ? "strike" : ""}>
                {t.t}
                <small>{t.area}</small>
              </span>
            </button>
          ))}
        </Card>
        <Card>
          <Tag>SANFTE KONTINUITÄT</Tag>
          <div className="weekdots">
            {["M", "D", "M", "D", "F", "S", "S"].map((d, i) => (
              <i className={i < 5 ? "done" : ""} key={i}>
                {d}
              </i>
            ))}
          </div>
          <h3>5 Tage im Rhythmus</h3>
          <p>Kein verlorener Streak. Morgen ist einfach ein neuer Tag.</p>
        </Card>
      </div>
    </>
  );
}
function Journal({ text, setText, mood, setMood, note }: any) {
  const insertPrompt = (prompt: string) => {
    const separator = text.trim() ? "\n\n" : "";
    setText(`${text}${separator}${prompt}\n`);
  };
  return (
    <>
      <Intro eyebrow="TAGESJOURNAL" title="Sonntag, 23. August">
        <p>Ein ruhiger Ort für das, was war und was bleiben darf.</p>
      </Intro>
      <div className="journalgrid">
        <Card className="editor">
          <div className="row">
            <Tag>REFLEXION</Tag>
            <span>Automatisch lokal gespeichert</span>
          </div>
          <h3>Was hat heute Bedeutung gehabt?</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Schreibe frei …"
          />
          <div className="prompts">
            <button onClick={() => insertPrompt("Wofür bin ich dankbar?")}>Wofür bin ich dankbar?</button>
            <button onClick={() => insertPrompt("Was darf ich loslassen?")}>Was darf ich loslassen?</button>
            <button onClick={() => insertPrompt("Was nehme ich mit?")}>Was nehme ich mit?</button>
          </div>
          <Btn onClick={() => note("Journal lokal gespeichert")}>
            Eintrag abschließen
          </Btn>
        </Card>
        <Card>
          <Tag>STIMMUNG & ENERGIE</Tag>
          <div className="moods">
            {[
              ["ruhig", "☾"],
              ["leicht", "◡"],
              ["neutral", "—"],
              ["schwer", "◌"],
            ].map((x) => (
              <button
                className={mood === x[0] ? "active" : ""}
                onClick={() => setMood(x[0])}
                key={x[0]}
              >
                <i>{x[1]}</i>
                {x[0]}
              </button>
            ))}
          </div>
          <label>
            Energie <input type="range" min="1" max="5" defaultValue="3" />
          </label>
          <div className="linked">
            <Tag>VERKNÜPFT</Tag>
            <span>
              <I.Calendar />3 Termine
            </span>
            <span>
              <I.ListChecks />6 Habits
            </span>
            <span>
              <I.CheckSquare />3 Aufgaben
            </span>
          </div>
        </Card>
        <Card>
          <Tag>VERLAUF</Tag>
          {[
            "22. August · Klarheit",
            "21. August · Training",
            "20. August · Familie",
          ].map((x) => (
            <button className="history" key={x} onClick={() => note(`${x} als Vorschau geöffnet`)}>
              {x}
              <I.ChevronRight />
            </button>
          ))}
        </Card>
      </div>
    </>
  );
}
function Agents({ note }: any) {
  return (
    <>
      <Intro
        eyebrow="AGENTEN SIND DIENSTE"
        title="Dein koordiniertes Agenten-Team."
        action={
          <Btn onClick={() => note("Agent-Konfigurator geöffnet")}>
            <I.Plus />
            Agent
          </Btn>
        }
      />
      <div className="agentSummary">
        <span>
          <i className="online" />4 online
        </span>
        <span>
          <i className="busy" />1 beschäftigt
        </span>
        <span>
          <i className="unconfigured" />1 unkonfiguriert
        </span>
      </div>
      <div className="agents">
        {agents.map((a: any) => (
          <Card key={a[0]}>
            <div className="row">
              <span className="agentIcon">
                <I.Bot />
              </span>
              <i className={"badge " + a[4]}>{a[4]}</i>
            </div>
            <h3>{a[0]}</h3>
            <p>{a[1]}</p>
            <div className="chips">
              {a[2].map((x: string) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            <label>
              Modell
              <select
                defaultValue={a[3]}
                onChange={(e) => note(`${a[0]}: Modell lokal auf ${e.target.value} gesetzt`)}
              >
                <option>gpt-5.4</option>
                <option>gpt-5.4-mini</option>
                <option>gpt-5.4-nano</option>
              </select>
            </label>
            <div className="activity">
              <I.Activity />
              <span>
                Zuletzt: Wochenentwurf erstellt<small>vor 18 Min.</small>
              </span>
            </div>
            <button onClick={() => note(`${a[0]} konfiguriert`)}>
              Konfigurieren <I.Settings2 />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
function Skills() {
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("Alle");
  const list = skills.filter(
    (x) =>
      x.join(" ").toLowerCase().includes(q.toLowerCase()) &&
      (category === "Alle" || x.join(" ").toLowerCase().includes(category.toLowerCase())),
  );
  return (
    <>
      <Intro
        eyebrow="WIEDERVERWENDBARE WORKFLOWS"
        title="Skills, die dein System tragen."
      />
      <div className="skillbar">
        <label>
          <I.Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Skills durchsuchen …"
          />
        </label>
        {["Alle", "Planung", "Gesundheit", "Wissen"].map((x) => (
          <button
            aria-pressed={category === x}
            className={category === x ? "active" : ""}
            key={x}
            onClick={() => setCategory(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="skilltable">
        <div>
          <b>Skill</b>
          <b>Kategorie</b>
          <b>Agent</b>
          <b>Status</b>
        </div>
        {list.map((x, i) => (
          <div key={x[0]}>
            <span>
              <i>{i + 1}</i>
              <b>{x[0]}</b>
            </span>
            <span>{x[1]}</span>
            <span>{x[2]}</span>
            <em className={x[3] === "Bereit" ? "ok" : ""}>{x[3]}</em>
          </div>
        ))}
      </div>
    </>
  );
}
function Chats({ note }: any) {
  const [model, setModel] = useState("gpt-5.4"),
    [msg, setMsg] = useState(""),
    [selected, setSelected] = useState(0);
  const conversations = [
    ["Wochenplanung KW 35", "Agentic OS"],
    ["Angebot schärfen", "Selbstständigkeit"],
    ["Training & Erholung", "Health Baseline"],
    ["Tagesreflexion", "Glaube"],
  ];
  return (
    <>
      <Intro
        eyebrow="CHATGPT COMPANION MODE · STANDARD"
        title="Chats, die zu deiner Arbeit gehören."
      >
        <p>
          Gespräche bleiben bewusst in deiner ChatGPT-App. Agentic OS ordnet
          Projekte, Aufgaben, Wissen und von dir ausgewählte Zusammenfassungen.
        </p>
      </Intro>
      <Card className="companionMode">
        <div>
          <Tag>AKTIVER STANDARD · IM ABO ENTHALTEN</Tag>
          <h3>ChatGPT für Gespräche. Agentic OS für Struktur.</h3>
          <p>
            Agentic OS liest keinen ChatGPT-Verlauf. Öffne ChatGPT selbst und
            übernimm nur eine bewusst ausgewählte Zusammenfassung in die Inbox.
          </p>
        </div>
        <a
          className="btn soft"
          href="https://chatgpt.com/"
          rel="noreferrer"
          target="_blank"
        >
          ChatGPT öffnen <I.ExternalLink />
        </a>
      </Card>
      <div className="chatlayout">
        <Card className="conversations">
          <div className="row">
            <Tag>PROJEKT-CHATS</Tag>
            <button aria-label="Neuen Projekt-Chat vorbereiten" onClick={() => note("Neuer Projekt-Chat vorbereitet")}>
              <I.Plus />
            </button>
          </div>
          {conversations.map((x, i) => (
            <button
              aria-pressed={selected === i}
              className={selected === i ? "active" : ""}
              key={x[0]}
              onClick={() => setSelected(i)}
            >
              <I.MessageCircle />
              <span>
                <b>{x[0]}</b>
                <small>{x[1]} · heute</small>
              </span>
            </button>
          ))}
        </Card>
        <Card className="chatbox">
          <div className="chathead">
            <span>
              <b>{conversations[selected][0]}</b>
              <small>Wochenplaner · Mock provider</small>
            </span>
            <label>
              Modell
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option>gpt-5.4</option>
                <option>gpt-5.4-mini</option>
              </select>
            </label>
          </div>
          <div className="messages">
            <div className="ai">
              <I.Bot />
              <p>
                Ich habe drei realistische Outcomes und 36% Puffer vorbereitet.
                Soll ich dir die Zeitblöcke erklären?
              </p>
            </div>
            <div className="user">Ja, beginne mit der Karriere-Priorität.</div>
          </div>
          <div className="composer">
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Nachricht …"
            />
            <button
              onClick={() => {
                setMsg("");
                note("Mock: keine Anfrage an OpenAI gesendet");
              }}
            >
              <I.ArrowUp />
            </button>
          </div>
          <small className="mockline">
            <I.Shield />
            Mock · kein API-Key · keine Daten übertragen
          </small>
        </Card>
        <Card className="modelcard">
          <Tag>OPTIONAL · NUTZUNGSBASIERT</Tag>
          <div className="provider">
            <i className="unconfigured" />
            <span>
              <b>OpenAI API</b>
              <small>Deaktiviert · Kill switch aktiv</small>
            </span>
          </div>
          <p>
            ChatGPT Pro gewährt keinen API-Zugriff. Die serverseitige Grenze
            bleibt ohne Schlüssel und ausdrückliche Kostenfreigabe gesperrt.
          </p>
          <Btn
            soft
            onClick={() => note("Siehe sichere Einrichtung in SETUP.md")}
          >
            Sicher einrichten
          </Btn>
        </Card>
      </div>
    </>
  );
}
const defaultInboxEntries = [
  ["Angebotsidee konkretisieren", "Idee", "Karriere"],
  ["Meal-Prep vereinfachen", "Aufgabe", "Gesundheit"],
  ["Artikel zu Fokusarbeit", "Link", "Inbox"],
  ["Gesprächsnotiz", "Notiz", "Beziehungen"],
];

function Inbox({ note }: any) {
  const [type, setType] = useState("Idee"),
    [txt, setTxt] = useState(""),
    [entries, setEntries] = useState(defaultInboxEntries);
  useEffect(() => setEntries(store.get("inbox", defaultInboxEntries)), []);
  const capture = () => {
    const value = txt.trim();
    if (!value) return;
    const next = [[value, type, "Inbox"], ...entries];
    setEntries(next);
    store.set("inbox", next);
    setTxt("");
    note(`${type} lokal erfasst`);
  };
  return (
    <>
      <Intro eyebrow="ALLES DARF HIER BEGINNEN" title="Universelle Inbox." />
      <Card className="companionCapture">
        <span className="connector">
          <I.MessageSquareText />
        </span>
        <div>
          <Tag>CHATGPT COMPANION CAPTURE</Tag>
          <h3>Nur übernehmen, was du bewusst auswählst.</h3>
          <p>
            Bitte ChatGPT um eine strukturierte Zusammenfassung, kopiere sie
            selbst und füge sie unten als ChatGPT-Notiz ein. Kein Scraping, kein
            automatischer Zugriff auf deinen Verlauf.
          </p>
        </div>
        <a
          className="btn soft"
          href="https://chatgpt.com/"
          rel="noreferrer"
          target="_blank"
        >
          ChatGPT öffnen <I.ExternalLink />
        </a>
      </Card>
      <Card className="captureAll">
        <div className="capturetypes">
          {["Idee", "Aufgabe", "Notiz", "ChatGPT-Notiz", "Link", "Datei"].map((x) => (
            <button
              className={type === x ? "active" : ""}
              onClick={() => setType(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
        <textarea
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          placeholder={`${type} schnell erfassen …`}
        />
        <div className="row">
          <span>Später in Bereich, Projekt oder Agent triagieren.</span>
          <Btn
            onClick={capture}
          >
            Erfassen <I.ArrowRight />
          </Btn>
        </div>
      </Card>
      <div className="inboxlist">
        {entries.map((x, index) => (
          <Card key={`${x[0]}-${index}`}>
            <i />
            <span>
              <b>{x[0]}</b>
              <small>
                {x[1]} · {x[2]}
              </small>
            </span>
            <button onClick={() => note(`${x[0]} zur Triage ausgewählt`)}>
              Triage <I.ChevronRight />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
function Integrations({ note }: any) {
  const [loaded, setLoaded] = useState(false),
    [proposed, setProposed] = useState(false),
    [liveCalendars, setLiveCalendars] = useState<any[]>([]),
    [eventPreview, setEventPreview] = useState<any>(null),
    [vaultStatus, setVaultStatus] = useState<any>({ status: "unconfigured" }),
    [calendarStatus, setCalendarStatus] = useState<any>({
      configured: false,
      connected: false,
      mode: "mock",
    });
  useEffect(() => {
    fetch("/api/obsidian/status", { cache: "no-store" })
      .then((response) => response.json())
      .then(setVaultStatus)
      .catch(() => setVaultStatus({ status: "degraded" }));
    fetch("/api/calendar/status", { cache: "no-store" })
      .then((response) => response.json())
      .then(setCalendarStatus)
      .catch(() =>
        setCalendarStatus({ configured: false, connected: false, mode: "mock" }),
      );
    fetch("/api/calendar/calendars", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setLiveCalendars(data.calendars || []))
      .catch(() => setLiveCalendars([]));
  }, []);
  const prepareFirstEvent = async () => {
    const target = liveCalendars.find((calendar) => calendar.writable && /training|gesundheit|health|fitness/i.test(calendar.summary)) || liveCalendars.find((calendar) => calendar.writable && calendar.primary);
    if (!target) return note("Kein eindeutig beschreibbarer Trainings- oder Primärkalender verfügbar");
    const change = { action: "create", calendarId: target.id, title: "Kurzes Training Push", start: "2026-08-24T21:00:00+02:00", end: "2026-08-24T21:30:00+02:00", idempotencyKey: "agentic-os:2026-08-24:kurzes-training-push" };
    const response = await fetch("/api/calendar/write-proposal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ change, selectedCalendarIds: [target.id] }) });
    const proposal = await response.json();
    if (!response.ok) return note(proposal.error || "Vorschlag konnte nicht erstellt werden");
    setEventPreview({ ...proposal, calendarName: target.summary, timezone: "Europe/Berlin" });
  };
  return (
    <>
      <Intro
        eyebrow="INTEGRATION HEALTH CENTER"
        title="Jede Verbindung. Ehrlich sichtbar."
      >
        <p>
          Online bedeutet verifiziert. Alles andere bleibt klar als Mock oder
          unkonfiguriert markiert.
        </p>
      </Intro>
      <Card className="calendarSafe">
        <div className="connectionHead">
          <span>
            <I.CalendarDays />
          </span>
          <div>
            <Tag>
              GOOGLE CALENDAR · {calendarStatus.eventWriteReady ? "EVENTS LIVE · KONTROLLIERT" : calendarStatus.connected ? "READ-ONLY · NEUE FREIGABE NÖTIG" : calendarStatus.configured ? "OAUTH BEREIT" : "TESTADAPTER"}
            </Tag>
            <h3>Wochenplanung sicher verbinden</h3>
          </div>
          <em>{calendarStatus.connected ? "Online" : calendarStatus.configured ? "Bereit" : "Unkonfiguriert"}</em>
        </div>
        {!calendarStatus.configured && (
          <div className="setupBoundary">
            <I.Shield />
            <span>
              <b>Ein externer Schritt fehlt</b>
              Google-Cloud-Web-OAuth-Client mit Calendar API und Callback anlegen;
              Client-ID/Secret ausschließlich lokal in `.env.local` speichern.
            </span>
          </div>
        )}
        {calendarStatus.configured && !calendarStatus.eventWriteReady && (
          <a className="btn soft" href="/api/calendar/connect">
            Lesen + kontrollierte Event-Writes freigeben <I.ExternalLink />
          </a>
        )}
        {calendarStatus.eventWriteReady && !calendarStatus.sharedWithDesktop && (
          <button className="btn soft" onClick={async () => { const response = await fetch("/api/calendar/share-local-session", { method: "POST" }); if (response.ok) setCalendarStatus((current: any) => ({ ...current, sharedWithDesktop: true })); }}>
            Verbindung verschlüsselt für Desktop übernehmen
          </button>
        )}
        <div className="flow">
          <div>
            <b>1 · Kalender</b>
            <label>
              <input type="checkbox" defaultChecked />
              Arbeit & Pendeln
            </label>
            <label>
              <input type="checkbox" defaultChecked />
              Project
            </label>
            <label>
              <input type="checkbox" defaultChecked />
              Training
            </label>
            <Btn soft onClick={() => setLoaded(true)}>
              Testwoche lesen
            </Btn>
          </div>
          <div>
            <b>2 · Bounded read</b>
            <p>
              {loaded
                ? "5 Termine · maximal 8 Tage"
                : "Noch keine Daten gelesen"}
            </p>
            <Btn soft onClick={() => loaded && setProposed(true)}>
              Blöcke vorschlagen
            </Btn>
          </div>
          <div>
            <b>3 · Approval</b>
            <p>
              {proposed
                ? "2 exakte Vorschläge · 0 Writes · einzeln freizugeben"
                : "Keine Änderung vorbereitet"}
            </p>
            <Btn
              disabled={!eventPreview}
              onClick={async () => {
                if (!eventPreview) return;
                const response = await fetch("/api/calendar/write", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ approvalToken: eventPreview.approvalToken, confirmation: "DIESEN_TERMIN_JETZT_SCHREIBEN" }) });
                const result = await response.json();
                note(response.ok ? "Termin nach Einzelbestätigung geschrieben · Audit gespeichert" : result.error || "Kalenderwrite abgelehnt");
              }}
            >
              {eventPreview ? "DIESEN TERMIN JETZT SCHREIBEN" : "Einzelwrite erst nach exakter Vorschau"}
            </Btn>
          </div>
        </div>
        <small>
          <I.ShieldCheck />
          Keine Hintergrundwrites. Create/Update nur nach exakter Einzelvorschau und Bestätigung; Duplikatschutz + Audit aktiv. Deletes bleiben deaktiviert.
        </small>
        {calendarStatus.eventWriteReady && (
          <div className="setupBoundary">
            <I.CalendarDays />
            <span>
              <b>Erster kontrollierter Vorschautest</b>
              <button onClick={prepareFirstEvent}>Vorschau erzeugen · nichts schreiben</button>
              {eventPreview && <span role="status" aria-live="polite">{eventPreview.calendarName} · Kurzes Training Push · 24.08.2026 · 21:00–21:30 · Europe/Berlin · Create · 0 Writes · Duplikatschutz aktiv · Freigabe gültig bis {new Date(eventPreview.expiresAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })} Europe/Berlin</span>}
            </span>
          </div>
        )}
      </Card>
      <div className="connections">
        {[
          ["Google Tasks", "Aufgaben", "unconfigured", "Keine Berechtigung"],
          [
            "Obsidian",
            "Wissen",
            vaultStatus.status === "online" ? "online" : vaultStatus.status === "degraded" ? "offline" : "unconfigured",
            vaultStatus.status === "online" ? `${vaultStatus.noteCount} Markdown-Notizen · Read-only` : "Read-only Vorschau",
          ],
          ["OpenAI", "Modelle & Chats", "unconfigured", "Kein API-Key"],
          ["Health", "Training", "offline", "Keine Datenquelle"],
          ["Finance", "Konten", "unconfigured", "Read-only only"],
          ["Tailscale", "Privater Fernzugriff", "unconfigured", "Tailnet-only · kein Funnel"],
        ].map((x, i) => (
          <Card key={x[0]}>
            <div className="row">
              <span className="connector">
                {
                  [
                    <I.CheckSquare key="tasks" />,
                    <I.BookOpen key="obsidian" />,
                    <I.Sparkles key="openai" />,
                    <I.Activity key="health" />,
                    <I.Landmark key="finance" />,
                    <I.ShieldCheck key="tailscale" />,
                  ][i]
                }
              </span>
              <i className={"badge " + x[2]}>{x[2]}</i>
            </div>
            <h3>{x[0]}</h3>
            <p>{x[1]}</p>
            <dl>
              <dt>Scope</dt>
              <dd>{x[3]}</dd>
              <dt>Letzter Sync</dt>
              <dd>{x[0] === "Obsidian" && vaultStatus.status === "online" ? "Gerade lokal verifiziert" : "Nie"}</dd>
              <dt>Aktivität</dt>
              <dd>{x[0] === "Obsidian" && vaultStatus.status === "online" ? "Metadatenindex gelesen · 0 Writes" : "Keine externen Aktionen"}</dd>
            </dl>
            <button onClick={() => note(`${x[0]}: sichere Details geöffnet`)}>
              Details <I.ChevronRight />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
function Brain() {
  const [vault, setVault] = useState<any>({ status: "loading" });
  const loadVault = useCallback(async () => {
    setVault((current: any) => ({ ...current, status: "loading" }));
    try {
      const response = await fetch("/api/obsidian/status", { cache: "no-store" });
      setVault(await response.json());
    } catch {
      setVault({ status: "degraded", error: "Lokaler Vault-Index nicht erreichbar" });
    }
  }, []);
  useEffect(() => {
    void loadVault();
  }, [loadVault]);

  const connected = vault.status === "online";
  return (
    <>
      <Intro eyebrow="WISSEN & SHARED MEMORY" title="Dein zweites Gedächtnis.">
        <p>
          Obsidian-kompatibel, durchsuchbar und zuerst immer schreibgeschützt.
        </p>
      </Intro>
      <div className="braingrid">
        <Card className="knowledge">
          <div className="row">
            <Tag>WISSENSGRAPH</Tag>
            <span>
              {connected ? `${vault.noteCount} Notizen · echter Read-only Index` : "Lokaler Index"}
            </span>
          </div>
          <div className="nodes">
            {[
              "Glaube",
              "Wochenplan",
              "Gesundheit",
              "Projekte",
              "Beruf",
              "Menschen",
              "Notizen",
            ].map((x, i) => (
              <i className={"node n" + i} key={x}>
                {x}
              </i>
            ))}
          </div>
        </Card>
        <Card className="vaultHealth">
          <div className="row">
            <Tag>OBSIDIAN · READ-ONLY PREVIEW</Tag>
            <i className={`badge ${connected ? "online" : vault.status === "degraded" ? "offline" : "unconfigured"}`}>
              {connected ? "online" : vault.status === "loading" ? "prüft" : vault.status}
            </i>
          </div>
          <h3>{connected ? `${vault.rootLabel} ist lokal indiziert` : "Vault-Verbindung"}</h3>
          {connected ? (
            <>
              <div className="vaultMetrics">
                <span><b>{vault.noteCount}</b>Markdown-Notizen</span>
                <span><b>{vault.frontmatterNoteCount}</b>mit Frontmatter</span>
                <span><b>{vault.relationshipCount}</b>aufgelöste Beziehungen</span>
                <span><b>{vault.linkCount}</b>lokale Links</span>
              </div>
              <div className="vaultSections">
                {vault.sectionCounts?.slice(0, 6).map((item: any) => (
                  <span key={item.section}><b>{item.section}</b>{item.count}</span>
                ))}
              </div>
              {vault.relationships?.length > 0 && (
                <div className="vaultRelations">
                  <small>BEZIEHUNGSVORSCHAU</small>
                  {vault.relationships.filter((item: any) => !item.sensitive).slice(0, 3).map((item: any, index: number) => (
                    <span key={`${item.source}-${item.target}-${index}`}>
                      {item.source} <I.ArrowRight /> {item.target}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p>{vault.error || "Lokaler Pfad ist noch nicht in der Server-Umgebung gesetzt."}</p>
          )}
          <div className="vaultGuard">
            <I.ShieldCheck />
            <span><b>Schreibzugriff gesperrt</b>Jede spätere Änderung braucht Vorschau, ausdrückliche Freigabe und Audit.</span>
          </div>
          <Btn soft onClick={loadVault}>Read-only Index neu laden</Btn>
        </Card>
        <Card>
          <Tag>MEMORY</Tag>
          {[
            ["Präferenz", "Nach Training kein Deep Work"],
            ["Regel", "Maximal 3 Wochen-Outcomes"],
            ["Rhythmus", "Sonntag 11:00 Wochenreset"],
            ["Schutz", "35% Kapazitätspuffer"],
          ].map((x) => (
            <div className="memoryrow" key={x[1]}>
              <span>{x[0]}</span>
              <b>{x[1]}</b>
            </div>
          ))}
        </Card>
        <Card>
          <Tag>AUDIT</Tag>
          {[
            "Mock-Kalender gelesen",
            "Wochenplan vorgeschlagen",
            "Journal lokal gespeichert",
            "Backup erstellt",
          ].map((x, i) => (
            <div className="audit" key={x}>
              <I.History />
              <span>
                <b>{x}</b>
                <small>
                  {i + 8}:2{i} · lokal
                </small>
              </span>
            </div>
          ))}
        </Card>
        <Card>
          <Tag>INDEX-SICHERHEIT</Tag>
          <h3>Nur Metadaten und Beziehungen.</h3>
          <p>
            `.obsidian`, Papierkorb, Caches, Anhänge, Symlinks und Nicht-Markdown
            bleiben ausgeschlossen. Notiztexte erscheinen weder im Health-Status
            noch in Logs oder Vorschau-Bildern.
          </p>
          <Btn soft onClick={loadVault}>Sicher erneut prüfen</Btn>
        </Card>
      </div>
    </>
  );
}
function Settings({ brand, save }: any) {
  const [d, setD] = useState(brand);
  return (
    <>
      <Intro eyebrow="PERSÖNLICH & LOKAL" title="Einstellungen">
        <p>
          Der Produktname ist ein Platzhalter und kann jederzeit ohne
          Datenmigration geändert werden.
        </p>
      </Intro>
      <div className="settingsGrid">
        <Card>
          <Tag>IDENTITÄT</Tag>
          <label>
            Produktname
            <input
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
            />
          </label>
          <label>
            Kurzname / Monogramm
            <input
              value={d.short}
              maxLength={3}
              onChange={(e) => setD({ ...d, short: e.target.value })}
            />
          </label>
          <label>
            Akzentfarbe
            <input
              type="color"
              value={d.accent}
              onChange={(e) => setD({ ...d, accent: e.target.value })}
            />
          </label>
          <Btn onClick={() => save(d)}>Branding speichern</Btn>
        </Card>
        <Card>
          <Tag>KOSTENREGEL</Tag>
          <h3>Lokal und kostenlos als Standard</h3>
          <p>
            Funktionen mit möglichen Nutzungskosten erklären Preisart und
            Wirkung vor Aktivierung und benötigen deine ausdrückliche Freigabe.
          </p>
          <a className="btn soft" href="/usage">
            Usage & Limits öffnen
          </a>
        </Card>
        <Card>
          <Tag>VAULT</Tag>
          <h3>Emre · autorisiert</h3>
          <p>
            Bestehende Inhalte bleiben erhalten. Neue Struktur ist additiv;
            App-Writes benötigen weiterhin Vorschau, Freigabe und Audit.
          </p>
        </Card>
      </div>
    </>
  );
}
function Goal({ n, t, p }: any) {
  return (
    <div className="goal">
      <i>{n}</i>
      <span>
        <b>{t}</b>
        <em>
          <small style={{ width: p }} />
        </em>
      </span>
      <strong>{p}</strong>
    </div>
  );
}
function Checkline({ t, done = false, meta }: any) {
  return (
    <div className="checkline">
      <i className={done ? "done" : ""}>{done && <I.Check />}</i>
      <span className={done ? "strike" : ""}>
        {t}
        {meta && <small>{meta}</small>}
      </span>
    </div>
  );
}
function MobileNav({ v, go }: any) {
  return (
    <div className="mobileNav">
      {[
        ["home", "Heute", I.Gauge],
        ["areas", "Bereiche", I.Orbit],
        ["inbox", "Erfassen", I.PlusCircle],
        ["habits", "Aufgaben", I.CheckSquare],
        ["agents", "Agenten", I.Bot],
      ].map(([id, n, Icon]: any) => (
        <a
          aria-current={v === id ? "page" : undefined}
          aria-label={n}
          className={v === id ? "active" : ""}
          href={`#${id}`}
          onClick={(event) => {
            event.preventDefault();
            go(id);
          }}
          key={id}
        >
          <Icon />
          <span>{n}</span>
        </a>
      ))}
    </div>
  );
}
