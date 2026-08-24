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
  | "weekly"
  | "inbox"
  | "chat"
  | "integrations"
  | "brain"
  | "settings";
const areas = [
  ["faith", "Glaube", "#a887d4", "Private gemeinsame Einträge", I.MoonStar],
  [
    "career",
    "Karriere",
    "#df9a52",
    "Angestellt und Selbstständigkeit",
    I.BriefcaseBusiness,
  ],
  [
    "health",
    "Gesundheit",
    "#5fae8d",
    "Training, Erholung und Messwerte",
    I.HeartPulse,
  ],
  [
    "finance",
    "Finanzen",
    "#6098c8",
    "Manuell, privat und ohne Transaktionen",
    I.WalletCards,
  ],
  [
    "relations",
    "Beziehungen",
    "#dc7f91",
    "Menschen und Kontaktpflege",
    I.UsersRound,
  ],
  ["projects", "Projekte", "#d1a33c", "Gemeinsame Daten öffnen", I.LayoutGrid],
] as const;
const navGroups: any[] = [
  ["FOKUS", [
    ["home", "Kommando", I.Gauge],
    ["inbox", "Inbox", I.Inbox],
    ["journal", "Heute", I.NotebookPen],
    ["weekly", "Wochenplanung", I.CalendarRange],
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
  const archive=async(id:string)=>{const response=await fetch(`/api/state/records/${kind}?id=${encodeURIComponent(id)}`,{method:'DELETE'});const result=await response.json();if(!response.ok)throw new Error(result.error||'Archivieren fehlgeschlagen');await load();return result};
  return{records,state,create,update,archive,reload:load};
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
          {v === "areas" && <Areas go={navigate} />} {v === "faith" && <Faith note={note} />}
          {v === "career" && <Career note={note} />}
          {v === "finance" && <Finance note={note} />}
          {v === "health" && <Health note={note} />}
          {v === "relations" && <Relations note={note} />}
          {v === "projects" && <Projects note={note} />}
          {v === "weekly" && <WeeklyPlanner note={note} />}
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
          {v === "skills" && <Skills note={note} />}
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
function Home({ go, vaultOnline }: any) {
  const { records: tasks, state: taskState } = useSharedRecords("tasks");
  const [calendarState, setCalendarState] = useState("loading");
  const [plannerState, setPlannerState] = useState<any>({ state: "loading", plan: null });
  useEffect(() => {
    fetch("/api/calendar/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((status) =>
        setCalendarState(status.connected ? "online" : status.configured ? "offline" : "unconfigured"),
      )
      .catch(() => setCalendarState("offline"));
    fetch("/api/state/session", { method: "POST" })
      .then(() => fetch("/api/planner", { cache: "no-store" }))
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => setPlannerState({ state: ok ? (data.plan ? "online" : "unconfigured") : "offline", plan: data.plan || null }))
      .catch(() => setPlannerState({ state: "offline", plan: null }));
  }, []);
  const openTasks = tasks.filter((task: any) => !task.done && task.status !== "archived");
  return (
    <>
      <Intro eyebrow="DEIN SYSTEM AUF EINEN BLICK" title="Guten Abend, Emre.">
        <p>Was braucht heute wirklich deine Aufmerksamkeit?</p>
      </Intro>
      <p className="sourceLine"><I.Database /> Fokus, Aufgaben, Bereichszähler und Verbindungsstatus stammen aus gemeinsamen oder verifizierten Quellen.</p>
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
            ["Wochenplaner", plannerState.state],
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
          <Tag>WOCHENKAPAZITÄT · ECHTE QUELLEN</Tag>
          <h3>{plannerState.plan ? `${plannerState.plan.capacity.bufferPercent}% Puffer geschützt` : "Keine erfundene Auslastung"}</h3>
          <p>{plannerState.plan ? `${plannerState.plan.sourceEvidence.eventCount} Kalenderereignisse und ${plannerState.plan.outcomes.length} Outcomes im letzten Vorschlag · 0 Hintergrundwrites.` : "Kapazität und Puffer erscheinen erst, wenn der Wochenplaner reale Kalender- und Aufgabendaten ausgewertet hat."}</p>
          <Btn soft onClick={() => go("weekly")}>Wochenplanung öffnen</Btn>
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
  const { records, state } = useSharedRecords("area_records");
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
      <p className="sourceLine" role="status">
        <I.Database /> {state === "online" ? "Gemeinsamer privater Datenkern" : state === "loading" ? "Bereichsdaten werden geladen …" : "Bereichsdaten derzeit nicht erreichbar"}
      </p>
      <div className="area-grid">
        {areas.map(([id, n, c, s, Icon], i) => {
          const count = id === "projects" ? null : records.filter((record: any) => record.area === id).length;
          return (
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
            <p className="areaCount">{count === null ? "Eigenständiger Projektbereich" : `${count} gemeinsame Einträge`}</p>
            <button onClick={() => go(id as View)}>
              Dashboard öffnen <I.ArrowRight />
            </button>
          </Card>
          );
        })}
      </div>
    </>
  );
}
type AreaRecordConfig = {
  area: "faith" | "career" | "health" | "finance" | "relations";
  className: string;
  eyebrow: string;
  title: string;
  description: string;
  privacy: string;
  types: Array<[string, string]>;
  tracks?: Array<[string, string]>;
};
const areaRecordConfigs: Record<AreaRecordConfig["area"], AreaRecordConfig> = {
  faith: {
    area: "faith",
    className: "faithDomain",
    eyebrow: "GLAUBE · PERSÖNLICHE PRAXIS",
    title: "Im Rhythmus des Tages.",
    description: "Gebete, Qurʾān, Duʿās und Reflexionen selbstbestimmt festhalten.",
    privacy: "Privat und organisatorisch. Keine religiöse Autorität und keine automatische Standortabfrage.",
    types: [["practice", "Praxis / Gebet"], ["quran", "Qurʾān"], ["dua", "Duʿā"], ["reflection", "Reflexion"]],
  },
  health: {
    area: "health",
    className: "healthDomain",
    eyebrow: "GESUNDHEIT · ORGANISATORISCH",
    title: "Stärker werden. Gut regenerieren.",
    description: "Eigene Trainings-, Ernährungs- und Erholungsdaten ohne Druck ordnen.",
    privacy: "Private Organisationshilfe, keine medizinische Diagnose oder Beratung. Keine Health-Verbindung aktiv.",
    types: [["training", "Training"], ["nutrition", "Ernährung"], ["recovery", "Erholung"], ["measurement", "Messwert"]],
  },
  finance: {
    area: "finance",
    className: "financeDomain",
    eyebrow: "FINANZEN · PRIVATE DATEN",
    title: "Klarheit ohne Aktionismus.",
    description: "Kontenrahmen, Budgets, Ziele und wiederkehrende Posten manuell ordnen.",
    privacy: "Lokal verschlüsselte Inhaltsfelder. Keine Bank verbunden und niemals Finanztransaktionen.",
    types: [["account", "Konto / Container"], ["income", "Einnahme"], ["expense", "Ausgabe"], ["budget", "Budget"], ["goal", "Sparziel"], ["recurring", "Wiederkehrend"]],
  },
  relations: {
    area: "relations",
    className: "relationDomain",
    eyebrow: "BEZIEHUNGEN · PRIVAT",
    title: "Menschen, die dein Leben tragen.",
    description: "Menschen, Kontaktpflege und wichtige Daten bewusst festhalten.",
    privacy: "Private Details werden erst in der gewählten Detailansicht gezeigt und nicht in Logs geschrieben.",
    types: [["person", "Person"], ["contact", "Kontakt"], ["birthday", "Geburtstag"], ["follow_up", "Nächster Impuls"], ["note", "Notiz"]],
  },
  career: {
    area: "career",
    className: "careerDomain",
    eyebrow: "KARRIERE",
    title: "Stabilität heute. Freiheit morgen.",
    description: "Angestelltenweg und Selbstständigkeit getrennt planen, gemeinsam überblicken.",
    privacy: "Eigene Karriereplanung im gemeinsamen privaten Datenkern; keine externe Bewerbung oder Nachricht wird versendet.",
    types: [["goal", "Ziel"], ["task", "Aufgabe"], ["learning", "Lernen"], ["opportunity", "Chance"], ["milestone", "Meilenstein"], ["document", "Dokumenthinweis"]],
    tracks: [["employee", "Angestellt"], ["business", "Selbstständigkeit"]],
  },
};

function AreaRecordWorkspace({ config, note }: { config: AreaRecordConfig; note: (message: string) => void }) {
  const { records: allRecords, state, create, update, archive } = useSharedRecords("area_records");
  const records = allRecords.filter((record: any) => record.area === config.area);
  const emptyForm = () => ({ title: "", recordType: config.types[0][0], status: "active", details: "", date: "", amount: "", currency: "EUR", track: config.tracks?.[0][0] || "" });
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const typeLabel = (value: string) => config.types.find(([id]) => id === value)?.[1] || value;
  const trackLabel = (value: string) => config.tracks?.find(([id]) => id === value)?.[1] || value;
  const openCreate = (track?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm(), track: track || config.tracks?.[0][0] || "" });
    setEditorOpen(true);
  };
  const openEdit = (record: any) => {
    setEditingId(record.id);
    setForm({ ...emptyForm(), ...record });
    setEditorOpen(true);
  };
  const save = async () => {
    try {
      const payload = { ...form, area: config.area };
      if (editingId) await update({ ...payload, id: editingId });
      else await create(payload);
      setEditorOpen(false);
      setEditingId(null);
      setSelected(null);
      note(editingId ? "Eintrag aktualisiert" : "Eintrag gemeinsam gespeichert");
    } catch (error) {
      note(error instanceof Error ? error.message : "Eintrag konnte nicht gespeichert werden");
    }
  };
  const archiveSelected = async () => {
    if (!selected || !window.confirm(`„${selected.title}“ archivieren?`)) return;
    try {
      await archive(selected.id);
      setSelected(null);
      note("Eintrag archiviert");
    } catch {
      note("Eintrag konnte nicht archiviert werden");
    }
  };
  const renderRecord = (record: any) => (
    <button className="areaRecordCard" key={record.id} onClick={() => setSelected(record)} type="button">
      <span><Tag>{typeLabel(record.recordType)}</Tag><i>{record.status}</i></span>
      <b>{record.title}</b>
      <small>{record.date || "Kein Datum"}</small>
    </button>
  );
  return (
    <div className={`domain ${config.className}`}>
      <Intro eyebrow={config.eyebrow} title={config.title} action={<Btn onClick={() => openCreate()}><I.Plus /> Eintrag</Btn>}>
        <p>{config.description}</p>
      </Intro>
      <p className="privacyBoundary"><I.ShieldCheck /> {config.privacy}</p>
      {editorOpen && (
        <Card className="areaRecordEditor">
          <div className="row"><Tag>{editingId ? "EINTRAG BEARBEITEN" : "NEUER EINTRAG"}</Tag><button aria-label="Editor schließen" onClick={() => setEditorOpen(false)} type="button"><I.X /></button></div>
          <div className="areaFormGrid">
            <label>Titel<input autoFocus maxLength={120} onChange={(event) => setForm({ ...form, title: event.target.value })} value={form.title} /></label>
            <label>Typ<select onChange={(event) => setForm({ ...form, recordType: event.target.value })} value={form.recordType}>{config.types.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            {config.tracks && <label>Karrierepfad<select onChange={(event) => setForm({ ...form, track: event.target.value })} value={form.track}>{config.tracks.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
            <label>Status<select onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}><option value="active">Aktiv</option><option value="planned">Geplant</option><option value="paused">Pausiert</option></select></label>
            <label>Datum (optional)<input onChange={(event) => setForm({ ...form, date: event.target.value })} type="date" value={form.date} /></label>
            {config.area === "finance" && <><label>Betrag (optional)<input inputMode="decimal" onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0,00" value={form.amount} /></label><label>Währung<select onChange={(event) => setForm({ ...form, currency: event.target.value })} value={form.currency}><option value="EUR">EUR</option><option value="USD">USD</option></select></label></>}
          </div>
          <label>Details (privat verschlüsselt)<textarea maxLength={4000} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="Nur das festhalten, was dir wirklich hilft …" value={form.details} /></label>
          <div className="editorActions"><Btn onClick={save}>Speichern</Btn><button onClick={() => setEditorOpen(false)} type="button">Abbrechen</button></div>
        </Card>
      )}
      {state === "loading" && <p role="status">Gemeinsame Bereichsdaten werden geladen …</p>}
      {state === "error" && <Card><Tag>OFFLINE</Tag><h3>Gemeinsamer Datenkern nicht erreichbar</h3><p>Es werden keine Ersatz- oder Beispieldaten angezeigt.</p></Card>}
      {state === "online" && records.length === 0 && <Card className="trueEmpty"><I.Database /><div><Tag>ECHTE DATENQUELLE · LEER</Tag><h3>Noch keine Einträge</h3><p>Lege nur an, was für diesen Bereich tatsächlich nützlich ist.</p></div><Btn onClick={() => openCreate()}><I.Plus /> Ersten Eintrag anlegen</Btn></Card>}
      {selected && (
        <Card className="areaRecordDetail">
          <button className="backButton" onClick={() => setSelected(null)} type="button">← Übersicht</button>
          <div className="row"><Tag>{typeLabel(selected.recordType)}</Tag><i className="badge unconfigured">{selected.status}</i></div>
          <h2>{selected.title}</h2>
          {selected.track && <p><b>Pfad:</b> {trackLabel(selected.track)}</p>}
          {selected.date && <p><b>Datum:</b> {selected.date}</p>}
          {selected.amount && <p><b>Betrag:</b> {selected.amount} {selected.currency}</p>}
          <p className="recordDetails">{selected.details || "Keine privaten Details hinterlegt."}</p>
          <small>Gemeinsamer privater Datensatz · Version {selected.version}</small>
          <div className="editorActions"><Btn onClick={() => openEdit(selected)}>Bearbeiten</Btn><button className="dangerQuiet" onClick={archiveSelected} type="button">Archivieren</button></div>
        </Card>
      )}
      {!selected && config.tracks ? (
        <div className="careerRecordsSplit">
          {config.tracks.map(([track, label]) => <section key={track}><div className="pathTitle"><span>{track === "employee" ? <I.Building2 /> : <I.Rocket />}</span><div><Tag>{label.toUpperCase()}</Tag><h3>{records.filter((record: any) => record.track === track).length} Einträge</h3></div><button onClick={() => openCreate(track)} type="button"><I.Plus /></button></div><div className="areaRecordGrid">{records.filter((record: any) => record.track === track).map(renderRecord)}</div>{records.every((record: any) => record.track !== track) && <p className="columnEmpty">Noch keine Einträge für diesen Pfad.</p>}</section>)}
        </div>
      ) : !selected && records.length > 0 ? <div className="areaRecordGrid">{records.map(renderRecord)}</div> : null}
    </div>
  );
}
function Faith({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.faith} note={note} />; }
function Career({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.career} note={note} />; }
function Health({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.health} note={note} />; }
function Finance({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.finance} note={note} />; }
function Relations({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.relations} note={note} />; }
function Projects({ note }: any) {
  const [view, setView] = useState<"grid" | "list">("grid"), [showCreate, setShowCreate] = useState(false), [selectedId, setSelectedId] = useState(""), [tab, setTab] = useState<"overview" | "tasks" | "inbox" | "history">("overview"), [workspace, setWorkspace] = useState<any>(null), [workspaceState, setWorkspaceState] = useState<"idle" | "loading" | "online" | "error">("idle"), [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any>({ title: "", goal: "", description: "", nextAction: "", dueDate: "", status: "planned" }), [taskDraft, setTaskDraft] = useState({ title: "", dueAt: "", priority: "medium" }), [inboxDraft, setInboxDraft] = useState("");
  const { records: projects, state, create: createProject, update: updateProject } = useSharedRecords("projects");
  const { records: tasks, state: taskState, create: createTask, update: updateTask } = useSharedRecords("tasks");
  const { records: inbox, state: inboxState, create: createInbox, update: updateInbox } = useSharedRecords("inbox_items");
  const selected = projects.find((project: any) => project.id === selectedId);
  const projectTasks = tasks.filter((task: any) => task.projectId === selectedId);
  const projectInbox = inbox.filter((item: any) => item.projectId === selectedId);
  const unassignedInbox = inbox.filter((item: any) => !item.projectId && item.status !== "archived");
  const statusLabel: Record<string, string> = { active: "Aktiv", planned: "Geplant", paused: "Pausiert", completed: "Abgeschlossen" };
  const loadWorkspace = useCallback(async () => {
    if (!selectedId) return setWorkspace(null);
    setWorkspaceState("loading");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(selectedId)}/workspace`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setWorkspace(result); setWorkspaceState("online");
    } catch { setWorkspaceState("error"); }
  }, [selectedId]);
  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => { if (selected) setDraft({ title: selected.title || "", goal: selected.goal || "", description: selected.description || "", nextAction: selected.nextAction || "", dueDate: selected.dueDate || "", status: selected.status || "planned" }); }, [selected]);
  const addProject = async () => { try { const created = await createProject({ ...draft, status: draft.status || "planned" }); setShowCreate(false); setSelectedId(created.id); setTab("overview"); note("Projekt im gemeinsamen Arbeitsraum angelegt"); } catch (error) { note(error instanceof Error ? error.message : "Projekt konnte nicht gespeichert werden"); } };
  const saveProject = async () => { if (!selected) return; try { await updateProject({ ...selected, ...draft }); setEditing(false); await loadWorkspace(); note("Projekt gemeinsam aktualisiert"); } catch (error) { note(error instanceof Error ? error.message : "Projekt konnte nicht aktualisiert werden"); } };
  const addTask = async () => { if (!selectedId || taskDraft.title.trim().length < 2) return note("Aufgabe benötigt mindestens zwei Zeichen"); try { await createTask({ title: taskDraft.title.trim(), dueAt: taskDraft.dueAt || undefined, priority: taskDraft.priority, projectId: selectedId, area: "Projekte", status: "active", done: false }); setTaskDraft({ title: "", dueAt: "", priority: "medium" }); await loadWorkspace(); note("Projektaufgabe gemeinsam gespeichert"); } catch (error) { note(error instanceof Error ? error.message : "Aufgabe konnte nicht gespeichert werden"); } };
  const addInbox = async () => { if (!selectedId || inboxDraft.trim().length < 2) return note("Inbox-Eintrag benötigt mindestens zwei Zeichen"); try { await createInbox({ title: inboxDraft.trim(), itemType: "note", projectId: selectedId, area: "Projekte", status: "active" }); setInboxDraft(""); await loadWorkspace(); note("Inbox-Eintrag dem Projekt zugeordnet"); } catch (error) { note(error instanceof Error ? error.message : "Inbox-Eintrag konnte nicht gespeichert werden"); } };
  const toggleTask = async (task: any) => { await updateTask({ ...task, done: !task.done, status: !task.done ? "completed" : "active" }); await loadWorkspace(); };
  const linkInbox = async (item: any, projectId: string) => { await updateInbox({ ...item, projectId, area: projectId ? "Projekte" : "Inbox" }); await loadWorkspace(); note(projectId ? "Inbox-Eintrag zugeordnet" : "Zuordnung gelöst"); };
  const openProject = (id: string) => { setSelectedId(id); setTab("overview"); setEditing(false); };
  return (
    <>
      <Intro
        eyebrow="GEMEINSAMER PROJEKTARBEITSRAUM"
        title={selected ? selected.title : "Projekte mit klarem nächsten Schritt."}
        action={
          selected ? <Btn soft onClick={() => { setSelectedId(""); setWorkspace(null); }}>← Übersicht</Btn> : <Btn onClick={() => { setDraft({ title: "", goal: "", description: "", nextAction: "", dueDate: "", status: "planned" }); setShowCreate(true); }}><I.Plus /> Projekt</Btn>
        }
      ><p>{selected ? "Ziel, nächste Aktionen, Aufgaben, Inbox und Verlauf aus einer gemeinsamen Quelle." : "Keine Demo-Boards: nur echte Vorhaben, verknüpfte Arbeit und ehrliche Leerzustände."}</p></Intro>
      {showCreate && <ProjectEditor draft={draft} setDraft={setDraft} onSave={addProject} onCancel={() => setShowCreate(false)} title="Neues Projekt" />}
      {state==='loading'&&<p role="status">Gemeinsame Projekte werden geladen …</p>}
      {state==='error'&&<p role="alert">Der gemeinsame Projektbestand ist gerade nicht erreichbar.</p>}
      {state==='online'&&!selected&&projects.length===0&&<Card className="honestEmpty"><I.FolderKanban/><span><b>Noch keine gemeinsamen Projekte</b>Lege ein echtes Projekt mit Ziel oder nächster Aktion an. Agentic OS erzeugt keine Beispielkarten.</span></Card>}
      {!selected && projects.length > 0 && <><div className="projectToolbar"><span><b>{projects.length}</b> echte Projekte · Laptop Shared Store</span><div role="group" aria-label="Projektansicht"><button aria-pressed={view==="grid"} onClick={()=>setView("grid")}><I.LayoutGrid/>Karten</button><button aria-pressed={view==="list"} onClick={()=>setView("list")}><I.List/>Liste</button></div></div><div className={`projectWorkspaceGrid ${view}`}>
        {projects.map((project:any, index:number) => { const linkedTasks=tasks.filter((task:any)=>task.projectId===project.id), open=linkedTasks.filter((task:any)=>!task.done).length, linkedInbox=inbox.filter((item:any)=>item.projectId===project.id).length; return <button className="projectOpen" key={project.id} onClick={()=>openProject(project.id)}><Card><div className="row"><span className={"projectSymbol s"+index}><I.FolderKanban/></span><em>{statusLabel[project.status]||project.status}</em></div><h3>{project.title}</h3><p>{project.goal||"Ziel noch nicht festgelegt"}</p><div className="projectFacts"><span><b>{open}</b> offene Aufgaben</span><span><b>{linkedInbox}</b> Inbox-Verknüpfungen</span></div><div className="nextAction"><small>NÄCHSTE AKTION</small><b>{project.nextAction||"Noch nicht festgelegt"}</b></div></Card></button>; })}
      </div></>}
      {selected && <section className="projectWorkspace" aria-label={`Projekt ${selected.title}`}>
        <div className="projectHero card"><div><Tag>{statusLabel[selected.status]||selected.status}</Tag><h2>{selected.title}</h2><p>{selected.goal||"Für dieses Projekt wurde noch kein Ziel formuliert."}</p></div><div className="projectHeroActions"><button onClick={()=>setEditing(true)}><I.Pencil/>Projekt bearbeiten</button>{selected.dueDate&&<span><I.CalendarDays/>{new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Berlin"}).format(new Date(`${selected.dueDate}T12:00:00Z`))}</span>}</div></div>
        {editing&&<ProjectEditor draft={draft} setDraft={setDraft} onSave={saveProject} onCancel={()=>setEditing(false)} title="Projekt bearbeiten"/>}
        <div className="projectTabs" role="tablist" aria-label="Projektarbeitsraum">{[["overview","Überblick",I.Gauge],["tasks","Aufgaben",I.ListChecks],["inbox","Inbox",I.Inbox],["history","Verlauf",I.History]].map(([id,label,Icon]:any)=><button aria-selected={tab===id} className={tab===id?"active":""} key={id} onClick={()=>setTab(id)} role="tab"><Icon/>{label}{id==="tasks"&&<small>{projectTasks.length}</small>}{id==="inbox"&&<small>{projectInbox.length}</small>}</button>)}</div>
        {workspaceState==="error"&&<p role="alert">Verlauf und Wochenplanbezug sind gerade nicht erreichbar; Projektdaten bleiben verfügbar.</p>}
        {tab==="overview"&&<div className="projectDetailGrid"><Card><Tag>ZIEL & AUSRICHTUNG</Tag><h3>{selected.goal||"Ziel noch offen"}</h3><p>{selected.description||"Noch keine zusätzliche Projektbeschreibung."}</p></Card><Card className="projectNext"><Tag>NÄCHSTE AKTION</Tag><h3>{selected.nextAction||"Noch nicht festgelegt"}</h3><p>{selected.nextAction?"Diese Aktion kann beim nächsten Wochenplan als Projektquelle priorisiert werden.":"Bearbeite das Projekt und formuliere einen konkreten nächsten Schritt."}</p><Btn soft onClick={()=>setEditing(true)}>Nächste Aktion festlegen</Btn></Card><Card><Tag>ARBEITSSTAND · ECHT</Tag><div className="projectMetric"><span><b>{projectTasks.filter((task:any)=>!task.done).length}</b>offene Aufgaben</span><span><b>{projectTasks.filter((task:any)=>task.done).length}</b>erledigt</span><span><b>{projectInbox.length}</b>Inbox</span><span><b>{workspace?.counts?.weeklyLinks||0}</b>Wochenpläne</span></div></Card><Card><Tag>WOCHENPLANBEZUG</Tag>{workspaceState==="loading"&&<p role="status">Wochenplanbezug wird geladen …</p>}{workspace?.weekly?.length?<div className="projectWeekly">{workspace.weekly.map((entry:any)=><span key={entry.planId}><I.CalendarRange/><b>{entry.weekStart}–{entry.windowEnd}</b><small>{entry.selected?"Als Outcome gewählt":entry.blockProposed?"Block vorgeschlagen":"Als Quelle erkannt"}</small></span>)}</div>:workspaceState==="online"&&<p>Noch keine Verknüpfung zu einem erzeugten Wochenplan.</p>}</Card></div>}
        {tab==="tasks"&&<div className="projectWorkList"><Card className="projectAdd"><Tag>NEUE PROJEKTAUFGABE</Tag><div className="projectTaskForm"><input aria-label="Aufgabentitel" value={taskDraft.title} onChange={event=>setTaskDraft({...taskDraft,title:event.target.value})} placeholder="Konkrete nächste Aufgabe …"/><input aria-label="Fällig am" type="date" value={taskDraft.dueAt} onChange={event=>setTaskDraft({...taskDraft,dueAt:event.target.value})}/><select aria-label="Priorität" value={taskDraft.priority} onChange={event=>setTaskDraft({...taskDraft,priority:event.target.value})}><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option></select><Btn onClick={addTask}>Aufgabe anlegen</Btn></div></Card>{taskState==="online"&&projectTasks.length===0&&<Card className="honestEmpty"><I.ListChecks/><span><b>Noch keine Projektaufgaben</b>Lege nur konkrete Arbeit an; es werden keine Schritte erfunden.</span></Card>}{projectTasks.map((task:any)=><Card className="projectTask" key={task.id}><button aria-label={task.done?"Aufgabe wieder öffnen":"Aufgabe erledigen"} aria-pressed={Boolean(task.done)} onClick={()=>toggleTask(task)}><i>{task.done&&<I.Check/>}</i></button><span><b>{task.title}</b><small>{task.priority?`Priorität ${task.priority}`:"Keine Priorität"}{task.dueAt?` · fällig ${task.dueAt}`:""}</small></span><em>{task.done?"Erledigt":"Offen"}</em></Card>)}</div>}
        {tab==="inbox"&&<div className="projectInboxGrid"><Card><Tag>PROJEKT-INBOX</Tag><div className="projectInboxCapture"><textarea aria-label="Neuer Projekt-Inbox-Eintrag" value={inboxDraft} onChange={event=>setInboxDraft(event.target.value)} placeholder="Idee, Link oder Notiz diesem Projekt zuordnen …"/><Btn onClick={addInbox}>Zuordnen</Btn></div>{inboxState==="online"&&projectInbox.length===0&&<p>Noch keine Inbox-Einträge verknüpft.</p>}{projectInbox.map((item:any)=><div className="linkedInbox" key={item.id}><I.Inbox/><span><b>{item.title}</b><small>{item.itemType||"Notiz"} · {item.status}</small></span><button onClick={()=>linkInbox(item,"")}>Zuordnung lösen</button></div>)}</Card><Card><Tag>UNZUGEORDNETE INBOX</Tag>{unassignedInbox.length===0?<p>Keine unzugeordneten Einträge vorhanden.</p>:unassignedInbox.slice(0,6).map((item:any)=><div className="linkedInbox" key={item.id}><I.PlusCircle/><span><b>{item.title}</b><small>{item.itemType||"Notiz"}</small></span><button onClick={()=>linkInbox(item,selectedId)}>Diesem Projekt zuordnen</button></div>)}</Card></div>}
        {tab==="history"&&<Card><Tag>VERLAUF · INHALTSARMER AUDIT</Tag><p className="sourceLine"><I.ShieldCheck/>Nur Aktionstyp und Zeitpunkt; keine privaten Inhalte im Audit.</p>{workspaceState==="loading"&&<p role="status">Projektverlauf wird geladen …</p>}{workspace?.audit?.length?<div className="projectAudit">{workspace.audit.map((entry:any,index:number)=><div key={`${entry.createdAt}-${index}`}><I.History/><span><b>{entry.action==="create"?"Erstellt":entry.action==="update"?"Aktualisiert":entry.action}</b><small>{entry.entityType} · {new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}).format(new Date(entry.createdAt))}</small></span></div>)}</div>:workspaceState==="online"&&<p>Noch kein Projektverlauf vorhanden.</p>}</Card>}
      </section>}
    </>
  );
}
function ProjectEditor({ draft, setDraft, onSave, onCancel, title }: any) { return <Card className="projectEditor"><div className="row"><div><Tag>GEMEINSAMER DATENSATZ</Tag><h3>{title}</h3></div><button aria-label="Editor schließen" onClick={onCancel}><I.X/></button></div><div className="projectEditorFields"><label>Projektname<input value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})} placeholder="Klarer Projektname"/></label><label>Status<select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value})}><option value="planned">Geplant</option><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="completed">Abgeschlossen</option></select></label><label className="wide">Ziel<textarea value={draft.goal} onChange={event=>setDraft({...draft,goal:event.target.value})} placeholder="Woran erkennst du, dass dieses Projekt gelungen ist?"/></label><label className="wide">Nächste Aktion<input value={draft.nextAction} onChange={event=>setDraft({...draft,nextAction:event.target.value})} placeholder="Der kleinste konkrete nächste Schritt"/></label><label>Zieldatum (optional)<input type="date" value={draft.dueDate} onChange={event=>setDraft({...draft,dueDate:event.target.value})}/></label><label className="wide">Beschreibung (optional)<textarea value={draft.description} onChange={event=>setDraft({...draft,description:event.target.value})} placeholder="Kontext, Grenzen oder gewünschtes Ergebnis"/></label></div><div className="editorActions"><Btn onClick={draft.title.trim().length>=2?onSave:undefined}>Speichern</Btn><button onClick={onCancel}>Abbrechen</button></div></Card>; }
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
  const { records, state, create, update } = useSharedRecords("agents");
  const { records: projects } = useSharedRecords("projects");
  const { records: referencedSkills } = useSharedRecords("skills");
  const [editing, setEditing] = useState<any>(null), [agentDraft, setAgentDraft] = useState<any>({ name: "", purpose: "", areas: [] }), [workflowState, setWorkflowState] = useState<any>({ state: "loading", profiles: [], runs: [] }), [selectedWorkflow, setSelectedWorkflow] = useState("project_coach"), [workflowInput, setWorkflowInput] = useState(""), [projectId, setProjectId] = useState(""), [activeRunId, setActiveRunId] = useState(""), [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]), [busy, setBusy] = useState(false), [workflowError, setWorkflowError] = useState("");
  const loadWorkflows = useCallback(async () => { try { await fetch("/api/state/session", { method: "POST" }); const response = await fetch("/api/agents/workflows", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(); setWorkflowState({ state: "online", ...result }); if (!activeRunId && result.runs?.length) setActiveRunId(result.runs[0].id); } catch { setWorkflowState({ state: "error", profiles: [], runs: [] }); } }, [activeRunId]);
  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);
  const activeRun = workflowState.runs.find((run: any) => run.id === activeRunId);
  const activeSuggestionKey = JSON.stringify(activeRun?.decision?.selectedSuggestionIds || []);
  useEffect(() => { setSelectedSuggestions(JSON.parse(activeSuggestionKey)); }, [activeRunId, activeSuggestionKey]);
  const workflowIcon = (id: string) => id === "project_coach" ? I.FolderKanban : id === "faith_reflection" ? I.MoonStar : id === "health_planner" ? I.HeartPulse : id === "finance_overview" ? I.WalletCards : I.UsersRound;
  const saveAgent = async () => { try { if (editing?.id) await update({ ...editing, ...agentDraft, title: agentDraft.name }); else await create({ ...agentDraft, title: agentDraft.name, status: "planned", providerMode: "subscription" }); setEditing(null); note("Agent-Metadaten gespeichert · keine Ausführung aktiviert"); } catch (error) { note(error instanceof Error ? error.message : "Agent konnte nicht gespeichert werden"); } };
  const generate = async () => { if (workflowInput.trim().length < 2) return note("Bitte einen klaren Arbeitsauftrag eingeben"); setBusy(true); setWorkflowError(""); try { const response = await fetch("/api/agents/workflows", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workflowId: selectedWorkflow, input: workflowInput, projectId: selectedWorkflow === "project_coach" ? projectId || undefined : undefined }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); await loadWorkflows(); setActiveRunId(result.run.id); setWorkflowInput(""); note("Lokaler Vorschlagslauf gespeichert · 0 externe Aktionen"); } catch (error) { setWorkflowError(error instanceof Error ? error.message : "Workflow fehlgeschlagen"); } finally { setBusy(false); } };
  const transition = async (action: "review" | "pause" | "resume") => { if (!activeRun) return; setBusy(true); setWorkflowError(""); try { const response = await fetch("/api/agents/workflows", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ runId: activeRun.id, action, selectedSuggestionIds: action === "review" ? selectedSuggestions : undefined }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); await loadWorkflows(); setActiveRunId(result.run.id); note(action === "review" ? "Review gespeichert · keine Aktion ausgeführt" : action === "pause" ? "Workflow pausiert" : "Workflow zur Review fortgesetzt"); } catch (error) { setWorkflowError(error instanceof Error ? error.message : "Statuswechsel fehlgeschlagen"); } finally { setBusy(false); } };
  const toggleSuggestion = (id: string) => setSelectedSuggestions((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  return (
    <>
      <Intro
        eyebrow="LOKALE WORKFLOWS · TRANSPARENT & FREIGABEGESTEUERT"
        title="Assistenten, die Vorschläge machen – nicht heimlich handeln."
        action={<Btn soft onClick={() => { setEditing({}); setAgentDraft({ name: "", purpose: "", areas: [] }); }}><I.Plus /> Eigener Agent</Btn>}
      ><p>Alle fünf Kern-Workflows lesen nur den privaten Shared Store. Kein Modell, keine API-Kosten, keine Hintergrundaktion.</p></Intro>
      <div className="workflowTruth"><span><I.Cpu/><b>Lokale Regeln</b><small>Modell: keines</small></span><span><I.Database/><b>Shared Store</b><small>Input/Output verschlüsselt</small></span><span><I.ShieldCheck/><b>Freigabegrenze</b><small>Vorschlag ≠ Aktion</small></span><span><I.BadgeEuro/><b>Kosten</b><small>0 € pro Lauf</small></span></div>
      {workflowState.state === "error" && <p role="alert">Die privaten Workflow-Daten sind gerade nicht erreichbar.</p>}
      <div className="workflowProfiles">{workflowState.profiles.map((profile: any) => { const Icon = workflowIcon(profile.id), latest = workflowState.runs.find((run: any) => run.workflowId === profile.id), linkedSkills = referencedSkills.filter((skill:any)=>skill.executable&&(skill.assignedAgentWorkflowIds||[]).includes(profile.id)); return <button aria-pressed={selectedWorkflow === profile.id} className={selectedWorkflow === profile.id ? "active" : ""} key={profile.id} onClick={() => { setSelectedWorkflow(profile.id); setActiveRunId(latest?.id || ""); setWorkflowError(""); }}><span><Icon/></span><div><b>{profile.name}</b><small>{profile.purpose}</small><small>{linkedSkills.length} transparente Skill-Referenz{linkedSkills.length===1?"":"en"} · keine stille Kette</small></div><em>{latest ? latest.status === "paused" ? "Pausiert" : latest.status === "reviewed" ? "Geprüft" : "Review offen" : "Noch kein Lauf"}</em></button>; })}</div>
      <div className="workflowLayout">
        <Card className="workflowStart"><Tag>NEUER VORSCHLAGSLAUF</Tag><h3>{workflowState.profiles.find((profile: any)=>profile.id===selectedWorkflow)?.name || "Workflow"}</h3><p>{workflowState.profiles.find((profile: any)=>profile.id===selectedWorkflow)?.boundary}</p>{selectedWorkflow === "project_coach" && <label>Projektbezug (optional)<select value={projectId} onChange={event=>setProjectId(event.target.value)}><option value="">Alle echten Projekte</option>{projects.map((project:any)=><option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}<label>Was soll der Assistent organisatorisch klären?<textarea value={workflowInput} onChange={event=>setWorkflowInput(event.target.value)} placeholder="Klarer Arbeitsauftrag – keine Zugangsdaten oder unnötigen sensiblen Details …" maxLength={1000}/></label><div className="workflowGate"><I.Shield/><span><b>Nur Vorschlag erzeugen</b>Keine Aufgabe, Nachricht, Transaktion, Kalenderänderung oder externe Aktion.</span></div><Btn onClick={!busy && workflowInput.trim().length >= 2 ? generate : undefined}>{busy ? "Wird lokal ausgewertet …" : "Vorschlag lokal erzeugen"}<I.WandSparkles/></Btn></Card>
        <Card className="workflowResult"><div className="row"><div><Tag>OUTPUT & STATUS</Tag><h3>{activeRun ? workflowState.profiles.find((profile:any)=>profile.id===activeRun.workflowId)?.name : "Noch kein Lauf gewählt"}</h3></div>{activeRun&&<em className={`runStatus ${activeRun.status}`}>{activeRun.status}</em>}</div>{workflowError&&<p className="plannerError" role="alert"><I.TriangleAlert/>{workflowError}</p>}{!activeRun&&<div className="honestEmpty"><I.Bot/><span><b>Noch kein echter Vorschlagslauf</b>Wähle einen Workflow und formuliere einen Arbeitsauftrag. Es werden keine Ergebnisse erfunden.</span></div>}{activeRun&&<><p>{activeRun.output.summary}</p><div className="sourceCounts">{Object.entries(activeRun.sourceEvidence).map(([key,value])=><span key={key}><b>{typeof value === "boolean" ? value ? "Ja" : "Nein" : String(value)}</b>{key}</span>)}</div><div className="workflowSuggestions">{activeRun.output.suggestions.map((item:any)=><label className={selectedSuggestions.includes(item.id)?"selected":""} key={item.id}><input checked={selectedSuggestions.includes(item.id)} disabled={activeRun.status==="reviewed"} onChange={()=>toggleSuggestion(item.id)} type="checkbox"/><span><b>{item.title}</b><small>{item.rationale}</small></span><em>Vorschlag</em></label>)}</div><div className="workflowActions">{activeRun.status === "proposal" && <><Btn onClick={!busy ? ()=>transition("review") : undefined}>Review speichern</Btn><button onClick={()=>transition("pause")} disabled={busy}>Pausieren</button></>}{activeRun.status === "paused" && <Btn onClick={!busy ? ()=>transition("resume") : undefined}>Workflow fortsetzen</Btn>}{activeRun.status === "reviewed" && <span><I.CheckCircle2/>Review abgeschlossen · keine Folgeaktion ausgeführt</span>}</div><small className="workflowBoundary"><I.Lock/>Externe oder folgenreiche Aktionen sind in diesem Workflow nicht implementiert und brauchen später eine eigene exakte Vorschau und Freigabe.</small></>}</Card>
      </div>
      {workflowState.runs.length > 0 && <Card className="workflowHistory"><Tag>RESUME & AUDIT</Tag><div>{workflowState.runs.slice(0,10).map((run:any)=><button className={activeRunId===run.id?"active":""} key={run.id} onClick={()=>setActiveRunId(run.id)}><I.History/><span><b>{workflowState.profiles.find((profile:any)=>profile.id===run.workflowId)?.name}</b><small>{new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}).format(new Date(run.updatedAt))} · Schritt {run.currentStep}</small></span><em>{run.status}</em></button>)}</div></Card>}
      <div className="sectionhead"><h3>Eigene Agent-Metadaten</h3><span>{records.length} persistent · nicht ausführbar</span></div>
      {editing && <Card className="agentConfigurator"><div className="row"><Tag>AGENT-KONFIGURATOR · METADATEN</Tag><button aria-label="Konfigurator schließen" onClick={()=>setEditing(null)}><I.X/></button></div><label>Name<input value={agentDraft.name} onChange={event=>setAgentDraft({...agentDraft,name:event.target.value})} placeholder="Agentname"/></label><label>Zweck<textarea value={agentDraft.purpose} onChange={event=>setAgentDraft({...agentDraft,purpose:event.target.value})} placeholder="Wofür soll diese Konfiguration später dienen?"/></label><p>Speichern aktiviert keine Ausführung und keinen Modellzugriff.</p><div className="editorActions"><Btn onClick={agentDraft.name.trim().length>=2?saveAgent:undefined}>Metadaten speichern</Btn><button onClick={()=>setEditing(null)}>Abbrechen</button></div></Card>}
      {state === "online" && records.length === 0 && <Card className="honestEmpty"><I.Bot/><span><b>Keine eigenen Agent-Metadaten</b>Die fünf geprüften System-Workflows oben funktionieren unabhängig davon lokal.</span></Card>}
      <div className="agentMetadata">{records.map((agent:any)=><Card key={agent.id}><div className="row"><span className="agentIcon"><I.Bot/></span><i className="badge unconfigured">Metadaten</i></div><h3>{agent.name||agent.title}</h3><p>{agent.purpose||"Zweck noch nicht beschrieben"}</p><small>ChatGPT Companion · keine automatische Ausführung</small><button onClick={()=>{setEditing(agent);setAgentDraft({name:agent.name||agent.title,purpose:agent.purpose||"",areas:agent.areas||[]})}}>Konfigurieren<I.Settings2/></button></Card>)}</div>
    </>
  );
}
function Skills({ note }: any) {
  const agentNames: Record<string,string> = {project_coach:"Projekt-Coach",faith_reflection:"Glaubensassistent",health_planner:"Gesundheitsplaner",finance_overview:"Finanzassistent",relationship_care:"Beziehungsassistent"};
  const { records: projects } = useSharedRecords("projects");
  const [q,setQ]=useState(""),[category,setCategory]=useState("Alle"),[skillState,setSkillState]=useState<any>({state:"loading",definitions:[],runs:[],catalog:[]}),[selectedSkillId,setSelectedSkillId]=useState(""),[selectedRunId,setSelectedRunId]=useState(""),[editing,setEditing]=useState<any>(null),[draft,setDraft]=useState<any>({}),[runInput,setRunInput]=useState<any>({limit:3}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[archiveArmed,setArchiveArmed]=useState(false);
  const loadSkills=useCallback(async()=>{try{await fetch("/api/state/session",{method:"POST"});const response=await fetch("/api/skills",{cache:"no-store"}),result=await response.json();if(!response.ok)throw new Error(result.error);setSkillState({state:"online",...result});setSelectedSkillId(current=>current||result.definitions?.[0]?.id||"");setSelectedRunId(current=>current||result.runs?.[0]?.id||"")}catch(cause){setSkillState({state:"error",definitions:[],runs:[],catalog:[]});setError(cause instanceof Error?cause.message:"Skills sind nicht erreichbar")}},[setError,setSelectedRunId,setSelectedSkillId,setSkillState]);
  useEffect(()=>{loadSkills()},[loadSkills]);
  const selectedSkill=skillState.definitions.find((skill:any)=>skill.id===selectedSkillId),selectedRun=skillState.runs.find((run:any)=>run.id===selectedRunId);
  useEffect(()=>{if(!selectedSkill)return;const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());setRunInput(selectedSkill.procedureId==="daily_check"?{date:today,limit:5}:selectedSkill.procedureId==="area_overview"?{area:"faith",limit:5}:selectedSkill.procedureId==="project_snapshot"?{projectId:projects[0]?.id||"",limit:5}:{focus:"",limit:3});const latest=skillState.runs.find((run:any)=>run.skillId===selectedSkill.id);setSelectedRunId(latest?.id||"")},[projects,selectedSkill,skillState.runs]);
  const categories=["Alle",...new Set(skillState.catalog.map((item:any)=>item.category))] as string[];
  const list=skillState.definitions.filter((skill:any)=>JSON.stringify(skill).toLowerCase().includes(q.toLowerCase())&&(category==="Alle"||skill.category===category));
  const beginCreate=()=>{const procedure=skillState.catalog[0];setDraft({name:"",purpose:"",procedureId:procedure?.id||"priority_review",status:"active",allowedSources:procedure?.defaultSources||[],assignedAgentWorkflowIds:[]});setEditing({});setArchiveArmed(false);setError("")};
  const beginEdit=(skill:any)=>{setDraft({...skill});setEditing(skill);setArchiveArmed(false);setError("")};
  const selectProcedure=(procedureId:string)=>{const procedure=skillState.catalog.find((item:any)=>item.id===procedureId);setDraft((current:any)=>({...current,procedureId,allowedSources:procedure?.defaultSources||[]}))};
  const toggleDraftValue=(key:string,value:string)=>setDraft((current:any)=>{const values=Array.isArray(current[key])?current[key]:[];return{...current,[key]:values.includes(value)?values.filter((item:string)=>item!==value):[...values,value]}});
  const saveDefinition=async()=>{setBusy(true);setError("");try{const action=editing?.id?"update_definition":"create_definition",method=editing?.id?"PATCH":"POST",response=await fetch("/api/skills",{method,headers:{"content-type":"application/json"},body:JSON.stringify({action,skillId:editing?.id,definition:draft})}),result=await response.json();if(!response.ok)throw new Error(result.error);await loadSkills();setSelectedSkillId(result.definition.id);setEditing(null);note(editing?.id?"Skill-Version aktualisiert":"Sichere lokale Skill-Definition gespeichert")}catch(cause){setError(cause instanceof Error?cause.message:"Skill konnte nicht gespeichert werden")}finally{setBusy(false)}};
  const archiveDefinition=async()=>{if(!editing?.id)return;setBusy(true);setError("");try{const response=await fetch("/api/skills",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action:"archive_definition",skillId:editing.id})}),result=await response.json();if(!response.ok)throw new Error(result.error);setEditing(null);setSelectedSkillId("");await loadSkills();note("Skill reversibel archiviert")}catch(cause){setError(cause instanceof Error?cause.message:"Archivieren fehlgeschlagen")}finally{setBusy(false)}};
  const runPreview=async()=>{if(!selectedSkill)return;setBusy(true);setError("");try{const response=await fetch("/api/skills",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"run_preview",skillId:selectedSkill.id,input:runInput})}),result=await response.json();if(!response.ok)throw new Error(result.error);await loadSkills();setSelectedRunId(result.run.id);note("Lokale Skill-Vorschau gespeichert · 0 externe Aktionen")}catch(cause){setError(cause instanceof Error?cause.message:"Skill-Vorschau fehlgeschlagen")}finally{setBusy(false)}};
  const reviewRun=async()=>{if(!selectedRun)return;setBusy(true);setError("");try{const response=await fetch("/api/skills",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action:"review_run",runId:selectedRun.id})}),result=await response.json();if(!response.ok)throw new Error(result.error);await loadSkills();setSelectedRunId(result.run.id);note("Skill-Vorschau geprüft · keine Folgeaktion")}catch(cause){setError(cause instanceof Error?cause.message:"Review fehlgeschlagen")}finally{setBusy(false)}};
  const validRunInput=selectedSkill?.procedureId==="priority_review"?String(runInput.focus||"").trim().length>=2:selectedSkill?.procedureId==="project_snapshot"?Boolean(runInput.projectId):selectedSkill?.procedureId==="daily_check"?Boolean(runInput.date):Boolean(runInput.area);
  return <>
    <Intro eyebrow="LOKALE PROZEDUREN · VERSIONIERT & SICHER" title="Wiederverwendbare Skills mit sichtbarer Wirkung." action={<Btn onClick={skillState.state==="online"?beginCreate:undefined}><I.Plus/>Skill definieren</Btn>}><p>Nur feste lokale Lese-, Transformations- und Vorschlagsabläufe. Kein Code, Netzwerk, Modell oder externer Schreibzugriff.</p></Intro>
    <div className="skillTruth"><span><I.ShieldCheck/><b>Freigabeklasse</b><small>local_read_proposal</small></span><span><I.Workflow/><b>Ausführung</b><small>deterministisch · lokal</small></span><span><I.Ban/><b>Gesperrt</b><small>Shell · Netzwerk · Modelle · Dateien</small></span><span><I.History/><b>Nachweis</b><small>Version · Status · Audit</small></span></div>
    {skillState.state==="error"&&<p className="plannerError" role="alert"><I.TriangleAlert/>{error||"Private Skill-Daten nicht erreichbar"}</p>}
    {editing&&<Card className="skillEditor"><div className="row"><div><Tag>{editing.id?`DEFINITION · VERSION ${editing.version}`:"NEUE DEFINITION"}</Tag><h3>{editing.id?"Skill bearbeiten":"Sicheren Skill anlegen"}</h3></div><button aria-label="Skill-Editor schließen" onClick={()=>setEditing(null)}><I.X/></button></div><div className="skillEditorGrid"><label>Name<input maxLength={80} value={draft.name||""} onChange={event=>setDraft({...draft,name:event.target.value})} placeholder="z. B. Wochenprioritäten prüfen"/></label><label>Status<select value={draft.status||"active"} onChange={event=>setDraft({...draft,status:event.target.value})}><option value="active">Aktiv</option><option value="paused">Pausiert</option></select></label><label className="wide">Zweck<textarea maxLength={500} value={draft.purpose||""} onChange={event=>setDraft({...draft,purpose:event.target.value})} placeholder="Welche klare lokale Übersicht soll entstehen?"/></label><label className="wide">Geprüfte Prozedur<select value={draft.procedureId||""} onChange={event=>selectProcedure(event.target.value)}>{skillState.catalog.map((procedure:any)=><option key={procedure.id} value={procedure.id}>{procedure.name} · {procedure.category}</option>)}</select></label></div>{(()=>{const procedure=skillState.catalog.find((item:any)=>item.id===draft.procedureId);return procedure&&<><div className="skillDefinitionBlock"><b>Erlaubte echte Quellen</b><div>{procedure.allowedSources.map((source:string)=><label key={source}><input type="checkbox" checked={(draft.allowedSources||[]).includes(source)} onChange={()=>toggleDraftValue("allowedSources",source)}/>{source}</label>)}</div></div><div className="skillDefinitionBlock"><b>Transparente Agentenreferenzen</b><div>{Object.entries(agentNames).map(([id,name])=><label key={id}><input type="checkbox" checked={(draft.assignedAgentWorkflowIds||[]).includes(id)} onChange={()=>toggleDraftValue("assignedAgentWorkflowIds",id)}/>{name}</label>)}</div></div><ol className="skillSteps">{procedure.deterministicSteps.map((step:string)=><li key={step}>{step}</li>)}</ol></>})()}<div className="workflowGate"><I.Lock/><span><b>Technische Sperre</b>Beliebiger Code, Shell, dynamische Imports, Netzwerk, Modelle, externe Writes, Dateiänderungen und stille Ketten sind nicht konfigurierbar.</span></div>{error&&<p className="plannerError" role="alert">{error}</p>}<div className="editorActions"><Btn onClick={!busy&&String(draft.name||"").trim().length>=2&&String(draft.purpose||"").trim().length>=2&&(draft.allowedSources||[]).length?saveDefinition:undefined}>{busy?"Speichert …":"Definition speichern"}</Btn><button onClick={()=>setEditing(null)}>Abbrechen</button>{editing.id&&!archiveArmed&&<button className="dangerQuiet" onClick={()=>setArchiveArmed(true)}>Archivieren …</button>}{editing.id&&archiveArmed&&<button className="dangerQuiet" onClick={archiveDefinition} disabled={busy}>Archivierung bestätigen</button>}</div></Card>}
    <div className="skillbar"><label><I.Search/><input value={q} onChange={event=>setQ(event.target.value)} placeholder="Skills durchsuchen …"/></label>{categories.map(value=><button aria-pressed={category===value} className={category===value?"active":""} key={value} onClick={()=>setCategory(value)}>{value}</button>)}</div>
    {skillState.state==="online"&&skillState.definitions.length===0&&<Card className="honestEmpty"><I.Sparkles/><span><b>Noch keine lokale Skill-Definition</b>Lege eine Definition aus einer der vier geprüften Prozeduren an. Es werden keine Beispieldaten erzeugt.</span></Card>}
    {skillState.legacyMetadataCount>0&&<p className="statusNote"><I.Info/>{skillState.legacyMetadataCount} ältere Metadaten-Skills bleiben nicht ausführbar, bis sie bewusst mit einer geprüften Prozedur gespeichert werden.</p>}
    <div className="skillWorkspace">
      <div className="skillDefinitions">{list.map((skill:any)=><button aria-pressed={selectedSkillId===skill.id} className={selectedSkillId===skill.id?"active":""} key={skill.id} onClick={()=>{setSelectedSkillId(skill.id);setError("")}}><span><I.Sparkles/><b>{skill.name}</b><small>{skill.purpose||"Noch keine sichere Prozedur zugeordnet"}</small></span><em className={skill.executable?"ok":""}>{skill.executable?"Lokal bereit":skill.status==="paused"?"Pausiert":"Nicht ausführbar"}</em><small>{skill.category||"Metadaten"} · v{skill.version} · {(skill.assignedAgentWorkflowIds||[]).map((id:string)=>agentNames[id]).join(", ")||"Kein Agentenbezug"}</small></button>)}</div>
      {selectedSkill&&<Card className="skillRunner"><div className="row"><div><Tag>SKILL-AUSFÜHRUNG · VORSCHAU</Tag><h3>{selectedSkill.name}</h3></div><button onClick={()=>beginEdit(selectedSkill)}><I.Settings2/>Bearbeiten</button></div><p>{selectedSkill.purpose}</p><div className="skillContract"><span><b>Input</b>{Object.values(selectedSkill.inputSchema||{}).map((field:any)=>field.label).join(" · ")}</span><span><b>Quellen</b>{(selectedSkill.allowedSources||[]).join(" · ")}</span><span><b>Output</b>Lokale Vorschau · 0 Writes</span></div>{selectedSkill.procedureId==="priority_review"&&<label>Fokus<textarea maxLength={500} value={runInput.focus||""} onChange={event=>setRunInput({...runInput,focus:event.target.value})} placeholder="Was soll heute priorisiert werden?"/></label>}{selectedSkill.procedureId==="daily_check"&&<label>Datum<input type="date" value={runInput.date||""} onChange={event=>setRunInput({...runInput,date:event.target.value})}/></label>}{selectedSkill.procedureId==="area_overview"&&<label>Lebensbereich<select value={runInput.area||"faith"} onChange={event=>setRunInput({...runInput,area:event.target.value})}><option value="faith">Glaube</option><option value="health">Gesundheit</option><option value="finance">Finanzen</option><option value="relations">Beziehungen</option><option value="career">Karriere</option></select></label>}{selectedSkill.procedureId==="project_snapshot"&&<label>Projekt<select value={runInput.projectId||""} onChange={event=>setRunInput({...runInput,projectId:event.target.value})}><option value="">Projekt wählen</option>{projects.map((project:any)=><option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}<label>Maximale Hinweise<select value={runInput.limit||5} onChange={event=>setRunInput({...runInput,limit:Number(event.target.value)})}>{[1,2,3,4,5].map(value=><option key={value} value={value}>{value}</option>)}</select></label><Btn onClick={!busy&&selectedSkill.executable&&validRunInput?runPreview:undefined}>{busy?"Läuft lokal …":"Vorschau lokal ausführen"}<I.Play/></Btn>{!selectedSkill.executable&&<p className="statusNote"><I.PauseCircle/>Dieser Skill ist pausiert oder noch nicht sicher definiert.</p>}</Card>}
    </div>
    {selectedRun&&<Card className="skillOutput"><div className="row"><div><Tag>ECHTER PREVIEW-OUTPUT</Tag><h3>{skillState.definitions.find((skill:any)=>skill.id===selectedRun.skillId)?.name||"Archivierter Skill"}</h3></div><em className={`runStatus ${selectedRun.status}`}>{selectedRun.status}</em></div><p>{selectedRun.output.summary}</p><div className="sourceCounts">{Object.entries(selectedRun.sourceEvidence||{}).map(([source,count])=><span key={source}><b>{String(count)}</b>{source}</span>)}</div>{selectedRun.output.items.length===0?<div className="honestEmpty"><I.CheckCircle2/><span><b>Keine passenden echten Einträge</b>Die Vorschau bleibt leer, statt Aufgaben oder Ergebnisse zu erfinden.</span></div>:<div className="skillPreviewItems">{selectedRun.output.items.map((entry:any)=><div key={entry.id}><span><b>{entry.title}</b><small>{entry.rationale}</small></span><em>{entry.source}</em></div>)}</div>}<ol className="skillSteps">{selectedRun.output.deterministicSteps.map((step:string)=><li key={step}>{step}</li>)}</ol><div className="workflowGate"><I.ShieldCheck/><span><b>Nur gelesen und transformiert</b>Kein Modell, Netzwerk, Datei- oder externer Schreibzugriff. Der Output löst keine Folgeaktion aus.</span></div>{selectedRun.status==="preview"&&<Btn onClick={!busy?reviewRun:undefined}>Vorschau als geprüft markieren</Btn>}{selectedRun.status==="reviewed"&&<p className="statusNote"><I.CheckCircle2/>Geprüft · keine Folgeaktion ausgeführt</p>}</Card>}
    {skillState.runs.length>0&&<Card className="skillRunHistory"><Tag>LAUFHISTORIE · RESUME/AUDIT</Tag><div>{skillState.runs.map((run:any)=><button className={selectedRunId===run.id?"active":""} key={run.id} onClick={()=>setSelectedRunId(run.id)}><I.History/><span><b>{skillState.definitions.find((skill:any)=>skill.id===run.skillId)?.name||"Archivierter Skill"}</b><small>Definitionsversion {run.definitionVersion} · {new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}).format(new Date(run.updatedAt))}</small></span><em>{run.status}</em></button>)}</div></Card>}
  </>;
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
function WeeklyPlanner({ note }: any) {
  const [status, setStatus] = useState<any>({ state: "loading", connected: false });
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [busy, setBusy] = useState<"idle" | "generate" | "review" | "approval">("idle");
  const [error, setError] = useState("");
  const [approval, setApproval] = useState<any>(null);
  const [confirmation, setConfirmation] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      await fetch("/api/state/session", { method: "POST" });
      const [calendarResponse, catalogResponse, planResponse] = await Promise.all([
        fetch("/api/calendar/status", { cache: "no-store" }),
        fetch("/api/calendar/calendars", { cache: "no-store" }),
        fetch("/api/planner", { cache: "no-store" }),
      ]);
      const [calendarStatus, catalog, latest] = await Promise.all([calendarResponse.json(), catalogResponse.json(), planResponse.json()]);
      setStatus({ state: calendarResponse.ok ? "ready" : "error", ...calendarStatus });
      const available = catalog.calendars || [];
      setCalendars(available);
      setSelectedCalendars((current) => current.length ? current : available.filter((item: any) => item.selected).slice(0, 12).map((item: any) => item.id));
      if (planResponse.ok && latest.plan) {
        setPlan(latest.plan);
        setSelectedOutcomes(latest.plan.decisions?.selectedOutcomeIds || latest.plan.outcomes?.map((item: any) => item.id) || []);
        setSelectedBlocks(latest.plan.decisions?.selectedBlockIds || latest.plan.blocks?.map((item: any) => item.id) || []);
      }
      setHistory(planResponse.ok ? latest.history || [] : []);
    } catch {
      setStatus({ state: "error", connected: false });
      setError("Private Planner-Quelle ist gerade nicht erreichbar.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleLimited = (id: string, setter: (value: string[]) => void, current: string[]) => {
    if (current.includes(id)) return setter(current.filter((item) => item !== id));
    if (current.length >= 3) return note("Maximal drei Einträge auswählen");
    setter([...current, id]);
  };

  const generate = async () => {
    if (!selectedCalendars.length) return note("Bitte mindestens einen Kalender auswählen");
    setBusy("generate"); setError(""); setApproval(null);
    try {
      const response = await fetch("/api/planner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ selectedCalendarIds: selectedCalendars }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Vorschlag konnte nicht erzeugt werden");
      setPlan(result.plan);
      setHistory(result.history || []);
      setSelectedOutcomes(result.plan.outcomes.map((item: any) => item.id));
      setSelectedBlocks(result.plan.blocks.map((item: any) => item.id));
      note("Echter Wochenvorschlag erzeugt · 0 Kalenderwrites");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Vorschlag fehlgeschlagen"); }
    finally { setBusy("idle"); }
  };

  const review = async () => {
    if (!plan || !selectedOutcomes.length) return note("Bitte mindestens ein Wochenziel wählen");
    setBusy("review"); setError("");
    try {
      const response = await fetch("/api/planner", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ planId: plan.id, selectedOutcomeIds: selectedOutcomes, selectedBlockIds: selectedBlocks }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Review konnte nicht gespeichert werden");
      setPlan(result.plan);
      setHistory(result.history || []);
      note("Review gemeinsam gespeichert · weiterhin 0 Writes");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Review fehlgeschlagen"); }
    finally { setBusy("idle"); }
  };

  const prepareApproval = async (block: any) => {
    setBusy("approval"); setError(""); setApproval(null); setConfirmation("");
    try {
      const response = await fetch("/api/calendar/write-proposal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ selectedCalendarIds: selectedCalendars, change: { action: "create", calendarId: block.calendarId, title: block.title, start: block.start, end: block.end, idempotencyKey: `weekly:${plan.id}:${block.id}` } }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Schreibvorschlag konnte nicht vorbereitet werden");
      setApproval({ ...result, block });
      note("Exakte Einzelvorschau vorbereitet · noch nicht geschrieben");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Freigabevorbereitung fehlgeschlagen"); }
    finally { setBusy("idle"); }
  };

  const executeApprovedWrite = async () => {
    if (!approval || confirmation !== "DIESEN_TERMIN_JETZT_SCHREIBEN") return;
    setBusy("approval"); setError("");
    try {
      const response = await fetch("/api/calendar/write", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ approvalToken: approval.approvalToken, confirmation }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Kalenderwrite wurde abgelehnt");
      setApproval(null); setConfirmation("");
      note(result.duplicatePrevented ? "Duplikat verhindert · nichts geschrieben" : "Einzeltermin geschrieben und auditiert");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Kalenderwrite fehlgeschlagen"); }
    finally { setBusy("idle"); }
  };

  const formatMoment = (value: string) => new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(value));
  const reviewed = plan?.decisions?.reviewed;
  return <>
    <Intro eyebrow="SONNTAGSRESET · 11:00–11:30" title="Deine Woche realistisch planen">
      <p>Reale Kalenderbelegung und gemeinsame Aufgaben werden zu höchstens drei Outcomes. 35% bleiben bewusst frei.</p>
    </Intro>
    <section className="plannerFlow" aria-label="Geführte Wochenplanung">
      <Card className="plannerSources">
        <div className="plannerStep"><span>1</span><div><Tag>QUELLENSTATUS</Tag><h3>{status.connected ? "Google Calendar ist verbunden" : status.configured ? "Google-Verbindung braucht Freigabe" : "Google Calendar ist unkonfiguriert"}</h3></div></div>
        <p className="sourceLine"><I.Database /> Aufgaben, Inbox und Projekte: Laptop Shared Store · Kalender: begrenzter 8-Tage-Read · Zeitzone Europe/Berlin.</p>
        {calendars.length > 0 ? <div className="plannerCalendars" role="group" aria-label="Kalender auswählen">
          {calendars.map((calendar) => <label key={calendar.id}><input checked={selectedCalendars.includes(calendar.id)} onChange={() => setSelectedCalendars((current) => current.includes(calendar.id) ? current.filter((id) => id !== calendar.id) : current.length < 12 ? [...current, calendar.id] : current)} type="checkbox"/><span><b>{calendar.summary}</b><small>{calendar.writable ? "Schreibziel möglich" : "Nur Lesen"}</small></span></label>)}
        </div> : <div className="honestEmpty"><I.CloudOff /><span><b>Keine echte Kalenderliste verfügbar</b>Ohne verbundene Quelle erzeugt Agentic OS keine Fake-Blöcke.</span></div>}
        <Btn onClick={status.connected && busy === "idle" ? generate : undefined}>{busy === "generate" ? "Wird ausgewertet …" : "Echten Vorschlag erzeugen"} <I.WandSparkles /></Btn>
      </Card>

      {error && <div className="plannerError" role="alert"><I.TriangleAlert />{error}</div>}
      {!plan && status.state !== "loading" && <Card className="honestEmpty"><I.CalendarRange /><span><b>Noch kein Wochenplan vorhanden</b>Wähle die relevanten Kalender und erzeuge den ersten Vorschlag. Es erfolgt kein Kalenderwrite.</span></Card>}
      {plan && <>
        <Card>
          <div className="plannerStep"><span>2</span><div><Tag>ECHTER VORSCHLAG · 0 WRITES</Tag><h3>{plan.weekStart} bis {plan.windowEnd}</h3></div><em>{plan.capacity.bufferPercent}% Puffer</em></div>
          <div className="plannerEvidence">
            {[["Termine", plan.sourceEvidence.eventCount], ["Aufgaben", plan.sourceEvidence.taskCount], ["Inbox", plan.sourceEvidence.inboxCount], ["Projekte", plan.sourceEvidence.projectCount]].map(([label, count]) => <span key={label as string}><b>{count}</b>{label}</span>)}
          </div>
          <div className="plannerProtection">
            {plan.protections.map((item: any) => <span className={item.status === "verified" ? "verified" : "unverified"} key={item.id || item}><I.ShieldCheck /><b>{item.label || item}</b><small>{item.detail || "Generatorregel aktiv"}</small></span>)}
          </div>
        </Card>
        <div className="plannerColumns">
          <Card>
            <div className="row"><div><Tag>WOCHENZIELE</Tag><h3>Bis zu drei auswählen</h3></div><b>{selectedOutcomes.length}/3</b></div>
            <div className="plannerChoices">
              {plan.outcomes.map((outcome: any) => <label className={selectedOutcomes.includes(outcome.id) ? "selected" : ""} key={outcome.id}><input checked={selectedOutcomes.includes(outcome.id)} onChange={() => toggleLimited(outcome.id, setSelectedOutcomes, selectedOutcomes)} type="checkbox"/><span><b>{outcome.title}</b><small>{outcome.area} · {outcome.reason}</small></span></label>)}
              {!plan.outcomes.length && <div className="honestEmpty"><I.ListTodo /><span><b>Keine offenen Quellen gefunden</b>Erfasse zuerst eine gemeinsame Aufgabe, Inbox-Notiz oder ein Projekt.</span></div>}
            </div>
          </Card>
          <Card>
            <div className="row"><div><Tag>FOKUSBLÖCKE</Tag><h3>Noch nicht im Kalender</h3></div><b>{selectedBlocks.length}/3</b></div>
            <div className="plannerChoices">
              {plan.blocks.map((block: any) => <label className={selectedBlocks.includes(block.id) ? "selected" : ""} key={block.id}><input checked={selectedBlocks.includes(block.id)} onChange={() => toggleLimited(block.id, setSelectedBlocks, selectedBlocks)} type="checkbox"/><span><b>{block.title}</b><small>{formatMoment(block.start)}–{new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(block.end))} · {block.calendarName}</small></span><em>Vorschlag</em></label>)}
              {!plan.blocks.length && <div className="honestEmpty"><I.CalendarX2 /><span><b>Keine sichere Blockzeit vorgeschlagen</b>{plan.writableTargetAvailable ? "Keine freie Zeit innerhalb der Schutzregeln." : "Kein ausgewählter Kalender ist beschreibbar."}</span></div>}
            </div>
          </Card>
        </div>
        <Card className="plannerReview">
          <div className="plannerStep"><span>3</span><div><Tag>REVIEW</Tag><h3>Auswahl gemeinsam speichern</h3><p>Der Review synchronisiert Desktop und iPhone. Er schreibt keinen Kalendertermin.</p></div></div>
          <Btn onClick={selectedOutcomes.length && busy === "idle" ? review : undefined}>{busy === "review" ? "Speichert …" : reviewed ? "Review aktualisieren" : "Review speichern"} <I.Check /></Btn>
        </Card>
        {reviewed && <Card className="plannerApproval">
          <div className="plannerStep"><span>4</span><div><Tag>EXAKTE WRITE-FREIGABE</Tag><h3>Ausgewählte Blocks sind weiterhin ungeschrieben</h3><p>Jeder Termin wird einzeln vorbereitet, 15 Minuten gültig und braucht die exakte Bestätigung. Keine Batch- oder Hintergrundwrites.</p></div></div>
          <div className="approvalBlocks">{plan.blocks.filter((block: any) => selectedBlocks.includes(block.id)).map((block: any) => <button key={block.id} onClick={() => prepareApproval(block)} disabled={busy !== "idle"}><I.FileCheck2 /><span><b>{block.title}</b><small>{formatMoment(block.start)} · {block.calendarName}</small></span><I.ArrowRight /></button>)}</div>
          {!selectedBlocks.length && <p className="muted">Im Review wurde kein Fokusblock zur Write-Vorbereitung ausgewählt.</p>}
        </Card>}
        {approval && <Card className="exactApproval">
          <Tag>LETZTE GRENZE · EIN EXTERNER WRITE</Tag><h3>{approval.exactChange.title}</h3>
          <dl><dt>Ziel</dt><dd>{approval.block.calendarName}</dd><dt>Start</dt><dd>{formatMoment(approval.exactChange.start)}</dd><dt>Ende</dt><dd>{formatMoment(approval.exactChange.end)}</dd><dt>Aktion</dt><dd>Neuen Termin erstellen · keine Gäste/kein Ort</dd></dl>
          <label>Zur Einzelbestätigung exakt eingeben<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="DIESEN_TERMIN_JETZT_SCHREIBEN" /></label>
          <Btn onClick={confirmation === "DIESEN_TERMIN_JETZT_SCHREIBEN" && busy === "idle" ? executeApprovedWrite : undefined}>Diesen einen Termin jetzt schreiben</Btn>
        </Card>}
        {history.length > 0 && <Card className="plannerHistory">
          <div className="row"><div><Tag>PLANHISTORIE · GEMEINSAM</Tag><h3>Letzte Planstände</h3></div><small>Keine Ereignistitel in der Übersicht</small></div>
          <div className="historyRows">{history.map((item) => <div key={item.id}><I.History /><span><b>{item.weekStart} bis {item.windowEnd}</b><small>{item.outcomeCount} Outcomes · {item.blockCount} Vorschläge · {item.bufferPercent}% Puffer</small></span><em>{item.status === "reviewed" ? `${item.selectedOutcomeCount} gewählt` : "Vorschlag"}</em></div>)}</div>
        </Card>}
      </>}
    </section>
  </>;
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
function MobileNav({ v, go }: any) {
  return (
    <div className="mobileNav">
      {[
        ["home", "Heute", I.Gauge],
        ["areas", "Bereiche", I.Orbit],
        ["inbox", "Erfassen", I.PlusCircle],
        ["habits", "Aufgaben", I.CheckSquare],
        ["weekly", "Woche", I.CalendarRange],
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
