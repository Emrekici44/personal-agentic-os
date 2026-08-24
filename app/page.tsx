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
  ["faith", "Glaube", "#a887d4", "Übersichtsvorlage", I.MoonStar],
  [
    "career",
    "Karriere",
    "#df9a52",
    "Zwei berufliche Wege",
    I.BriefcaseBusiness,
  ],
  [
    "health",
    "Gesundheit",
    "#5fae8d",
    "Noch keine Datenquelle",
    I.HeartPulse,
  ],
  [
    "finance",
    "Finanzen",
    "#6098c8",
    "Noch kein Konto verbunden",
    I.WalletCards,
  ],
  [
    "relations",
    "Beziehungen",
    "#dc7f91",
    "Private Beispielansicht",
    I.UsersRound,
  ],
  ["projects", "Projekte", "#d1a33c", "Gemeinsame Daten öffnen", I.LayoutGrid],
] as const;
const navGroups: any[] = [
  ["FOKUS", [
    ["home", "Kommando", I.Gauge],
    ["inbox", "Inbox", I.Inbox],
    ["journal", "Heute", I.NotebookPen],
    ["projects", "Projekte", I.PanelsTopLeft],
  ]],
  ["SYSTEM", [
    ["agents", "Agenten", I.Bot],
    ["skills", "Skills", I.Sparkles],
    ["chat", "Chats & Modelle", I.MessagesSquare],
    ["brain", "Wissen", I.Network],
    ["integrations", "Verbindungen", I.PlugZap],
    ["settings", "Einstellungen", I.Settings2],
  ]],
];
const nav: any[] = navGroups.flatMap(([, items]) => items);
const viewIds = new Set<View>([
  "areas",
  "habits",
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
function useSharedRecords(kind:string){
  const[records,setRecords]=useState<any[]>([]),[state,setState]=useState<'loading'|'online'|'error'>('loading');
  const load=useCallback(async()=>{try{await fetch('/api/state/session',{method:'POST'});const response=await fetch(`/api/state/records/${kind}`,{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();setRecords(data.records||[]);setState('online')}catch{setState('error')}},[kind]);
  useEffect(()=>{load()},[load]);
  const create=async(data:any)=>{const response=await fetch(`/api/state/records/${kind}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Speichern fehlgeschlagen');await load();return result};
  const update=async(data:any)=>{const response=await fetch(`/api/state/records/${kind}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Aktualisieren fehlgeschlagen');await load();return result};
  return{records,state,create,update,reload:load};
}
export default function App() {
  const [v, setV] = useState<View>("home"),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState(""),
    [theme, setTheme] = useState<"dark" | "light">("dark"),
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
    fetch("/api/state/session", { method: "POST" })
      .then(() => fetch("/api/state/preferences/theme", { cache: "no-store" }))
      .then((response) => response.json())
      .then((preference) => setTheme(preference.value === "light" ? "light" : "dark"))
      .catch(() => setTheme("dark"));
  }, []);
  useEffect(() => {
    const mobileBridge = (
      window as Window & {
        ReactNativeWebView?: { postMessage: (message: string) => void };
      }
    ).ReactNativeWebView;
    mobileBridge?.postMessage(
      JSON.stringify({ type: "agentic-os-ready", version: 1 }),
    );
  }, []);
  const note = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2400);
  };
  const changeTheme = async (next: "dark" | "light") => {
    setTheme(next);
    try {
      await fetch("/api/state/session", { method: "POST" });
      const response = await fetch("/api/state/preferences/theme", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next }),
      });
      if (!response.ok) throw new Error();
      note(`${next === "light" ? "Light" : "Dark"} Mode gemeinsam gespeichert`);
    } catch {
      note("Theme ist nur für diese Sitzung aktiv");
    }
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
  const title =
    v === "habits" ? "Heute" : nav.find((n) => n[0] === v)?.[1] || brand.name;
  return (
    <div className="os" data-theme={theme}>
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
          <button
            aria-label="Menü schließen"
            onClick={() => setMenu(false)}
            type="button"
          >
            <I.X />
          </button>
        </div>
        <nav>
          {navGroups.map(([group, items]) => (
            <div className="navGroup" key={group}>
              <small>{group}</small>
              {items.map(([id, n, Icon]: any[]) => (
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
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="privacy">
          <I.ShieldCheck />
          <span>
            <b>Lokal geschützt</b>
            <small>Lokaler Shared Store · Verbindungen im Health Center</small>
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
            type="button"
          >
            <I.Menu />
          </button>
          <div>
            <small>{new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", timeZone: "Europe/Berlin" }).format(new Date()).toUpperCase()}</small>
            <h1>{title}</h1>
          </div>
          <button
            aria-label="Wissen durchsuchen"
            className="search"
            onClick={() => navigate("brain")}
            type="button"
          >
            <I.Search />
            Suchen
          </button>
          <button
            aria-label={theme === "dark" ? "Light Mode aktivieren" : "Dark Mode aktivieren"}
            className="themeSwitch"
            onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            type="button"
          >
            {theme === "dark" ? <I.Sun /> : <I.Moon />}
          </button>
          <span className="avatar">E</span>
        </header>
        <section
          aria-label={title}
          className="content"
          ref={contentRef}
          tabIndex={-1}
        >
          {v === "home" && <Home go={navigate} vaultOnline={vaultOnline} />}{" "}
          {v === "areas" && <Areas go={navigate} />} {v === "faith" && <Faith />}
          {v === "career" && <Career />}
          {v === "finance" && <Finance />}
          {v === "health" && <Health />}
          {v === "relations" && <Relations />}
          {v === "projects" && <Projects note={note} />}
          {(v === "habits" || v === "journal") && (
            <DailyArea
              initialTab={v === "habits" ? "tasks" : "journal"}
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
              theme={theme}
              changeTheme={changeTheme}
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
          type="button"
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
const DemoBanner = ({ children = "Diese Kennzahlen sind Gestaltungsbeispiele – keine echten persönlichen Daten." }: any) => (
  <div className="demoBanner" role="note"><I.Info />{children}</div>
);
function Home({ go, vaultOnline }: any) {
  const { records: tasks, state: taskState } = useSharedRecords("tasks");
  const [calendarState, setCalendarState] = useState("loading");
  useEffect(() => {
    fetch("/api/calendar/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((status) =>
        setCalendarState(status.connected ? "online" : status.configured ? "offline" : "unconfigured"),
      )
      .catch(() => setCalendarState("offline"));
  }, []);
  const openTasks = tasks.filter((task: any) => !task.done && task.status !== "archived");
  return (
    <>
      <Intro eyebrow="DEIN SYSTEM AUF EINEN BLICK" title="Guten Abend, Emre.">
        <p>Was braucht heute wirklich deine Aufmerksamkeit?</p>
      </Intro>
      <DemoBanner>Nur die Kennzahlen auf den Lebensbereichskarten sind noch Gestaltungsbeispiele. Fokus, Aufgaben und Verbindungsstatus stammen aus echten Quellen.</DemoBanner>
      <div className="focusrow">
        <Card className="now">
          <div className="row">
            <Tag>NÄCHSTER KLARER SCHRITT</Tag>
            <span className="pulse">Gemeinsamer Datenkern</span>
          </div>
          <h3>{openTasks[0]?.title || "Noch keine Aufgabe priorisiert"}</h3>
          <p>{openTasks[0] ? `Bereich: ${openTasks[0].life_area || openTasks[0].area || "noch nicht zugeordnet"}` : "Erfasse eine konkrete Aufgabe; Agentic OS erfindet keine Priorität für dich."}</p>
          <Btn onClick={() => go("habits")}>
            Aufgaben öffnen <I.ArrowRight />
          </Btn>
        </Card>
        <Card className="day">
          <Tag>HEUTE · ECHTE QUELLEN</Tag>
          <div className="event"><I.CheckSquare /><span><b>{openTasks.length} offene Aufgaben</b><small>Laptop Shared Store</small></span></div>
          <div className="event"><I.CalendarDays /><span><b>Google Calendar · {calendarState}</b><small>Termine werden erst in der Kalenderansicht gelesen</small></span></div>
          <div className="event"><I.Network /><span><b>Obsidian · {vaultOnline ? "online" : "unconfigured"}</b><small>Read-only Wissensindex</small></span></div>
          <Btn soft onClick={() => go("integrations")}>Verbindungen prüfen</Btn>
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
          </button>
        ))}
      </div>
      <div className="homegrid">
        <Card>
          <div className="row">
            <Tag>PRIORITÄTEN</Tag>
            <b>{taskState === "online" ? `${openTasks.length} offen` : "Lädt …"}</b>
          </div>
          {openTasks.slice(0, 3).map((t: any) => (
            <div className="miniTask" key={t.id}>
              <i />
              <span>
                {t.title}
                <small>{t.life_area || "Ohne Bereich"}</small>
              </span>
            </div>
          ))}
          {taskState === "online" && openTasks.length === 0 && (
            <p className="muted">Noch keine gemeinsamen Aufgaben.</p>
          )}
        </Card>
        <Card>
          <Tag>SYSTEMSTATUS</Tag>
          {[
            ["Wochenplaner", "unconfigured"],
            ["Google Calendar", calendarState],
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
          <Tag>DATENWAHRHEIT</Tag>
          <h3>Keine erfundene Auslastung</h3>
          <p>Kapazität und Puffer erscheinen erst, wenn der Wochenplaner reale Kalender- und Aufgabendaten ausgewertet hat.</p>
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
      <DemoBanner>Bereichskarten und Kennzahlen sind Layoutbeispiele. Echte Daten erscheinen erst nach bewusster Erfassung oder Verbindung.</DemoBanner>
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
function Faith() {
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
      <DemoBanner>Gebetszeiten, Fortschritt und Duʿās sind respektvoll gekennzeichnete Beispielwerte. Es wurden keine persönlichen Glaubensdaten geladen.</DemoBanner>
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
          <button className="link" disabled title="Erfassung wird mit dem sicheren Wissens-Write-Flow verbunden">
            <I.Plus />
            Duʿā-Erfassung noch nicht verfügbar
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
      <DemoBanner>Ziele und Fortschrittswerte sind Beispiele. Projekte und gemeinsame Aufgaben sind die aktuell echten Datenquellen.</DemoBanner>
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
      <DemoBanner>Fitness-, Ernährungs- und Erholungswerte sind Beispiele; keine Health-Verbindung ist aktiv.</DemoBanner>
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
      <DemoBanner>Alle Beträge sind Beispieldaten. Es ist kein Konto verbunden und Agentic OS führt niemals Transaktionen aus.</DemoBanner>
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
      <DemoBanner>Personen, Termine und Kontaktimpulse sind Platzhalter. Es wurden keine privaten Beziehungsdaten geladen.</DemoBanner>
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
  const [view, setView] = useState("Board"),[showCreate,setShowCreate]=useState(false),[title,setTitle]=useState(''),[selected,setSelected]=useState<any>(null);
  const{records:p,state,create}=useSharedRecords('projects');
  const add=async()=>{try{await create({title,status:'active',goal:'Noch kein Ziel definiert'});setTitle('');setShowCreate(false)}catch(error){note(error instanceof Error?error.message:'Projekt konnte nicht gespeichert werden')}};
  return (
    <>
      <Intro
        eyebrow="FLEXIBLER PROJEKTRAUM"
        title="Vorhaben, die sich mit dir entwickeln."
        action={
          <Btn onClick={() => setShowCreate(true)}>
            <I.Plus />
            Projekt
          </Btn>
        }
      />
      {showCreate&&<Card className="inlineEditor"><label>Projektname<input value={title} onChange={event=>setTitle(event.target.value)} placeholder="Neues Projekt"/></label><Btn onClick={add}>Projekt speichern</Btn><button onClick={()=>setShowCreate(false)}>Abbrechen</button></Card>}
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
        <button disabled title="Filter folgt nach gemeinsamem Datenimport">
          <I.Filter />
          Filter
        </button>
      </div>
      {state==='loading'&&<p role="status">Gemeinsame Projekte werden geladen …</p>}
      {state==='online'&&p.length===0&&<Card><Tag>ECHTE DATENQUELLE · LEER</Tag><h3>Noch keine gemeinsamen Projekte</h3><p>Lege das erste Projekt an. Frühere Demo-Karten wurden entfernt.</p></Card>}
      {selected&&<Card className="projectDetail"><button onClick={()=>setSelected(null)}>← Zurück</button><Tag>{selected.status}</Tag><h2>{selected.title}</h2><p>{selected.goal||'Noch kein Ziel definiert'}</p><dl><dt>Datenquelle</dt><dd>Laptop Shared Store</dd><dt>Version</dt><dd>{selected.version}</dd><dt>Nächster Schritt</dt><dd>{selected.nextAction||'Noch nicht festgelegt'}</dd></dl></Card>}
      {!selected&&<div className="projects">
        {p.map((x:any, i:number) => (
          <button className="projectOpen" key={x.id} onClick={()=>setSelected(x)}><Card>
            <div className="row">
              <span className={"projectSymbol s" + i}>
                <I.FolderKanban />
              </span>
              <em>{x.status}</em>
            </div>
            <h3>{x.title}</h3>
            <p>{x.goal||'Noch kein Ziel definiert'}</p>
            <div className="projectmeta">
              <span>
                <I.CheckSquare />
                Nächste Aktion
              </span>
              <span>
                <I.MessagesSquare />
                Gemeinsamer Datensatz
              </span>
            </div>
            <div className="avatars">
              <i>WP</i>
              <i>PC</i>
              <span aria-label="Zuordnungen noch nicht konfiguriert">
                <I.Plus />
              </span>
            </div>
          </Card></button>
        ))}
      </div>}
    </>
  );
}
function DailyArea({ initialTab, text, setText, mood, setMood, note }: any) {
  const [tab, setTab] = useState<"tasks" | "journal">(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);
  return (
    <>
      <Intro
        eyebrow="DEIN TAG · GEMEINSAMER DATENKERN"
        title={new Intl.DateTimeFormat("de-DE", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          timeZone: "Europe/Berlin",
        }).format(new Date())}
      >
        <p>Aufgaben, Gewohnheiten und Reflexion an einem ruhigen Ort.</p>
      </Intro>
      <div className="dailyTabs" role="tablist" aria-label="Tagesbereich">
        <button
          aria-selected={tab === "tasks"}
          className={tab === "tasks" ? "active" : ""}
          onClick={() => setTab("tasks")}
          role="tab"
          type="button"
        >
          <I.ListChecks /> Aufgaben & Habits
        </button>
        <button
          aria-selected={tab === "journal"}
          className={tab === "journal" ? "active" : ""}
          onClick={() => setTab("journal")}
          role="tab"
          type="button"
        >
          <I.NotebookPen /> Journal
        </button>
      </div>
      {tab === "tasks" ? (
        <Habits embedded />
      ) : (
        <Journal
          embedded
          mood={mood}
          note={note}
          setMood={setMood}
          setText={setText}
          text={text}
        />
      )}
    </>
  );
}
function Habits({ embedded = false }: { embedded?: boolean }) {
  const [taskText, setTaskText] = useState("");
  const [habitText, setHabitText] = useState("");
  const [error, setError] = useState("");
  const {
    records: tasks,
    state: taskState,
    create: createTask,
    update: updateTask,
  } = useSharedRecords("tasks");
  const {
    records: habits,
    state: habitState,
    create: createHabit,
    update: updateHabit,
  } = useSharedRecords("habits");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
  }).format(new Date());
  const addTask = async () => {
    const title = taskText.trim();
    if (title.length < 2) return setError("Aufgabe benötigt mindestens 2 Zeichen");
    try {
      await createTask({ title, status: "active", area: "Inbox", done: false });
      setTaskText("");
      setError("");
    } catch {
      setError("Aufgabe konnte nicht gespeichert werden");
    }
  };
  const addHabit = async () => {
    const title = habitText.trim();
    if (title.length < 2) return setError("Habit benötigt mindestens 2 Zeichen");
    try {
      await createHabit({ title, status: "active", cadence: "daily", completedOn: [] });
      setHabitText("");
      setError("");
    } catch {
      setError("Habit konnte nicht gespeichert werden");
    }
  };
  const toggleHabit = async (habit: any) => {
    const completedOn = Array.isArray(habit.completedOn) ? habit.completedOn : [];
    await updateHabit({
      ...habit,
      completedOn: completedOn.includes(today)
        ? completedOn.filter((date: string) => date !== today)
        : [...completedOn, today].slice(-90),
    });
  };
  const completedHabits = habits.filter((habit: any) =>
    Array.isArray(habit.completedOn) && habit.completedOn.includes(today),
  ).length;
  const openTasks = tasks.filter((task: any) => !task.done).length;
  return (
    <>
      {!embedded && (
        <Intro eyebrow="KLARHEIT STATT DRUCK" title="Aufgaben & Habits.">
          <p>Kein Punktesystem. Nur ein ehrlicher Blick auf das, was trägt.</p>
        </Intro>
      )}
      <div className="habitgrid">
        <Card>
          <div className="row">
            <Tag>HABITS · GEMEINSAMER SERVERZUSTAND</Tag>
            <b>{completedHabits}/{habits.length} heute</b>
          </div>
          <div className="taskadd">
            <input
              aria-label="Neues Habit"
              onChange={(event) => setHabitText(event.target.value)}
              placeholder="Neues tägliches Habit …"
              value={habitText}
            />
            <button aria-label="Habit hinzufügen" onClick={addHabit} type="button">
              <I.Plus />
            </button>
          </div>
          {habitState === "loading" && <p role="status">Habits werden geladen …</p>}
          {habitState === "error" && <p role="alert">Gemeinsame Habits sind gerade nicht erreichbar.</p>}
          {habitState === "online" && habits.length === 0 && (
            <p>Noch keine Habits erfasst. Es werden keine Routinen vorgegeben.</p>
          )}
          {habits.map((habit: any) => (
            <button
              aria-pressed={Array.isArray(habit.completedOn) && habit.completedOn.includes(today)}
              className="taskrow"
              key={habit.id}
              onClick={() => toggleHabit(habit)}
              type="button"
            >
              <i className={habit.completedOn?.includes(today) ? "done" : ""}>
                {habit.completedOn?.includes(today) && <I.Check />}
              </i>
              <span>
                {habit.title}
                <small>{habit.cadence === "daily" ? "Täglich" : habit.cadence}</small>
              </span>
            </button>
          ))}
        </Card>
        <Card>
          <Tag>AUFGABEN · GEMEINSAMER SERVERZUSTAND</Tag>
          <div className="taskadd">
            <input
              aria-label="Neue Aufgabe"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Neue Aufgabe …"
            />
            <button aria-label="Aufgabe hinzufügen" onClick={addTask} type="button">
              <I.Plus />
            </button>
          </div>
          {taskState === "loading" && <p role="status">Aufgaben werden geladen …</p>}
          {taskState === "error" && <p role="alert">Gemeinsame Aufgaben sind gerade nicht erreichbar.</p>}
          {taskState === "online" && tasks.length === 0 && <p>Noch keine gemeinsamen Aufgaben.</p>}
          {tasks.map((t: any) => (
            <button
              className="taskrow"
              onClick={() => updateTask({ ...t, done: !t.done })}
              key={t.id}
              type="button"
            >
              <i className={t.done ? "done" : ""}>{t.done && <I.Check />}</i>
              <span className={t.done ? "strike" : ""}>
                {t.title}
                <small>{t.area}</small>
              </span>
            </button>
          ))}
        </Card>
        <Card>
          <Tag>HEUTIGER ÜBERBLICK · ECHTE DATEN</Tag>
          <h3>{openTasks} offene Aufgaben</h3>
          <p>{completedHabits} von {habits.length} Habits heute markiert.</p>
          <p>Kein verlorener Streak und keine erfundete Serie. Morgen ist ein neuer Tag.</p>
          {error && <p role="alert">{error}</p>}
        </Card>
      </div>
    </>
  );
}
function Journal({ text, setText, mood, setMood, note, embedded = false }: any) {
  const { records: entries, create } = useSharedRecords("journal_metadata");
  const [energy, setEnergy] = useState(3);
  const insertPrompt = (prompt: string) => {
    const separator = text.trim() ? "\n\n" : "";
    setText(`${text}${separator}${prompt}\n`);
  };
  return (
    <>
      {!embedded && (
        <Intro eyebrow="TAGESJOURNAL" title={new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", timeZone: "Europe/Berlin" }).format(new Date())}>
          <p>Ein ruhiger Ort für das, was war und was bleiben darf.</p>
        </Intro>
      )}
      <div className="journalgrid">
        <Card className="editor">
          <div className="row">
            <Tag>REFLEXION</Tag>
            <span>Entwurf auf diesem Gerät · Abschluss verschlüsselt im gemeinsamen Store</span>
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
          <Btn onClick={async () => {await create({title:`Journal ${new Date().toISOString().slice(0,10)}`,entryDate:new Date().toISOString().slice(0,10),mood,energy,text,status:'active'});setText('');note("Journal-Metadaten gemeinsam gespeichert · Textfeld verschlüsselt")}}>
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
            Energie · {energy}/5 <input type="range" min="1" max="5" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} />
          </label>
          <div className="linked">
            <Tag>VERKNÜPFUNGSVORSCHAU · BEISPIEL</Tag>
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
          {entries.length===0&&<p>Noch keine gemeinsamen Journaleinträge.</p>}
          {entries.map((x:any)=><div className="history" key={x.id}><span>{x.entryDate} · {x.mood||'ohne Stimmung'}</span><small>Text verschlüsselt · Detailansicht folgt</small></div>)}
        </Card>
      </div>
    </>
  );
}
function Agents({ note }: any) {
  const{records,state,create,update}=useSharedRecords('agents');const[editing,setEditing]=useState<any>(null),[name,setName]=useState('');
  const save=async()=>{try{if(editing?.id)await update({...editing,name,title:name});else await create({name,title:name,status:'planned',areas:[],providerMode:'subscription'});setEditing(null);setName('')}catch(error){note(error instanceof Error?error.message:'Agent konnte nicht gespeichert werden')}};
  return (
    <>
      <Intro
        eyebrow="AGENTEN SIND DIENSTE"
        title="Dein koordiniertes Agenten-Team."
        action={
          <Btn onClick={() => {setEditing({});setName('')}}>
            <I.Plus />
            Agent
          </Btn>
        }
      />
      <div className="agentSummary"><span><i className={state==='online'?'online':'unconfigured'}/>{records.length} persistent erfasst</span><span><i className="unconfigured"/>Ausführung nur nach echter Provider-Konfiguration</span></div>
      {editing&&<Card className="inlineEditor"><Tag>AGENT-KONFIGURATOR</Tag><label>Name<input value={name} onChange={event=>setName(event.target.value)} placeholder="Agentname"/></label><p>Neue Agenten starten als „geplant“. Es wird keine Ausführbarkeit behauptet.</p><Btn onClick={save}>Konfiguration speichern</Btn><button onClick={()=>setEditing(null)}>Abbrechen</button></Card>}
      {state==='online'&&records.length===0&&<Card><Tag>ECHTE DATENQUELLE · LEER</Tag><h3>Noch keine Agenten konfiguriert</h3><p>Die früheren Statusbehauptungen wurden entfernt.</p></Card>}
      <div className="agents">
        {records.map((a: any) => (
          <Card key={a.id}>
            <div className="row">
              <span className="agentIcon">
                <I.Bot />
              </span>
              <i className="badge unconfigured">{a.status}</i>
            </div>
            <h3>{a.name||a.title}</h3>
            <p>{a.purpose||'Zweck noch nicht beschrieben'}</p>
            <div className="chips">
              {(a.areas||[]).map((x: string) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            <label>
              Modell
              <select
                value={a.providerMode||'subscription'}
                onChange={(e) => update({...a,providerMode:e.target.value})}
              >
                <option value="subscription">ChatGPT Companion</option>
                <option value="api" disabled>OpenAI API · nicht konfiguriert</option>
                <option value="local" disabled>Lokales Modell · nicht verifiziert</option>
              </select>
            </label>
            <div className="activity">
              <I.Activity />
              <span>
                Metadaten persistent<small>Keine Ausführung verbunden</small>
              </span>
            </div>
            <button onClick={() => {setEditing(a);setName(a.name||a.title)}}>
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
    [category, setCategory] = useState("Alle"),[editing,setEditing]=useState<any>(null),[name,setName]=useState('');
  const{records,state,create,update}=useSharedRecords('skills');
  const list = records.filter(
    (x) =>
      JSON.stringify(x).toLowerCase().includes(q.toLowerCase()) &&
      (category === "Alle" || String(x.category||'').toLowerCase().includes(category.toLowerCase())),
  );
  const save=async()=>{if(editing?.id)await update({...editing,name,title:name});else await create({name,title:name,status:'metadata_only',category:'Allgemein'});setEditing(null);setName('')};
  return (
    <>
      <Intro
        eyebrow="WIEDERVERWENDBARE WORKFLOWS"
        title="Skills, die dein System tragen."
        action={<Btn onClick={()=>{setEditing({});setName('')}}><I.Plus/>Skill</Btn>}
      />
      {editing&&<Card className="inlineEditor"><Tag>SKILL-METADATEN</Tag><label>Name<input value={name} onChange={event=>setName(event.target.value)} placeholder="Skillname"/></label><p>Ein gespeicherter Skill ist zunächst nur Metadaten – nicht automatisch ausführbar.</p><Btn onClick={save}>Skill speichern</Btn><button onClick={()=>setEditing(null)}>Abbrechen</button></Card>}
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
      {state==='online'&&records.length===0&&<Card><Tag>ECHTE DATENQUELLE · LEER</Tag><h3>Noch keine Skills erfasst</h3><p>„Bereit“ wird erst nach einer verifizierten ausführbaren Implementierung angezeigt.</p></Card>}
      <div className="skilltable">
        <div>
          <b>Skill</b>
          <b>Kategorie</b>
          <b>Agent</b>
          <b>Status</b>
        </div>
        {list.map((x:any, i:number) => (
          <button className="skillRecord" key={x.id} onClick={()=>{setEditing(x);setName(x.name||x.title)}}>
            <span>
              <i>{i + 1}</i>
              <b>{x.name||x.title}</b>
            </span>
            <span>{x.category||'Allgemein'}</span>
            <span>{x.agent||'Nicht zugewiesen'}</span>
            <em>Nur Metadaten</em>
          </button>
        ))}
      </div>
    </>
  );
}
function Chats({ note }: any) {
  const [summary, setSummary] = useState("");
  const { records: captures, state, create } = useSharedRecords("inbox_items");
  const saveSummary = async () => {
    const value = summary.trim();
    if (value.length < 2) return note("Bitte zuerst eine ausgewählte Zusammenfassung einfügen");
    await create({ title: value.slice(0, 120), content: value, itemType: "ChatGPT-Zusammenfassung", status: "active", source: "manual-companion-import" });
    setSummary("");
    note("Ausgewählte Zusammenfassung im gemeinsamen Eingang gespeichert");
  };
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
      <div className="chatlayout companionLayout">
        <Card className="chatbox companionCapture">
          <Tag>BEWUSSTE ÜBERNAHME · KEIN SCRAPING</Tag>
          <h3>Eine ausgewählte ChatGPT-Zusammenfassung erfassen</h3>
          <p>Füge nur den Inhalt ein, den Agentic OS dauerhaft strukturieren darf. Es gibt keinen automatischen Zugriff auf deinen Chatverlauf.</p>
          <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Zusammenfassung oder nächste Schritte aus ChatGPT …" />
          <Btn onClick={saveSummary}>In gemeinsamen Eingang übernehmen</Btn>
          <small className="mockline"><I.Shield />Manueller Import · lokal gespeichert · {state === "online" ? `${captures.filter((item: any) => item.itemType === "ChatGPT-Zusammenfassung").length} erfasst` : "Store nicht erreichbar"}</small>
        </Card>
        <Card className="modelcard">
          <Tag>OPENAI API · OPTIONAL · NUTZUNGSBASIERT</Tag>
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
          <span className="connectionNote">Aktivierung bleibt gesperrt, bis Kostenlimit und ausdrückliche Freigabe vorliegen.</span>
        </Card>
      </div>
    </>
  );
}
function Inbox({ note }: any) {
  const [type, setType] = useState("Idee"),
    [txt, setTxt] = useState("");
  const { records: entries, state, create, update } = useSharedRecords("inbox_items");
  const capture = async () => {
    const value = txt.trim();
    if (!value) return;
    await create({ title: value, itemType: type.toLowerCase(), status: "active", area: "Inbox" });
    setTxt("");
    note(`${type} im gemeinsamen Eingang gespeichert`);
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
      {state === "online" && entries.length === 0 && (
        <Card><Tag>ECHTE DATENQUELLE · LEER</Tag><h3>Dein Eingang ist leer</h3><p>Neue Einträge erscheinen in Desktop und iPhone.</p></Card>
      )}
      <div className="inboxlist">
        {entries.map((x: any) => (
          <Card key={x.id}>
            <i />
            <span>
              <b>{x.title}</b>
              <small>
                {x.itemType || "Notiz"} · {x.area || "Inbox"}
              </small>
            </span>
            <button onClick={() => update({ ...x, status: "planned" })}>
              Als geprüft markieren <I.Check />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
function Integrations({ note }: any) {
  const [liveCalendars, setLiveCalendars] = useState<any[]>([]),
    [selectedCalendars, setSelectedCalendars] = useState<string[]>([]),
    [calendarRead, setCalendarRead] = useState<any>({ state: "idle", events: [] }),
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
      .then((data) => {
        const calendars = data.calendars || [];
        setLiveCalendars(calendars);
        setSelectedCalendars(
          calendars.filter((calendar: any) => calendar.selected).slice(0, 6).map((calendar: any) => calendar.id),
        );
      })
      .catch(() => setLiveCalendars([]));
  }, []);
  const readWeek = async () => {
    if (!selectedCalendars.length) return note("Bitte mindestens einen Kalender auswählen");
    setCalendarRead({ state: "loading", events: [] });
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 8);
    const query = new URLSearchParams({ start: start.toISOString(), end: end.toISOString() });
    selectedCalendars.forEach((id) => query.append("calendar", id));
    const response = await fetch(`/api/calendar/events?${query}`, { cache: "no-store" });
    const result = await response.json();
    setCalendarRead(response.ok ? { state: "online", ...result } : { state: "error", events: [], error: result.error || "Lesen fehlgeschlagen" });
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
            {liveCalendars.map((calendar) => (
              <label key={calendar.id}>
                <input
                  checked={selectedCalendars.includes(calendar.id)}
                  onChange={() => setSelectedCalendars((current) => current.includes(calendar.id) ? current.filter((id) => id !== calendar.id) : [...current, calendar.id])}
                  type="checkbox"
                />
                {calendar.summary} · {calendar.writable ? "schreibbar" : "nur lesen"}
              </label>
            ))}
            <Btn soft onClick={calendarStatus.connected && calendarRead.state !== "loading" ? readWeek : undefined}>
              Nächste 8 Tage lesen
            </Btn>
          </div>
          <div>
            <b>2 · Begrenzter Abruf</b>
            <p>
              {calendarRead.state === "online"
                ? `${calendarRead.events.length} Termine · ${calendarRead.label} · maximal 8 Tage`
                : calendarRead.state === "loading" ? "Kalender werden gelesen …" : calendarRead.error || "Noch keine Daten gelesen"}
            </p>
          </div>
          <div>
            <b>3 · Schreibschutz</b>
            <p>Kein Write vorbereitet. Erst ein konkreter Vorschlag erzeugt eine einzeln freizugebende Aktion.</p>
          </div>
        </div>
        <small>
          <I.ShieldCheck />
          Keine Hintergrundwrites. Create/Update nur nach exakter Einzelvorschau und Bestätigung; Duplikatschutz + Audit aktiv. Deletes bleiben deaktiviert.
        </small>
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
          ["Health", "Training", "unconfigured", "Keine Datenquelle"],
          ["Finance", "Konten", "unconfigured", "Read-only only"],
          ["Tailscale", "Privater Fernzugriff", "offline", "Einrichtung vorhanden · Laufzeitstatus hier nicht verifiziert"],
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
            <span className="connectionNote">Keine weitere Aktion in dieser Ansicht</span>
          </Card>
        ))}
      </div>
    </>
  );
}
function Brain() {
  const [vault, setVault] = useState<any>({ status: "loading" });
  const [audit, setAudit] = useState<any>({ status: "loading", entries: [] });
  const loadVault = useCallback(async () => {
    setVault((current: any) => ({ ...current, status: "loading" }));
    try {
      const response = await fetch("/api/obsidian/status", { cache: "no-store" });
      setVault(await response.json());
    } catch {
      setVault({ status: "degraded", error: "Lokaler Vault-Index nicht erreichbar" });
    }
  }, []);
  const loadAudit = useCallback(async () => {
    setAudit((current: any) => ({ ...current, status: "loading" }));
    try {
      await fetch("/api/state/session", { method: "POST" });
      const response = await fetch("/api/state/audit", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setAudit({ status: "online", entries: result.entries || [] });
    } catch {
      setAudit({ status: "error", entries: [] });
    }
  }, []);
  useEffect(() => {
    void loadVault();
    void loadAudit();
  }, [loadAudit, loadVault]);

  const connected = vault.status === "online";
  const graphNodes = connected
    ? [
        ...new Set(
          (vault.relationships || [])
            .filter((item: any) => !item.sensitive)
            .flatMap((item: any) => [item.source, item.target]),
        ),
      ].slice(0, 7)
    : [];
  const auditLabels: Record<string, string> = {
    archive: "Eintrag archiviert",
    create: "Eintrag erstellt",
    "preference.update": "Einstellung aktualisiert",
    update: "Eintrag aktualisiert",
  };
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
            {graphNodes.map((x: any, i) => (
              <i className={"node n" + i} key={x}>
                {x}
              </i>
            ))}
            {graphNodes.length === 0 && (
              <p>Graphknoten erscheinen nur aus dem echten read-only Vault-Index.</p>
            )}
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
          <Tag>SYSTEMREGELN · PLANER-KONFIGURATION</Tag>
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
          <Tag>AUDIT · GEMEINSAMER SERVERZUSTAND</Tag>
          {audit.status === "loading" && <p role="status">Audit wird geladen …</p>}
          {audit.status === "error" && <p role="alert">Audit ist gerade nicht erreichbar.</p>}
          {audit.status === "online" && audit.entries.length === 0 && <p>Noch keine gemeinsamen Aktionen protokolliert.</p>}
          {audit.entries.map((entry: any, index: number) => (
            <div className="audit" key={`${entry.createdAt}-${index}`}>
              <I.History />
              <span>
                <b>{auditLabels[entry.action] || entry.action}</b>
                <small>
                  {entry.entityType} · {new Intl.DateTimeFormat("de-DE", {
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "2-digit",
                    timeZone: "Europe/Berlin",
                  }).format(new Date(entry.createdAt))}
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
function Settings({ brand, save, theme, changeTheme }: any) {
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
          <Tag>DARSTELLUNG · GEMEINSAM</Tag>
          <h3>Light & Dark Mode</h3>
          <p>Die Auswahl liegt im privaten Shared Store und gilt für Desktop und iPhone.</p>
          <div className="themeChoices" role="group" aria-label="Farbschema">
            <button aria-pressed={theme === "dark"} onClick={() => changeTheme("dark")}><I.Moon /> Dark</button>
            <button aria-pressed={theme === "light"} onClick={() => changeTheme("light")}><I.Sun /> Light</button>
          </div>
        </Card>
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
        <button
          aria-current={v === id ? "page" : undefined}
          aria-label={n}
          className={v === id ? "active" : ""}
          onClick={() => go(id)}
          key={id}
          type="button"
        >
          <Icon />
          <span>{n}</span>
        </button>
      ))}
    </div>
  );
}
