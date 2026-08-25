"use client";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import * as I from "lucide-react";
import { systemProgress } from "@/data/system-progress";
import { runtimeHealthTransition, type RuntimeSourceState } from "@/lib/runtime-recovery";
import { privateApiFetch } from "@/lib/private-client";
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
const recordStatusLabel: Record<string, string> = { active: "Aktiv", planned: "Geplant", paused: "Pausiert", completed: "Abgeschlossen", archived: "Archiviert", metadata_only: "Nur Metadaten" };
const relationshipLabel: Record<string, string> = { family: "Familie", friend: "Freundschaft", romantic: "Romantisch", professional: "Beruflich", other: "Andere" };
const frequencyLabel: Record<string, string> = { weekly: "Wöchentlich", monthly: "Monatlich", quarterly: "Vierteljährlich", yearly: "Jährlich" };
const intensityLabel: Record<string, string> = { easy: "Leicht", moderate: "Moderat", hard: "Hart" };
const berlinDateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Berlin" });
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
const privateSourceFailure = (status: number) => status === 401 || status === 403 || status >= 500;
function useSharedRecords(kind:string){
  const[records,setRecords]=useState<any[]>([]),[state,setState]=useState<'loading'|'online'|'error'>('loading');
  const load=useCallback(async()=>{setState('loading');try{await privateApiFetch('/api/state/session',{method:'POST'});const response=await privateApiFetch(`/api/state/records/${kind}`,{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();setRecords(data.records||[]);setState('online')}catch{setRecords([]);setState('error')}},[kind]);
  useEffect(()=>{void load();const recover=()=>void load();window.addEventListener('agentic-os:runtime-online',recover);return()=>window.removeEventListener('agentic-os:runtime-online',recover)},[load]);
  useEffect(()=>{if(state!=="error")return;const recover=()=>void load();window.addEventListener("focus",recover);window.addEventListener("online",recover);return()=>{window.removeEventListener("focus",recover);window.removeEventListener("online",recover)}},[load,state]);
  const request=async(url:string,init:RequestInit,fallback:string)=>{if(state!=='online')throw new Error('Gemeinsamer Datenkern ist nicht schreibbereit');let response:Response;try{response=await privateApiFetch(url,init)}catch{setRecords([]);setState('error');throw new Error('Gemeinsamer Datenkern nicht erreichbar')}let result:any;try{result=await response.json()}catch{setRecords([]);setState('error');throw new Error('Ungültige Antwort des gemeinsamen Datenkerns')}if(!response.ok){if(response.status===409)await load();else if(response.status===401||response.status===403||response.status>=500){setRecords([]);setState('error')}throw new Error(result.error||fallback)}await load();return result};
  const create=async(data:any)=>request(`/api/state/records/${kind}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)},'Speichern fehlgeschlagen');
  const update=async(data:any)=>request(`/api/state/records/${kind}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(data)},'Aktualisieren fehlgeschlagen');
  const archive=async(id:string)=>{const version=records.find(record=>record.id===id)?.version;return request(`/api/state/records/${kind}?id=${encodeURIComponent(id)}&version=${encodeURIComponent(String(version??""))}`,{method:'DELETE'},'Archivieren fehlgeschlagen')};
  return{records:state==='online'?records:[],state,create,update,archive,reload:load};
}
export default function App() {
  const [v, setV] = useState<View>("home"),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState(""),
    [theme, setTheme] = useState<"dark" | "light">("dark"),
    [preferenceState, setPreferenceState] = useState<"loading" | "online" | "error">("loading"),
    [journal, setJournal] = useState(""),
    [legacyJournalDraftAvailable, setLegacyJournalDraftAvailable] = useState(false),
    [legacyJournalDraftLoaded, setLegacyJournalDraftLoaded] = useState(false),
    [mood, setMood] = useState("ruhig"),
    [runtimeHealth, setRuntimeHealth] = useState<any>({ state: "checking", checkedAt: null }),
    [brand, setBrand] = useState({
      name: "Agentic OS",
      short: "AOS",
      accent: "#27d3ff",
    });
  const contentRef = useRef<HTMLElement>(null);
  const runtimeStateRef = useRef<RuntimeSourceState>("checking");
  const preferenceVersions = useRef({ theme: 0, branding: 0 });
  const loadPreferences = useCallback(async () => {
    setPreferenceState("loading");
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error("Private Sitzung nicht erreichbar");
      const [themeResponse, brandingResponse] = await Promise.all([
        privateApiFetch("/api/state/preferences/theme", { cache: "no-store" }),
        privateApiFetch("/api/state/preferences/branding", { cache: "no-store" }),
      ]);
      if (!themeResponse.ok || !brandingResponse.ok) throw new Error("Gemeinsame Darstellung nicht erreichbar");
      const [themePreference, brandingPreference] = await Promise.all([themeResponse.json(), brandingResponse.json()]);
      preferenceVersions.current = { theme: Number(themePreference.version || 0), branding: Number(brandingPreference.version || 0) };
      setTheme(themePreference.value === "light" ? "light" : "dark");
      if (brandingPreference.value?.name) {
        setBrand(brandingPreference.value);
        store.set("brand", brandingPreference.value);
      }
      setPreferenceState("online");
    } catch (error) {
      setPreferenceState("error");
      throw error;
    }
  }, []);
  useEffect(() => {
    setLegacyJournalDraftAvailable(
      localStorage.getItem("aos:journal") !== null || localStorage.getItem("ns:journal") !== null,
    );
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
    void loadPreferences().catch(() => setTheme("dark"));
    const recoverPreferences = () => void loadPreferences().catch(() => undefined);
    window.addEventListener("agentic-os:runtime-online", recoverPreferences);
    return () => window.removeEventListener("agentic-os:runtime-online", recoverPreferences);
  }, [loadPreferences]);
  const importLegacyJournalDraft = () => {
    const legacy = store.get("journal", "");
    setJournal(typeof legacy === "string" ? legacy : "");
    setLegacyJournalDraftLoaded(true);
    setLegacyJournalDraftAvailable(false);
    note("Alter Entwurf nur in diese Sitzung übernommen · noch nicht gemeinsam gespeichert");
  };
  const discardLegacyJournalDraft = () => {
    localStorage.removeItem("aos:journal");
    localStorage.removeItem("ns:journal");
    setLegacyJournalDraftAvailable(false);
    setLegacyJournalDraftLoaded(false);
    note("Alte lokale Entwurfskopie verworfen");
  };
  const clearImportedJournalDraft = () => {
    if (!legacyJournalDraftLoaded) return;
    localStorage.removeItem("aos:journal");
    localStorage.removeItem("ns:journal");
    setLegacyJournalDraftLoaded(false);
  };
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
  const checkRuntimeHealth = useCallback(async () => {
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      const response = await privateApiFetch("/api/state/status", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      const transition = runtimeHealthTransition(runtimeStateRef.current, result.online ? "online" : "offline");
      runtimeStateRef.current = transition.state;
      setRuntimeHealth({ state: transition.state, checkedAt: new Date().toISOString() });
      if (transition.recovered) window.dispatchEvent(new Event("agentic-os:runtime-online"));
    } catch {
      runtimeStateRef.current = "offline";
      setRuntimeHealth({ state: "offline", checkedAt: new Date().toISOString() });
    }
  }, []);
  useEffect(() => {
    void checkRuntimeHealth();
    const interval = window.setInterval(checkRuntimeHealth, 30_000);
    const recheck = () => void checkRuntimeHealth();
    window.addEventListener("online", recheck);
    window.addEventListener("focus", recheck);
    return () => { window.clearInterval(interval); window.removeEventListener("online", recheck); window.removeEventListener("focus", recheck); };
  }, [checkRuntimeHealth]);
  const changeTheme = async (next: "dark" | "light") => {
    if (preferenceState !== "online") return note("Gemeinsame Darstellung ist noch nicht schreibbereit");
    const previous = theme;
    setTheme(next);
    try {
      await privateApiFetch("/api/state/session", { method: "POST" });
      const response = await privateApiFetch("/api/state/preferences/theme", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next, version: preferenceVersions.current.theme }),
      });
      const result = await response.json();
      if (response.status === 409) {
        await loadPreferences();
        note("Theme wurde inzwischen geändert · gemeinsamer Stand neu geladen");
        return;
      }
      if (!response.ok) { if (privateSourceFailure(response.status)) setPreferenceState("error"); throw new Error(result.error || "Theme konnte nicht gespeichert werden"); }
      preferenceVersions.current.theme = Number(result.version);
      note(`${next === "light" ? "Light" : "Dark"} Mode gemeinsam gespeichert`);
    } catch {
      setTheme(previous);
      note("Theme nicht gespeichert · gemeinsamer Stand bleibt unverändert");
    }
  };
  const saveBranding = async (next: { name: string; short: string; accent: string }) => {
    if (preferenceState !== "online") return note("Gemeinsame Darstellung ist noch nicht schreibbereit");
    try {
      await privateApiFetch("/api/state/session", { method: "POST" });
      const response = await privateApiFetch("/api/state/preferences/branding", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next, version: preferenceVersions.current.branding }),
      });
      const result = await response.json();
      if (response.status === 409) {
        await loadPreferences();
        note("Branding wurde inzwischen geändert · gemeinsamer Stand neu geladen");
        return;
      }
      if (!response.ok) { if (privateSourceFailure(response.status)) setPreferenceState("error"); throw new Error(result.error || "Branding konnte nicht gespeichert werden"); }
      preferenceVersions.current.branding = Number(result.version);
      setBrand(result.value);
      store.set("brand", result.value);
      note("Branding gemeinsam gespeichert");
    } catch (error) {
      note(error instanceof Error ? error.message : "Branding konnte nicht gespeichert werden");
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
            disabled={preferenceState !== "online"}
            onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            type="button"
          >
            {theme === "dark" ? <I.Sun /> : <I.Moon />}
          </button>
          <span className="avatar">E</span>
        </header>
        {runtimeHealth.state === "offline" && <div className="runtimeOffline" role="status"><I.WifiOff/><span><b>Gemeinsamer Datenkern nicht erreichbar</b>Eingaben bleiben in geöffneten Feldern, werden aber nicht als synchron gespeichert. Es gibt keinen stillen lokalen Ersatzstand.</span><button onClick={checkRuntimeHealth} type="button"><I.RefreshCw/>Erneut prüfen</button></div>}
        <section
          aria-label={title}
          className="content"
          ref={contentRef}
          tabIndex={-1}
        >
          {v === "home" && <Home go={navigate} />}{" "}
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
              setText={setJournal}
              mood={mood}
              setMood={setMood}
              legacyDraftAvailable={legacyJournalDraftAvailable}
              legacyDraftLoaded={legacyJournalDraftLoaded}
              importLegacyDraft={importLegacyJournalDraft}
              discardLegacyDraft={discardLegacyJournalDraft}
              onSharedJournalSaved={clearImportedJournalDraft}
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
              preferenceState={preferenceState}
              reloadPreferences={loadPreferences}
              save={saveBranding}
              note={note}
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
function RetryNotice({ message, onRetry, label = "Erneut laden" }: { message: string; onRetry: () => void; label?: string }) {
  return <div className="inlineRecovery" role="alert"><I.WifiOff/><span>{message}</span><button onClick={onRetry} type="button"><I.RefreshCw/>{label}</button></div>;
}
function Home({ go }: any) {
  const { records: tasks, state: taskState, reload: reloadTasks } = useSharedRecords("tasks");
  const [calendarState, setCalendarState] = useState("loading");
  const [plannerState, setPlannerState] = useState<any>({ state: "loading", plan: null });
  const [vaultState, setVaultState] = useState("loading");
  const [openaiApiState, setOpenaiApiState] = useState("loading");
  const loadHomeSources = useCallback(async () => {
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      const readSource = async (url: string) => {
        try {
          const response = await privateApiFetch(url, { cache: "no-store" });
          const result = await response.json();
          return { ok: response.ok, result };
        } catch {
          return { ok: false, result: null };
        }
      };
      const [calendar, planner, vault, openai] = await Promise.all([
        readSource("/api/calendar/status"),
        readSource("/api/planner"),
        readSource("/api/obsidian/status"),
        readSource("/api/openai/status"),
      ]);
      setCalendarState(calendar.ok ? (calendar.result.connected ? "online" : calendar.result.configured ? "offline" : "unconfigured") : "offline");
      setPlannerState({ state: planner.ok ? "online" : "offline", plan: planner.ok ? planner.result.plan || null : null });
      setVaultState(vault.ok && vault.result.status === "online" ? "online" : vault.ok && !vault.result.configured ? "unconfigured" : "offline");
      setOpenaiApiState(openai.ok && openai.result.mode === "api" && openai.result.configured && !openai.result.killSwitch ? "online" : openai.ok && !(openai.result.mode === "api" || openai.result.configured) ? "unconfigured" : "offline");
    } catch {
      setCalendarState("offline");
      setPlannerState({ state: "offline", plan: null });
      setVaultState("offline");
      setOpenaiApiState("offline");
    }
  }, []);
  useEffect(() => {
    void loadHomeSources();
    const recover=()=>void loadHomeSources();
    window.addEventListener("agentic-os:runtime-online",recover);
    return()=>window.removeEventListener("agentic-os:runtime-online",recover);
  }, [loadHomeSources]);
  const sourceLabel: Record<string, string> = { loading: "Wird geprüft", online: "Online", offline: "Nicht erreichbar", unconfigured: "Nicht konfiguriert" };
  const openTasks = tasks.filter((task: any) => !task.done && task.status !== "archived");
  return (
    <>
      <Intro eyebrow="DEIN SYSTEM AUF EINEN BLICK" title="Guten Abend, Emre.">
        <p>Was braucht heute wirklich deine Aufmerksamkeit?</p>
      </Intro>
      <p className="sourceLine"><I.Database /> Fokus, Aufgaben, Bereichszähler und Verbindungsstatus stammen aus gemeinsamen oder verifizierten Quellen.</p>
      {taskState==="error"&&<RetryNotice message="Die gemeinsame Aufgabenquelle ist gerade nicht erreichbar; es wird keine leere Prioritätenliste behauptet." onRetry={reloadTasks} label="Aufgaben neu laden"/>}
      <div className="focusrow">
        <Card className="now">
          <div className="row">
            <Tag>NÄCHSTER KLARER SCHRITT</Tag>
            <span className="pulse">Gemeinsamer Datenkern</span>
          </div>
          <h3>{taskState==="error"?"Aufgabenquelle nicht erreichbar":taskState==="loading"?"Aufgaben werden geladen":openTasks[0]?.title || "Noch keine Aufgabe priorisiert"}</h3>
          <p>{taskState==="error"?"Es wird keine leere Prioritätenliste behauptet. Nach Wiederverbindung lädt die gemeinsame Quelle neu.":taskState==="loading"?"Der gemeinsame Aufgabenbestand wird geprüft.":openTasks[0] ? `Bereich: ${openTasks[0].life_area || openTasks[0].area || "noch nicht zugeordnet"}` : "Erfasse eine konkrete Aufgabe; Agentic OS erfindet keine Priorität für dich."}</p>
          <Btn onClick={() => go("habits")}>
            Aufgaben öffnen <I.ArrowRight />
          </Btn>
        </Card>
        <Card className="day">
          <Tag>HEUTE · ECHTE QUELLEN</Tag>
          <div className="event"><I.CheckSquare /><span><b>{taskState==="online"?`${openTasks.length} offene Aufgaben`:taskState==="loading"?"Aufgaben werden geladen":"Aufgaben nicht erreichbar"}</b><small>Laptop Shared Store</small></span></div>
          <div className="event"><I.CalendarDays /><span><b>Google Calendar · {sourceLabel[calendarState]}</b><small>Termine werden erst in der Kalenderansicht gelesen</small></span></div>
          <div className="event"><I.Network /><span><b>Obsidian · {sourceLabel[vaultState]}</b><small>Read-only Wissensindex</small></span></div>
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
            <b>{taskState === "online" ? `${openTasks.length} offen` : taskState==="loading"?"Lädt …":"Offline"}</b>
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
            ["OpenAI API", openaiApiState],
            ["Obsidian", vaultState],
          ].map((x) => (
            <div className="statusline" key={x[0]}>
              <i className={x[1]} />
              {x[0]}
              <small>{sourceLabel[x[1]] || "Nicht verifiziert"}</small>
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
  const { records, state, reload } = useSharedRecords("area_records");
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
      {state==="error"&&<RetryNotice message="Die gemeinsamen Bereichsdaten sind gerade nicht erreichbar; alle Zähler bleiben unverifiziert." onRetry={reload} label="Bereiche neu laden"/>}
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
            <p className="areaCount">{count === null ? "Eigenständiger Projektbereich" : state==="online"?`${count} gemeinsame Einträge`:state==="loading"?"Einträge werden geladen":"Einträge nicht erreichbar"}</p>
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

function DomainInsights({area,records,openCreate}:{area:AreaRecordConfig["area"];records:any[];openCreate:(preset?:any)=>void}){
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),number=(value:any)=>Number(String(value||"0").replace(",","."))||0;
  if(area==="faith"){
    const prayers=records.filter(record=>record.recordType==="practice"&&record.date===today),completed=new Set(prayers.filter(record=>record.completed).map(record=>record.prayerName)),quran=records.filter(record=>record.recordType==="quran"&&number(record.quranPage)>0).sort((a,b)=>String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt)))[0];
    return <Card className="domainCommand faithCommand"><div className="row"><div><Tag>PRAXIS · HEUTE</Tag><h3>{completed.size}/5 freiwillig erfasst</h3></div><button onClick={()=>openCreate({recordType:"practice",date:today})}><I.Plus/>Gebet festhalten</button></div><div className="prayerTrack">{[["fajr","Fajr"],["dhuhr","Dhuhr"],["asr","ʿAsr"],["maghrib","Maghrib"],["isha","ʿIschāʾ"]].map(([id,label])=><span className={completed.has(id)?"complete":""} key={id}><I.MoonStar/><b>{label}</b><small>{completed.has(id)?"Erfasst":"Offen / nicht erfasst"}</small></span>)}</div><div className="faithLower"><span><I.BookOpen/><b>Qurʾān-Fortschritt</b>{quran?<><strong>Seite {quran.quranPage} von 604</strong><progress max="604" value={number(quran.quranPage)}/><small>{quran.date||"Datum nicht gesetzt"} · nur eigener Verlauf</small></>:<small>Noch kein echter Lesestand erfasst.</small>}</span><span><I.HandHeart/><b>Duʿās & Reflexion</b><strong>{records.filter(record=>record.recordType==="dua"||record.recordType==="reflection").length} Einträge</strong><small>Persönlich, nicht autoritativ.</small></span></div><small className="domainDisclaimer"><I.MapPinOff/>Keine Standortautomatik oder Gebetszeit-Berechnung aktiv. Dieser Bereich dokumentiert nur Emres eigene Praxis.</small></Card>;
  }
  if(area==="health"){
    const training=records.filter(record=>record.recordType==="training"),recovery=records.filter(record=>record.recordType==="recovery"),nutrition=records.filter(record=>record.recordType==="nutrition"),recent=[...records].filter(record=>record.date).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7),avgRecovery=recovery.filter(record=>number(record.recoveryScore)>0);
    return <Card className="domainCommand healthCommand"><div className="row"><div><Tag>TRAINING · RECOVERY · NUTRITION</Tag><h3>Nur eigene organisatorische Daten</h3></div><button onClick={()=>openCreate({recordType:"training",date:today})}><I.Plus/>Training erfassen</button></div><div className="domainMetrics"><span><b>{training.length}</b>Trainings</span><span><b>{training.reduce((sum,record)=>sum+number(record.durationMinutes),0)}</b>Minuten erfasst</span><span><b>{avgRecovery.length?(avgRecovery.reduce((sum,record)=>sum+number(record.recoveryScore),0)/avgRecovery.length).toFixed(1):"—"}</b>Recovery Ø / 5</span><span><b>{nutrition.length}</b>Ernährungseinträge</span></div>{recent.length?<div className="healthBars" aria-label="Letzte echte Gesundheitswerte">{recent.map(record=>{const value=record.recordType==="recovery"?number(record.recoveryScore)*20:record.recordType==="training"?Math.min(100,number(record.durationMinutes)/1.2):35;return <span key={record.id}><i style={{height:`${Math.max(8,value)}%`}}/><small>{record.date.slice(5)}</small></span>})}</div>:<div className="honestEmpty"><I.ChartNoAxesColumn/><span><b>Noch keine Daten für eine Verlaufsgrafik</b>Die Grafik erscheint erst aus selbst erfassten Werten.</span></div>}<small className="domainDisclaimer"><I.ShieldCheck/>Organisation, keine Diagnose oder medizinische Fachberatung. Keine Health-Plattform verbunden.</small></Card>;
  }
  if(area==="finance"){
    const byCurrency=new Map<string,{income:number;expense:number;accounts:number;goals:number}>();for(const record of records){const currency=record.currency||"EUR",bucket=byCurrency.get(currency)||{income:0,expense:0,accounts:0,goals:0},amount=number(record.amount);if(record.recordType==="income")bucket.income+=amount;if(record.recordType==="expense")bucket.expense+=amount;if(record.recordType==="account")bucket.accounts++;if(record.recordType==="goal")bucket.goals++;byCurrency.set(currency,bucket)}
    return <Card className="domainCommand financeCommand"><div className="row"><div><Tag>MANUELLE FINANZÜBERSICHT</Tag><h3>Keine Bankverbindung · keine Transaktionen</h3></div><button onClick={()=>openCreate({recordType:"account"})}><I.Plus/>Container erfassen</button></div>{byCurrency.size?<div className="financeTotals">{[...byCurrency.entries()].map(([currency,bucket])=><span key={currency}><b>{currency}</b><strong>{bucket.income.toLocaleString("de-DE",{minimumFractionDigits:2})} Einnahmen</strong><small>{bucket.expense.toLocaleString("de-DE",{minimumFractionDigits:2})} Ausgaben · {bucket.accounts} Container · {bucket.goals} Ziele</small></span>)}</div>:<div className="honestEmpty"><I.WalletCards/><span><b>Noch keine berechenbaren Finanzwerte</b>Es werden weder Kontostände noch Budgets erfunden.</span></div>}<div className="financeCounts"><span><b>{records.filter(record=>record.recordType==="budget").length}</b>Budgets</span><span><b>{records.filter(record=>record.recordType==="recurring").length}</b>Wiederkehrend</span><span><b>{records.filter(record=>record.recordType==="goal").length}</b>Sparziele</span></div><small className="domainDisclaimer"><I.Lock/>Manuelle private Übersicht, keine Finanzberatung, Anlageentscheidung oder Geldbewegung.</small></Card>;
  }
  if(area==="relations"){
    const people=records.filter(record=>record.recordType==="person"),birthdays=records.filter(record=>record.birthday||record.recordType==="birthday").sort((a,b)=>String(a.birthday||a.date||"").slice(5).localeCompare(String(b.birthday||b.date||"").slice(5))).slice(0,6),followups=records.filter(record=>record.nextFollowUp||record.recordType==="follow_up").sort((a,b)=>String(a.nextFollowUp||a.date||"9999").localeCompare(String(b.nextFollowUp||b.date||"9999"))).slice(0,6),positions=[[50,15],[76,27],[83,57],[65,80],[35,80],[17,57],[24,27],[50,50]];
    return <Card className="domainCommand relationCommand"><div className="row"><div><Tag>PRIVATE PERSONENÜBERSICHT</Tag><h3>{people.length} bewusst erfasste Personen</h3></div><button onClick={()=>openCreate({recordType:"person"})}><I.Plus/>Person erfassen</button></div>{people.length?<div className="relationshipConstellation" aria-label="Private Beziehungskonstellation">{people.slice(0,8).map((person,index)=>{const slot=Math.max(1,Math.min(8,Number(person.constellationSlot)||index+1))-1,[left,top]=positions[slot];return <span key={person.id} style={{left:`${left}%`,top:`${top}%`}}><i>{String(person.title||"?").slice(0,1).toUpperCase()}</i><b>{person.title}</b><small>{person.relationshipCategory||"ohne Kategorie"}</small></span>})}</div>:<div className="honestEmpty"><I.UsersRound/><span><b>Noch keine Personenansicht</b>Avatare erscheinen nur aus echten privaten Datensätzen.</span></div>}<div className="relationshipLists"><span><b>Geburtstage</b>{birthdays.length?birthdays.map(record=><small key={record.id}>{record.title} · {record.birthday||record.date}</small>):<small>Keine Daten erfasst.</small>}</span><span><b>Follow-ups</b>{followups.length?followups.map(record=><small key={record.id}>{record.title} · {record.nextFollowUp||record.date||"ohne Datum"}</small>):<small>Keine Follow-ups erfasst.</small>}</span></div><small className="domainDisclaimer"><I.MessageCircleOff/>Keine Nachricht oder Erinnerung wird automatisch versendet. Private Notizen bleiben außerhalb von Logs.</small></Card>;
  }
  return null;
}

function AreaRecordWorkspace({ config, note }: { config: AreaRecordConfig; note: (message: string) => void }) {
  const { records: allRecords, state, create, update, archive, reload } = useSharedRecords("area_records");
  const records = allRecords.filter((record: any) => record.area === config.area);
  const emptyForm = () => ({ title: "", recordType: config.types[0][0], status: "active", details: "", date: "", amount: "", targetAmount:"", currency: "EUR", track: config.tracks?.[0][0] || "",prayerName:"fajr",completed:false,quranPage:"",pagesRead:"",durationMinutes:"",intensity:"moderate",recoveryScore:"",sleepHours:"",mealType:"",metricValue:"",unit:"",category:"",frequency:"monthly",birthday:"",lastContact:"",nextFollowUp:"",relationshipCategory:"family",constellationSlot:"1" });
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const typeLabel = (value: string) => config.types.find(([id]) => id === value)?.[1] || value;
  const trackLabel = (value: string) => config.tracks?.find(([id]) => id === value)?.[1] || value;
  const openCreate = (preset?: string|Record<string,unknown>) => {
    setEditingId(null);
    setForm({ ...emptyForm(), ...(typeof preset==="string"?{track:preset}:preset||{}) });
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
      <span><Tag>{typeLabel(record.recordType)}</Tag><i>{recordStatusLabel[record.status] || "Nicht verifiziert"}</i></span>
      <b>{record.title}</b>
      <small>{record.date || "Kein Datum"}</small>
    </button>
  );
  return (
    <div className={`domain ${config.className}`}>
      <Intro eyebrow={config.eyebrow} title={config.title} action={<Btn onClick={state==="online"?() => openCreate():undefined}><I.Plus /> Eintrag</Btn>}>
        <p>{config.description}</p>
      </Intro>
      <p className="privacyBoundary"><I.ShieldCheck /> {config.privacy}</p>
      {state==="online"&&<DomainInsights area={config.area} records={records} openCreate={openCreate}/>}
      {state === "online" && editorOpen && (
        <Card className="areaRecordEditor">
          <div className="row"><Tag>{editingId ? "EINTRAG BEARBEITEN" : "NEUER EINTRAG"}</Tag><button aria-label="Editor schließen" onClick={() => setEditorOpen(false)} type="button"><I.X /></button></div>
          <div className="areaFormGrid">
            <label>Titel<input autoFocus maxLength={120} onChange={(event) => setForm({ ...form, title: event.target.value })} value={form.title} /></label>
            <label>Typ<select onChange={(event) => setForm({ ...form, recordType: event.target.value })} value={form.recordType}>{config.types.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            {config.tracks && <label>Karrierepfad<select onChange={(event) => setForm({ ...form, track: event.target.value })} value={form.track}>{config.tracks.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
            <label>Status<select onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}><option value="active">Aktiv</option><option value="planned">Geplant</option><option value="paused">Pausiert</option></select></label>
            <label>Datum (optional)<input onChange={(event) => setForm({ ...form, date: event.target.value })} type="date" value={form.date} /></label>
            {config.area==="faith"&&form.recordType==="practice"&&<><label>Gebet<select value={form.prayerName} onChange={event=>setForm({...form,prayerName:event.target.value})}><option value="fajr">Fajr</option><option value="dhuhr">Dhuhr</option><option value="asr">ʿAsr</option><option value="maghrib">Maghrib</option><option value="isha">ʿIschāʾ</option><option value="other">Andere Praxis</option></select></label><label className="checkField"><input checked={Boolean(form.completed)} onChange={event=>setForm({...form,completed:event.target.checked})} type="checkbox"/>Als selbst erfasst markieren</label></>}
            {config.area==="faith"&&form.recordType==="quran"&&<><label>Aktuelle Seite<input inputMode="numeric" min="1" max="604" type="number" value={form.quranPage} onChange={event=>setForm({...form,quranPage:event.target.value})}/></label><label>Heute gelesene Seiten<input inputMode="numeric" min="1" max="604" type="number" value={form.pagesRead} onChange={event=>setForm({...form,pagesRead:event.target.value})}/></label></>}
            {config.area==="health"&&form.recordType==="training"&&<><label>Dauer in Minuten<input inputMode="numeric" min="1" max="1440" type="number" value={form.durationMinutes} onChange={event=>setForm({...form,durationMinutes:event.target.value})}/></label><label>Intensität<select value={form.intensity} onChange={event=>setForm({...form,intensity:event.target.value})}><option value="easy">Leicht</option><option value="moderate">Moderat</option><option value="hard">Hart</option></select></label></>}
            {config.area==="health"&&form.recordType==="recovery"&&<><label>Recovery 1–5<input inputMode="numeric" min="1" max="5" type="number" value={form.recoveryScore} onChange={event=>setForm({...form,recoveryScore:event.target.value})}/></label><label>Schlafstunden<input inputMode="decimal" min="0" max="24" step="0.25" type="number" value={form.sleepHours} onChange={event=>setForm({...form,sleepHours:event.target.value})}/></label></>}
            {config.area==="health"&&form.recordType==="nutrition"&&<label>Eintragsart<input maxLength={80} value={form.mealType} onChange={event=>setForm({...form,mealType:event.target.value})} placeholder="z. B. Mahlzeit oder Vorbereitung"/></label>}
            {config.area==="health"&&form.recordType==="measurement"&&<><label>Wert<input inputMode="decimal" value={form.metricValue} onChange={event=>setForm({...form,metricValue:event.target.value})}/></label><label>Einheit<input maxLength={30} value={form.unit} onChange={event=>setForm({...form,unit:event.target.value})}/></label></>}
            {config.area === "finance" && <><label>Betrag (optional)<input inputMode="decimal" onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0,00" value={form.amount} /></label><label>Währung<select onChange={(event) => setForm({ ...form, currency: event.target.value })} value={form.currency}><option value="EUR">EUR</option><option value="USD">USD</option></select></label><label>Kategorie<input maxLength={80} value={form.category} onChange={event=>setForm({...form,category:event.target.value})} placeholder="Nur eigene Kategorie"/></label>{form.recordType==="goal"&&<label>Zielbetrag<input inputMode="decimal" value={form.targetAmount} onChange={event=>setForm({...form,targetAmount:event.target.value})}/></label>}{form.recordType==="recurring"&&<label>Rhythmus<select value={form.frequency} onChange={event=>setForm({...form,frequency:event.target.value})}><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option><option value="quarterly">Quartalsweise</option><option value="yearly">Jährlich</option></select></label>}</>}
            {config.area==="relations"&&<><label>Kategorie<select value={form.relationshipCategory} onChange={event=>setForm({...form,relationshipCategory:event.target.value})}><option value="family">Familie</option><option value="friend">Freundschaft</option><option value="romantic">Romantisch</option><option value="professional">Beruflich</option><option value="other">Andere</option></select></label><label>Geburtstag<input type="date" value={form.birthday} onChange={event=>setForm({...form,birthday:event.target.value})}/></label><label>Letzter Kontakt<input type="date" value={form.lastContact} onChange={event=>setForm({...form,lastContact:event.target.value})}/></label><label>Nächstes Follow-up<input type="date" value={form.nextFollowUp} onChange={event=>setForm({...form,nextFollowUp:event.target.value})}/></label>{form.recordType==="person"&&<label>Platz in Konstellation<select value={form.constellationSlot} onChange={event=>setForm({...form,constellationSlot:event.target.value})}>{[1,2,3,4,5,6,7,8].map(slot=><option value={slot} key={slot}>Position {slot}</option>)}</select></label>}</>}
          </div>
          <label>Details (privat verschlüsselt)<textarea maxLength={4000} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="Nur das festhalten, was dir wirklich hilft …" value={form.details} /></label>
          <div className="editorActions"><Btn onClick={form.title.trim().length>=2?save:undefined}>Speichern</Btn><button onClick={() => setEditorOpen(false)} type="button">Abbrechen</button></div>
        </Card>
      )}
      {state === "loading" && <p role="status">Gemeinsame Bereichsdaten werden geladen …</p>}
      {state === "error" && <RetryNotice message="Gemeinsamer Datenkern nicht erreichbar. Es werden keine Ersatz- oder Beispieldaten angezeigt." onRetry={reload} label="Bereich neu laden"/>}
      {state === "online" && records.length === 0 && <Card className="trueEmpty"><I.Database /><div><Tag>ECHTE DATENQUELLE · LEER</Tag><h3>Noch keine Einträge</h3><p>Lege nur an, was für diesen Bereich tatsächlich nützlich ist.</p></div><Btn onClick={() => openCreate()}><I.Plus /> Ersten Eintrag anlegen</Btn></Card>}
      {state==="online" && selected && (
        <Card className="areaRecordDetail">
          <button className="backButton" onClick={() => setSelected(null)} type="button">← Übersicht</button>
          <div className="row"><Tag>{typeLabel(selected.recordType)}</Tag><i className="badge unconfigured">{recordStatusLabel[selected.status] || "Nicht verifiziert"}</i></div>
          <h2>{selected.title}</h2>
          {selected.track && <p><b>Pfad:</b> {trackLabel(selected.track)}</p>}
          {selected.date && <p><b>Datum:</b> {selected.date}</p>}
          {selected.amount && <p><b>Betrag:</b> {selected.amount} {selected.currency}</p>}
          {selected.prayerName&&<p><b>Gebet/Praxis:</b> {selected.prayerName} · {selected.completed?"selbst erfasst":"nicht als abgeschlossen markiert"}</p>}
          {selected.quranPage&&<p><b>Qurʾān:</b> Seite {selected.quranPage}{selected.pagesRead?` · ${selected.pagesRead} Seiten gelesen`:""}</p>}
          {selected.durationMinutes&&<p><b>Training:</b> {selected.durationMinutes} Minuten · {intensityLabel[selected.intensity]||"Intensität nicht gesetzt"}</p>}
          {selected.recoveryScore&&<p><b>Recovery:</b> {selected.recoveryScore}/5{selected.sleepHours?` · ${selected.sleepHours} h Schlaf`:""}</p>}
          {selected.metricValue&&<p><b>Messwert:</b> {selected.metricValue} {selected.unit}</p>}
          {selected.category&&<p><b>Kategorie:</b> {selected.category}</p>}
          {selected.targetAmount&&<p><b>Zielbetrag:</b> {selected.targetAmount} {selected.currency}</p>}
          {selected.frequency&&config.area==="finance"&&<p><b>Rhythmus:</b> {frequencyLabel[selected.frequency] || "Nicht verifiziert"}</p>}
          {selected.relationshipCategory&&<p><b>Beziehung:</b> {relationshipLabel[selected.relationshipCategory] || "Nicht verifiziert"}</p>}
          {selected.birthday&&<p><b>Geburtstag:</b> {selected.birthday}</p>}
          {selected.lastContact&&<p><b>Letzter Kontakt:</b> {selected.lastContact}</p>}
          {selected.nextFollowUp&&<p><b>Nächstes Follow-up:</b> {selected.nextFollowUp}</p>}
          <p className="recordDetails">{selected.details || "Keine privaten Details hinterlegt."}</p>
          <small>Gemeinsamer privater Datensatz · Version {selected.version}</small>
          <div className="editorActions"><Btn onClick={() => openEdit(selected)}>Bearbeiten</Btn><button className="dangerQuiet" onClick={archiveSelected} type="button">Archivieren</button></div>
        </Card>
      )}
      {state==="online" && !selected && config.tracks ? (
        <div className="careerRecordsSplit">
          {config.tracks.map(([track, label]) => <section key={track}><div className="pathTitle"><span>{track === "employee" ? <I.Building2 /> : <I.Rocket />}</span><div><Tag>{label.toUpperCase()}</Tag><h3>{records.filter((record: any) => record.track === track).length} Einträge</h3></div><button onClick={() => openCreate(track)} type="button"><I.Plus /></button></div><div className="areaRecordGrid">{records.filter((record: any) => record.track === track).map(renderRecord)}</div>{records.every((record: any) => record.track !== track) && <p className="columnEmpty">Noch keine Einträge für diesen Pfad.</p>}</section>)}
        </div>
      ) : state==="online" && !selected && records.length > 0 ? <div className="areaRecordGrid">{records.map(renderRecord)}</div> : null}
    </div>
  );
}
function Faith({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.faith} note={note} />; }
function Career({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.career} note={note} />; }
function Health({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.health} note={note} />; }
function Finance({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.finance} note={note} />; }
function Relations({ note }: any) { return <AreaRecordWorkspace config={areaRecordConfigs.relations} note={note} />; }
function Projects({ note }: any) {
  const [view, setView] = useState<"grid" | "list">("grid"), [showCreate, setShowCreate] = useState(false), [selectedId, setSelectedId] = useState(""), [tab, setTab] = useState<"overview" | "tasks" | "inbox" | "resources" | "history">("overview"), [workspace, setWorkspace] = useState<any>(null), [workspaceState, setWorkspaceState] = useState<"idle" | "loading" | "online" | "error">("idle"), [editing, setEditing] = useState(false),[projectArchiveArmed,setProjectArchiveArmed]=useState(false);
  const [draft, setDraft] = useState<any>({ title: "", goal: "", description: "", nextAction: "", dueDate: "", status: "planned" }), [taskDraft, setTaskDraft] = useState({ title: "", dueAt: "", priority: "medium" }), [inboxDraft, setInboxDraft] = useState(""), [resourceDraft,setResourceDraft]=useState({title:"",kind:"link",reference:""}),[revealedResourceId,setRevealedResourceId]=useState("");
  const { records: projects, state, create: createProject, update: updateProject, archive: archiveProject, reload: reloadProjects } = useSharedRecords("projects");
  const { records: tasks, state: taskState, create: createTask, update: updateTask, reload: reloadTasks } = useSharedRecords("tasks");
  const { records: inbox, state: inboxState, create: createInbox, update: updateInbox, reload: reloadInbox } = useSharedRecords("inbox_items");
  const selected = projects.find((project: any) => project.id === selectedId);
  const projectTasks = tasks.filter((task: any) => task.projectId === selectedId);
  const projectInbox = inbox.filter((item: any) => item.projectId === selectedId);
  const projectResources = projectInbox.filter((item:any)=>["link","dateiverweis"].includes(String(item.itemType)));
  const projectNotes = projectInbox.filter((item:any)=>!["link","dateiverweis"].includes(String(item.itemType)));
  const unassignedInbox = inbox.filter((item: any) => !item.projectId && item.status !== "archived");
  const statusLabel: Record<string, string> = { active: "Aktiv", planned: "Geplant", paused: "Pausiert", completed: "Abgeschlossen" };
  const loadWorkspace = useCallback(async () => {
    if (!selectedId) { setWorkspace(null); setWorkspaceState("idle"); return; }
    setWorkspace(null);
    setWorkspaceState("loading");
    try {
      const response = await privateApiFetch(`/api/projects/${encodeURIComponent(selectedId)}/workspace`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setWorkspace(result); setWorkspaceState("online");
    } catch { setWorkspace(null); setWorkspaceState("error"); }
  }, [selectedId]);
  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => { if (selected) setDraft({ title: selected.title || "", goal: selected.goal || "", description: selected.description || "", nextAction: selected.nextAction || "", dueDate: selected.dueDate || "", status: selected.status || "planned" }); }, [selected]);
  const addProject = async () => { try { const created = await createProject({ ...draft, status: draft.status || "planned" }); setShowCreate(false); setSelectedId(created.id); setTab("overview"); note("Projekt im gemeinsamen Arbeitsraum angelegt"); } catch (error) { note(error instanceof Error ? error.message : "Projekt konnte nicht gespeichert werden"); } };
  const saveProject = async () => { if (!selected) return; try { await updateProject({ ...selected, ...draft }); setEditing(false); await loadWorkspace(); note("Projekt gemeinsam aktualisiert"); } catch (error) { note(error instanceof Error ? error.message : "Projekt konnte nicht aktualisiert werden"); } };
  const addTask = async () => { if (!selectedId || taskDraft.title.trim().length < 2) return note("Aufgabe benötigt mindestens zwei Zeichen"); try { await createTask({ title: taskDraft.title.trim(), dueAt: taskDraft.dueAt || undefined, priority: taskDraft.priority, projectId: selectedId, area: "Projekte", status: "active", done: false }); setTaskDraft({ title: "", dueAt: "", priority: "medium" }); await loadWorkspace(); note("Projektaufgabe gemeinsam gespeichert"); } catch (error) { note(error instanceof Error ? error.message : "Aufgabe konnte nicht gespeichert werden"); } };
  const addInbox = async () => { if (!selectedId || inboxDraft.trim().length < 2) return note("Inbox-Eintrag benötigt mindestens zwei Zeichen"); try { await createInbox({ title: inboxDraft.trim(), itemType: "note", projectId: selectedId, area: "Projekte", status: "active" }); setInboxDraft(""); await loadWorkspace(); note("Inbox-Eintrag dem Projekt zugeordnet"); } catch (error) { note(error instanceof Error ? error.message : "Inbox-Eintrag konnte nicht gespeichert werden"); } };
  const addResource=async()=>{const title=resourceDraft.title.trim(),reference=resourceDraft.reference.trim();if(title.length<2||reference.length<2)return note("Ressource benötigt Titel und privaten Verweis");try{await createInbox({title,content:reference,itemType:resourceDraft.kind,projectId:selectedId,area:"Projekte",status:"active"});setResourceDraft({title:"",kind:"link",reference:""});await loadWorkspace();note("Ressourcenverweis privat gespeichert")}catch(error){note(error instanceof Error?error.message:"Ressourcenverweis konnte nicht gespeichert werden")}};
  const toggleTask = async (task: any) => { try { await updateTask({ ...task, done: !task.done, status: !task.done ? "completed" : "active" }); await loadWorkspace(); } catch (error) { note(error instanceof Error ? error.message : "Aufgabe konnte nicht aktualisiert werden"); } };
  const linkInbox = async (item: any, projectId: string) => { try { await updateInbox({ ...item, projectId, area: projectId ? "Projekte" : "Inbox" }); await loadWorkspace(); note(projectId ? "Inbox-Eintrag zugeordnet" : "Zuordnung gelöst"); } catch (error) { note(error instanceof Error ? error.message : "Inbox-Zuordnung konnte nicht aktualisiert werden"); } };
  const archiveSelectedProject=async()=>{if(!selected||!projectArchiveArmed)return;try{await archiveProject(selected.id);setSelectedId("");setWorkspace(null);setProjectArchiveArmed(false);note("Projekt reversibel archiviert")}catch(error){setProjectArchiveArmed(false);note(error instanceof Error?error.message:"Projekt konnte nicht archiviert werden")}};
  const openProject = (id: string) => { setSelectedId(id); setTab("overview"); setEditing(false); setProjectArchiveArmed(false); };
  return (
    <>
      <Intro
        eyebrow="GEMEINSAMER PROJEKTARBEITSRAUM"
        title={selected ? selected.title : "Projekte mit klarem nächsten Schritt."}
        action={
          selected ? <Btn soft onClick={() => { setSelectedId(""); setWorkspace(null); }}>← Übersicht</Btn> : <Btn onClick={state === "online" ? () => { setDraft({ title: "", goal: "", description: "", nextAction: "", dueDate: "", status: "planned" }); setShowCreate(true); } : undefined}><I.Plus /> Projekt</Btn>
        }
      ><p>{selected ? "Ziel, nächste Aktionen, Aufgaben, Inbox, Ressourcen und Verlauf aus einer gemeinsamen Quelle." : "Keine Demo-Boards: nur echte Vorhaben, verknüpfte Arbeit und ehrliche Leerzustände."}</p></Intro>
      {state === "online" && showCreate && <ProjectEditor draft={draft} setDraft={setDraft} onSave={addProject} onCancel={() => setShowCreate(false)} title="Neues Projekt" />}
      {state==='loading'&&<p role="status">Gemeinsame Projekte werden geladen …</p>}
      {state==='error'&&<RetryNotice message="Der gemeinsame Projektbestand ist gerade nicht erreichbar; es werden keine Projektkarten ersetzt oder erfunden." onRetry={reloadProjects} label="Projekte neu laden"/>}
      {state==='online'&&!selected&&projects.length===0&&<Card className="honestEmpty"><I.FolderKanban/><span><b>Noch keine gemeinsamen Projekte</b>Lege ein echtes Projekt mit Ziel oder nächster Aktion an. Agentic OS erzeugt keine Beispielkarten.</span></Card>}
      {!selected && projects.length > 0 && <><div className="projectToolbar"><span><b>{projects.length}</b> echte Projekte · Laptop Shared Store</span><div role="group" aria-label="Projektansicht"><button aria-pressed={view==="grid"} onClick={()=>setView("grid")}><I.LayoutGrid/>Karten</button><button aria-pressed={view==="list"} onClick={()=>setView("list")}><I.List/>Liste</button></div></div><div className={`projectWorkspaceGrid ${view}`}>
        {projects.map((project:any, index:number) => { const linkedTasks=tasks.filter((task:any)=>task.projectId===project.id), open=linkedTasks.filter((task:any)=>!task.done).length, linkedInbox=inbox.filter((item:any)=>item.projectId===project.id).length; return <button className="projectOpen" key={project.id} onClick={()=>openProject(project.id)}><Card><div className="row"><span className={"projectSymbol s"+index}><I.FolderKanban/></span><em>{statusLabel[project.status]||project.status}</em></div><h3>{project.title}</h3><p>{project.goal||"Ziel noch nicht festgelegt"}</p><div className="projectFacts"><span><b>{taskState==="online"?open:"—"}</b>{taskState==="online"?" offene Aufgaben":taskState==="loading"?" Aufgaben werden geladen":" Aufgaben nicht erreichbar"}</span><span><b>{inboxState==="online"?linkedInbox:"—"}</b>{inboxState==="online"?" Inbox-Verknüpfungen":inboxState==="loading"?" Inbox wird geladen":" Inbox nicht erreichbar"}</span></div><div className="nextAction"><small>NÄCHSTE AKTION</small><b>{project.nextAction||"Noch nicht festgelegt"}</b></div></Card></button>; })}
      </div></>}
      {selected && <section className="projectWorkspace" aria-label={`Projekt ${selected.title}`}>
        <div className="projectHero card"><div><Tag>{statusLabel[selected.status]||selected.status}</Tag><h2>{selected.title}</h2><p>{selected.goal||"Für dieses Projekt wurde noch kein Ziel formuliert."}</p></div><div className="projectHeroActions"><button onClick={()=>{setEditing(true);setProjectArchiveArmed(false)}}><I.Pencil/>Projekt bearbeiten</button>{!projectArchiveArmed?<button className="dangerQuiet" onClick={()=>setProjectArchiveArmed(true)}><I.Archive/>Archivieren …</button>:<button className="dangerQuiet" onClick={archiveSelectedProject}><I.ShieldAlert/>Archivierung bestätigen</button>}{selected.dueDate&&<span><I.CalendarDays/>{new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Berlin"}).format(new Date(`${selected.dueDate}T12:00:00Z`))}</span>}</div></div>
        {editing&&<ProjectEditor draft={draft} setDraft={setDraft} onSave={saveProject} onCancel={()=>setEditing(false)} title="Projekt bearbeiten"/>}
        <div className="projectTabs" role="tablist" aria-label="Projektarbeitsraum">{[["overview","Überblick",I.Gauge],["tasks","Aufgaben",I.ListChecks],["inbox","Inbox",I.Inbox],["resources","Ressourcen",I.Paperclip],["history","Verlauf",I.History]].map(([id,label,Icon]:any)=><button aria-selected={tab===id} className={tab===id?"active":""} key={id} onClick={()=>setTab(id)} role="tab"><Icon/>{label}{id==="tasks"&&<small>{projectTasks.length}</small>}{id==="inbox"&&<small>{projectNotes.length}</small>}{id==="resources"&&<small>{projectResources.length}</small>}</button>)}</div>
        {workspaceState==="error"&&<RetryNotice message="Verlauf und Wochenplanbezug sind gerade nicht erreichbar; Projektdaten bleiben verfügbar." onRetry={loadWorkspace}/>}
        {tab==="overview"&&<div className="projectDetailGrid"><Card><Tag>ZIEL & AUSRICHTUNG</Tag><h3>{selected.goal||"Ziel noch offen"}</h3><p>{selected.description||"Noch keine zusätzliche Projektbeschreibung."}</p></Card><Card className="projectNext"><Tag>NÄCHSTE AKTION</Tag><h3>{selected.nextAction||"Noch nicht festgelegt"}</h3><p>{selected.nextAction?"Diese Aktion kann beim nächsten Wochenplan als Projektquelle priorisiert werden.":"Bearbeite das Projekt und formuliere einen konkreten nächsten Schritt."}</p><Btn soft onClick={()=>setEditing(true)}>Nächste Aktion festlegen</Btn></Card><Card><Tag>ARBEITSSTAND · ECHT</Tag><div className="projectMetric"><span><b>{taskState==="online"?projectTasks.filter((task:any)=>!task.done).length:"—"}</b>{taskState==="online"?"offene Aufgaben":taskState==="loading"?"Aufgaben laden":"Aufgaben offline"}</span><span><b>{taskState==="online"?projectTasks.filter((task:any)=>task.done).length:"—"}</b>{taskState==="online"?"erledigt":"nicht verifiziert"}</span><span><b>{inboxState==="online"?projectNotes.length:"—"}</b>{inboxState==="online"?"Inbox":"Inbox offline"}</span><span><b>{inboxState==="online"?projectResources.length:"—"}</b>{inboxState==="online"?"Ressourcen":"nicht verifiziert"}</span></div></Card><Card><Tag>WOCHENPLANBEZUG</Tag>{workspaceState==="loading"&&<p role="status">Wochenplanbezug wird geladen …</p>}{workspaceState==="online"&&workspace?.weekly?.length?<div className="projectWeekly">{workspace.weekly.map((entry:any)=><span key={entry.planId}><I.CalendarRange/><b>{entry.weekStart}–{entry.windowEnd}</b><small>{entry.selected?"Als Outcome gewählt":entry.blockProposed?"Block vorgeschlagen":"Als Quelle erkannt"}</small></span>)}</div>:workspaceState==="online"&&<p>Noch keine Verknüpfung zu einem erzeugten Wochenplan.</p>}</Card></div>}
        {tab==="tasks"&&<div className="projectWorkList">{taskState==="error"&&<RetryNotice message="Projektaufgaben sind gerade nicht erreichbar." onRetry={reloadTasks}/>}<Card className="projectAdd"><Tag>NEUE PROJEKTAUFGABE</Tag><div className="projectTaskForm"><input aria-label="Aufgabentitel" disabled={taskState!=="online"} value={taskDraft.title} onChange={event=>setTaskDraft({...taskDraft,title:event.target.value})} placeholder="Konkrete nächste Aufgabe …"/><input aria-label="Fällig am" disabled={taskState!=="online"} type="date" value={taskDraft.dueAt} onChange={event=>setTaskDraft({...taskDraft,dueAt:event.target.value})}/><select aria-label="Priorität" disabled={taskState!=="online"} value={taskDraft.priority} onChange={event=>setTaskDraft({...taskDraft,priority:event.target.value})}><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option></select><Btn onClick={taskState==="online"&&taskDraft.title.trim().length>=2?addTask:undefined}>Aufgabe anlegen</Btn></div></Card>{taskState==="loading"&&<p role="status">Projektaufgaben werden geladen …</p>}{taskState==="online"&&projectTasks.length===0&&<Card className="honestEmpty"><I.ListChecks/><span><b>Noch keine Projektaufgaben</b>Lege nur konkrete Arbeit an; es werden keine Schritte erfunden.</span></Card>}{taskState==="online"&&projectTasks.map((task:any)=><Card className="projectTask" key={task.id}><button aria-label={task.done?"Aufgabe wieder öffnen":"Aufgabe erledigen"} aria-pressed={Boolean(task.done)} onClick={()=>toggleTask(task)}><i>{task.done&&<I.Check/>}</i></button><span><b>{task.title}</b><small>{task.priority?`Priorität ${task.priority}`:"Keine Priorität"}{task.dueAt?` · fällig ${task.dueAt}`:""}</small></span><em>{task.done?"Erledigt":"Offen"}</em></Card>)}</div>}
        {tab==="inbox"&&<div className="projectInboxGrid">{inboxState==="error"&&<RetryNotice message="Projekt-Inbox ist gerade nicht erreichbar." onRetry={reloadInbox}/>}<Card><Tag>PROJEKT-INBOX</Tag><div className="projectInboxCapture"><textarea aria-label="Neuer Projekt-Inbox-Eintrag" disabled={inboxState!=="online"} value={inboxDraft} onChange={event=>setInboxDraft(event.target.value)} placeholder="Idee oder Notiz diesem Projekt zuordnen …"/><Btn onClick={inboxState==="online"&&inboxDraft.trim().length>=2?addInbox:undefined}>Zuordnen</Btn></div>{inboxState==="loading"&&<p role="status">Projekt-Inbox wird geladen …</p>}{inboxState==="online"&&projectNotes.length===0&&<p>Noch keine Notizen oder Ideen verknüpft.</p>}{inboxState==="online"&&projectNotes.map((item:any)=><div className="linkedInbox" key={item.id}><I.Inbox/><span><b>{item.title}</b><small>{item.itemType||"Notiz"} · {item.status}</small></span><button onClick={()=>linkInbox(item,"")}>Zuordnung lösen</button></div>)}</Card><Card><Tag>UNZUGEORDNETE INBOX</Tag>{inboxState==="online"&&unassignedInbox.length===0?<p>Keine unzugeordneten Einträge vorhanden.</p>:inboxState==="online"&&unassignedInbox.slice(0,6).map((item:any)=><div className="linkedInbox" key={item.id}><I.PlusCircle/><span><b>{item.title}</b><small>{item.itemType||"Notiz"}</small></span><button onClick={()=>linkInbox(item,selectedId)}>Diesem Projekt zuordnen</button></div>)}</Card></div>}
        {tab==="resources"&&<div className="projectResourceGrid">{inboxState==="error"&&<RetryNotice message="Projektressourcen sind gerade nicht erreichbar." onRetry={reloadInbox}/>}<Card><Tag>PRIVATE RESSOURCENREFERENZ</Tag><p>Agentic OS speichert nur den verschlüsselten Verweis. Es öffnet, kopiert oder lädt keine Datei hoch.</p><div className="projectResourceForm"><label>Art<select disabled={inboxState!=="online"} value={resourceDraft.kind} onChange={event=>setResourceDraft({...resourceDraft,kind:event.target.value})}><option value="link">Web-Link</option><option value="dateiverweis">Lokaler Dateiverweis</option></select></label><label>Titel<input disabled={inboxState!=="online"} maxLength={120} value={resourceDraft.title} onChange={event=>setResourceDraft({...resourceDraft,title:event.target.value})} placeholder="Kurze erkennbare Bezeichnung"/></label><label className="wide">Privater Verweis<input disabled={inboxState!=="online"} maxLength={8000} value={resourceDraft.reference} onChange={event=>setResourceDraft({...resourceDraft,reference:event.target.value})} placeholder={resourceDraft.kind==="link"?"https://…":"Lokaler Pfad oder eindeutige Beschreibung …"}/></label><Btn onClick={inboxState==="online"&&resourceDraft.title.trim().length>=2&&resourceDraft.reference.trim().length>=2?addResource:undefined}>Verweis speichern</Btn></div></Card><Card><Tag>PROJEKTRESSOURCEN · GEMEINSAM</Tag>{inboxState==="loading"&&<p role="status">Projektressourcen werden geladen …</p>}{inboxState==="online"&&projectResources.length===0&&<p>Noch keine Ressourcenverweise. Es werden keine Dateien durchsucht oder Beispiele erzeugt.</p>}{inboxState==="online"&&projectResources.map((item:any)=><div className="projectResource" key={item.id}><I.FileLock2/><span><b>{item.title}</b><small>{item.itemType==="link"?"Web-Link":"Lokaler Dateiverweis"} · Inhalt verschlüsselt</small>{revealedResourceId===item.id&&<code>{item.content||"Referenz nicht verfügbar"}</code>}</span><div><button aria-expanded={revealedResourceId===item.id} onClick={()=>setRevealedResourceId(current=>current===item.id?"":item.id)}>{revealedResourceId===item.id?"Verbergen":"Privat anzeigen"}</button><button onClick={()=>linkInbox(item,"")}>Zuordnung lösen</button></div></div>)}</Card></div>}
        {tab==="history"&&<Card><Tag>VERLAUF · INHALTSARMER AUDIT</Tag><p className="sourceLine"><I.ShieldCheck/>Nur Aktionstyp und Zeitpunkt; keine privaten Inhalte im Audit.</p>{workspaceState==="loading"&&<p role="status">Projektverlauf wird geladen …</p>}{workspaceState==="online"&&workspace?.audit?.length?<div className="projectAudit">{workspace.audit.map((entry:any,index:number)=><div key={`${entry.createdAt}-${index}`}><I.History/><span><b>{entry.action==="create"?"Erstellt":entry.action==="update"?"Aktualisiert":entry.action}</b><small>{entry.entityType} · {new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}).format(new Date(entry.createdAt))}</small></span></div>)}</div>:workspaceState==="online"&&<p>Noch kein Projektverlauf vorhanden.</p>}</Card>}
      </section>}
    </>
  );
}
function ProjectEditor({ draft, setDraft, onSave, onCancel, title }: any) { return <Card className="projectEditor"><div className="row"><div><Tag>GEMEINSAMER DATENSATZ</Tag><h3>{title}</h3></div><button aria-label="Editor schließen" onClick={onCancel}><I.X/></button></div><div className="projectEditorFields"><label>Projektname<input value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})} placeholder="Klarer Projektname"/></label><label>Status<select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value})}><option value="planned">Geplant</option><option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="completed">Abgeschlossen</option></select></label><label className="wide">Ziel<textarea value={draft.goal} onChange={event=>setDraft({...draft,goal:event.target.value})} placeholder="Woran erkennst du, dass dieses Projekt gelungen ist?"/></label><label className="wide">Nächste Aktion<input value={draft.nextAction} onChange={event=>setDraft({...draft,nextAction:event.target.value})} placeholder="Der kleinste konkrete nächste Schritt"/></label><label>Zieldatum (optional)<input type="date" value={draft.dueDate} onChange={event=>setDraft({...draft,dueDate:event.target.value})}/></label><label className="wide">Beschreibung (optional)<textarea value={draft.description} onChange={event=>setDraft({...draft,description:event.target.value})} placeholder="Kontext, Grenzen oder gewünschtes Ergebnis"/></label></div><div className="editorActions"><Btn onClick={draft.title.trim().length>=2?onSave:undefined}>Speichern</Btn><button onClick={onCancel}>Abbrechen</button></div></Card>; }
function DailyArea({ initialTab, text, setText, mood, setMood, legacyDraftAvailable, legacyDraftLoaded, importLegacyDraft, discardLegacyDraft, onSharedJournalSaved, note }: any) {
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
          legacyDraftAvailable={legacyDraftAvailable}
          legacyDraftLoaded={legacyDraftLoaded}
          importLegacyDraft={importLegacyDraft}
          discardLegacyDraft={discardLegacyDraft}
          onSharedJournalSaved={onSharedJournalSaved}
        />
      )}
    </>
  );
}
function Habits({ embedded = false }: { embedded?: boolean }) {
  const emptyTask = { title: "", dueAt: "", priority: "medium", area: "Inbox", projectId: "", checklist: [] };
  const emptyHabit = { title: "", cadence: "daily" };
  const [taskDraft, setTaskDraft] = useState<any>(emptyTask);
  const [habitDraft, setHabitDraft] = useState<any>(emptyHabit);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [editingHabitId, setEditingHabitId] = useState("");
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [habitEditorOpen, setHabitEditorOpen] = useState(false);
  const [checklistText, setChecklistText] = useState("");
  const [error, setError] = useState("");
  const {
    records: tasks,
    state: taskState,
    create: createTask,
    update: updateTask,
    archive: archiveTask,
    reload: reloadTasks,
  } = useSharedRecords("tasks");
  const {
    records: habits,
    state: habitState,
    create: createHabit,
    update: updateHabit,
    archive: archiveHabit,
    reload: reloadHabits,
  } = useSharedRecords("habits");
  const { records: projects, state: projectState, reload: reloadProjects } = useSharedRecords("projects");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
  }).format(new Date());
  const todayAtNoon = new Date(`${today}T12:00:00Z`);
  const mondayOffset = (todayAtNoon.getUTCDay() + 6) % 7;
  const monday = new Date(todayAtNoon);
  monday.setUTCDate(monday.getUTCDate() - mondayOffset);
  const weekStart = monday.toISOString().slice(0, 10);
  const habitComplete = (habit: any) => {
    const dates = Array.isArray(habit.completedOn) ? habit.completedOn : [];
    return habit.cadence === "weekly"
      ? dates.some((date: string) => date >= weekStart && date <= today)
      : dates.includes(today);
  };
  const saveTask = async () => {
    const title = String(taskDraft.title || "").trim();
    if (title.length < 2) return setError("Aufgabe benötigt mindestens 2 Zeichen");
    if (taskDraft.projectId && projectState !== "online") return setError("Projektzuordnung ist gerade nicht verifizierbar");
    try {
      const payload = { ...taskDraft, title, projectId: taskDraft.projectId || undefined, status: taskDraft.done ? "completed" : "active" };
      if (editingTaskId) await updateTask({ ...tasks.find((task: any) => task.id === editingTaskId), ...payload });
      else await createTask({ ...payload, done: false });
      setTaskDraft(emptyTask);
      setEditingTaskId("");
      setTaskEditorOpen(false);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Aufgabe konnte nicht gespeichert werden");
    }
  };
  const saveHabit = async () => {
    const title = String(habitDraft.title || "").trim();
    if (title.length < 2) return setError("Habit benötigt mindestens 2 Zeichen");
    try {
      if (editingHabitId) await updateHabit({ ...habits.find((habit: any) => habit.id === editingHabitId), ...habitDraft, title });
      else await createHabit({ ...habitDraft, title, status: "active", completedOn: [] });
      setHabitDraft(emptyHabit);
      setEditingHabitId("");
      setHabitEditorOpen(false);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Habit konnte nicht gespeichert werden");
    }
  };
  const toggleHabit = async (habit: any) => {
    try {
      const completedOn = Array.isArray(habit.completedOn) ? habit.completedOn : [];
      const remaining = habit.cadence === "weekly"
        ? completedOn.filter((date: string) => date < weekStart || date > today)
        : completedOn.filter((date: string) => date !== today);
      await updateHabit({ ...habit, completedOn: habitComplete(habit) ? remaining : [...completedOn, today].slice(-90) });
      setError("");
    } catch { setError("Habit konnte nicht aktualisiert werden"); }
  };
  const toggleTask = async (task: any) => { try { await updateTask({ ...task, done: !task.done, status: !task.done ? "completed" : "active" }); setError(""); } catch { setError("Aufgabe konnte nicht aktualisiert werden"); } };
  const editTask = (task: any) => { setTaskDraft({ ...emptyTask, ...task, projectId: task.projectId || "" }); setEditingTaskId(task.id); setTaskEditorOpen(true); setError(""); };
  const editHabit = (habit: any) => { setHabitDraft({ ...emptyHabit, ...habit }); setEditingHabitId(habit.id); setHabitEditorOpen(true); setError(""); };
  const addChecklistItem = () => { const label = checklistText.trim(); if (!label || (taskDraft.checklist || []).length >= 20) return; setTaskDraft({ ...taskDraft, checklist: [...(taskDraft.checklist || []), { id: crypto.randomUUID(), label, done: false }] }); setChecklistText(""); };
  const updateChecklistItem = (id: string, patch: any) => setTaskDraft({ ...taskDraft, checklist: (taskDraft.checklist || []).map((item: any) => item.id === id ? { ...item, ...patch } : item) });
  const removeChecklistItem = (id: string) => setTaskDraft({ ...taskDraft, checklist: (taskDraft.checklist || []).filter((item: any) => item.id !== id) });
  const toggleChecklistItem = async (task: any, itemId: string) => { try { await updateTask({ ...task, checklist: (task.checklist || []).map((item: any) => item.id === itemId ? { ...item, done: !item.done } : item) }); setError(""); } catch { setError("Checklistenpunkt konnte nicht aktualisiert werden"); } };
  const completedHabits = habits.filter(habitComplete).length;
  const openTasks = tasks.filter((task: any) => !task.done).length;
  const dueTasks = tasks.filter((task: any) => !task.done && task.dueAt && task.dueAt <= today).length;
  const dailyState = taskState === "error" || habitState === "error" ? "error" : taskState === "loading" || habitState === "loading" ? "loading" : "online";
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
            <b>{habitState === "online" ? `${completedHabits}/${habits.length} im Rhythmus` : habitState === "loading" ? "Habits werden geladen" : "Habits offline"}</b>
          </div>
          <button className="taskCreate" disabled={habitState !== "online"} onClick={() => { setHabitDraft(emptyHabit); setEditingHabitId(""); setHabitEditorOpen(true); }} type="button"><I.Plus /> Habit anlegen</button>
          {habitState === "online" && habitEditorOpen && <div className="dailyRecordEditor"><label>Habit<input aria-label="Habit-Name" value={habitDraft.title || ""} onChange={(event) => setHabitDraft({ ...habitDraft, title: event.target.value })} placeholder="Eine freiwillige Routine …" /></label><label>Rhythmus<select value={habitDraft.cadence || "daily"} onChange={(event) => setHabitDraft({ ...habitDraft, cadence: event.target.value })}><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option></select></label><div><Btn onClick={String(habitDraft.title || "").trim().length >= 2 ? saveHabit : undefined}>{editingHabitId ? "Änderung speichern" : "Habit speichern"}</Btn><button onClick={() => { setHabitEditorOpen(false); setEditingHabitId(""); }}>Abbrechen</button>{editingHabitId && <button className="dangerQuiet" onClick={async () => { await archiveHabit(editingHabitId); setHabitEditorOpen(false); setEditingHabitId(""); }}>Archivieren</button>}</div></div>}
          {habitState === "loading" && <p role="status">Habits werden geladen …</p>}
          {habitState === "error" && <RetryNotice message="Gemeinsame Habits sind gerade nicht erreichbar." onRetry={reloadHabits} label="Habits neu laden"/>}
          {habitState === "online" && habits.length === 0 && (
            <p>Noch keine Habits erfasst. Es werden keine Routinen vorgegeben.</p>
          )}
          {habits.map((habit: any) => (
            <div className="dailyRecord" key={habit.id}><button aria-label={`${habit.title} ${habitComplete(habit) ? "wieder öffnen" : "abschließen"}`} aria-pressed={habitComplete(habit)} className="taskrow" onClick={() => toggleHabit(habit)} type="button"><i className={habitComplete(habit) ? "done" : ""}>{habitComplete(habit) && <I.Check />}</i><span>{habit.title}<small>{habit.cadence === "weekly" ? "Wöchentlich" : "Täglich"} · ohne Streak-Druck</small></span></button><button aria-label={`${habit.title} bearbeiten`} className="recordEdit" onClick={() => editHabit(habit)} type="button"><I.Pencil /></button></div>
          ))}
        </Card>
        <Card>
          <Tag>AUFGABEN · GEMEINSAMER SERVERZUSTAND</Tag>
          <button className="taskCreate" disabled={taskState !== "online"} onClick={() => { setTaskDraft(emptyTask); setChecklistText(""); setEditingTaskId(""); setTaskEditorOpen(true); }} type="button"><I.Plus /> Aufgabe anlegen</button>
          {taskState === "online" && taskEditorOpen && <div className="dailyRecordEditor taskFields"><label className="wide">Aufgabe<input aria-label="Aufgabentitel im Tagesbereich" value={taskDraft.title || ""} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} placeholder="Konkreter nächster Schritt …" /></label><label>Priorität<select value={taskDraft.priority || "medium"} onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value })}><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option></select></label><label>Fällig<input type="date" value={taskDraft.dueAt || ""} onChange={(event) => setTaskDraft({ ...taskDraft, dueAt: event.target.value })} /></label><label>Lebensbereich<select value={taskDraft.area || "Inbox"} onChange={(event) => setTaskDraft({ ...taskDraft, area: event.target.value })}>{["Inbox","Glaube","Karriere","Gesundheit","Finanzen","Beziehungen","Projekte"].map(area => <option key={area} value={area}>{area}</option>)}</select></label><label>Projekt (optional)<select disabled={projectState !== "online"} value={taskDraft.projectId || ""} onChange={(event) => setTaskDraft({ ...taskDraft, projectId: event.target.value })}><option value="">{projectState === "online" ? "Kein Projekt" : projectState === "loading" ? "Projektquelle wird geladen" : "Projektquelle nicht erreichbar"}</option>{projects.map((project: any) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><div className="checklistEditor wide"><b>Checkliste (optional · maximal 20)</b>{(taskDraft.checklist || []).map((item: any) => <div key={item.id}><input aria-label={`${item.label} als erledigt markieren`} checked={Boolean(item.done)} onChange={(event) => updateChecklistItem(item.id, { done: event.target.checked })} type="checkbox"/><input aria-label="Checklistenpunkt bearbeiten" maxLength={160} value={item.label} onChange={(event) => updateChecklistItem(item.id, { label: event.target.value })}/><button aria-label={`${item.label} entfernen`} onClick={() => removeChecklistItem(item.id)} type="button"><I.X /></button></div>)}<div><input aria-label="Neuer Checklistenpunkt" maxLength={160} onChange={(event) => setChecklistText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addChecklistItem(); } }} placeholder="Unterpunkt hinzufügen …" value={checklistText}/><button aria-label="Checklistenpunkt hinzufügen" disabled={!checklistText.trim() || (taskDraft.checklist || []).length >= 20} onClick={addChecklistItem} type="button"><I.Plus /></button></div></div><div className="wide"><Btn onClick={String(taskDraft.title || "").trim().length >= 2 && (!taskDraft.projectId || projectState === "online") && (taskDraft.checklist || []).every((item: any) => String(item.label || "").trim()) ? saveTask : undefined}>{editingTaskId ? "Änderung speichern" : "Aufgabe speichern"}</Btn><button onClick={() => { setTaskEditorOpen(false); setEditingTaskId(""); setChecklistText(""); }}>Abbrechen</button>{editingTaskId && <button className="dangerQuiet" onClick={async () => { await archiveTask(editingTaskId); setTaskEditorOpen(false); setEditingTaskId(""); }}>Archivieren</button>}</div></div>}
          {taskState === "loading" && <p role="status">Aufgaben werden geladen …</p>}
          {taskState === "error" && <RetryNotice message="Gemeinsame Aufgaben sind gerade nicht erreichbar." onRetry={reloadTasks} label="Aufgaben neu laden"/>}
          {taskState === "online" && tasks.length === 0 && <p>Noch keine gemeinsamen Aufgaben.</p>}
          {tasks.map((t: any) => (
            <div className="taskWithChecklist" key={t.id}><div className="dailyRecord"><button aria-label={`${t.title} ${t.done ? "wieder öffnen" : "erledigen"}`} aria-pressed={Boolean(t.done)} className="taskrow" onClick={() => toggleTask(t)} type="button"><i className={t.done ? "done" : ""}>{t.done && <I.Check />}</i><span className={t.done ? "strike" : ""}>{t.title}<small>{t.area || "Inbox"} · Priorität {t.priority === "high" ? "hoch" : t.priority === "low" ? "niedrig" : "mittel"}{t.dueAt ? ` · fällig ${t.dueAt}` : ""}{t.projectId ? " · Projekt" : ""}{t.checklist?.length ? ` · ${t.checklist.filter((item: any) => item.done).length}/${t.checklist.length} Unterpunkte` : ""}</small></span></button><button aria-label={`${t.title} bearbeiten`} className="recordEdit" onClick={() => editTask(t)} type="button"><I.Pencil /></button></div>{t.checklist?.length > 0 && <div className="taskChecklist" aria-label={`Checkliste für ${t.title}`}>{t.checklist.map((item: any) => <button aria-pressed={Boolean(item.done)} key={item.id} onClick={() => toggleChecklistItem(t, item.id)} type="button"><i className={item.done ? "done" : ""}>{item.done && <I.Check />}</i><span className={item.done ? "strike" : ""}>{item.label}</span></button>)}</div>}</div>
          ))}
        </Card>
        <Card>
          <Tag>HEUTIGER ÜBERBLICK · ECHTE DATEN</Tag>
          <h3>{dailyState === "online" ? `${openTasks} offene Aufgaben` : dailyState === "loading" ? "Tagesdaten werden geladen" : "Tagesdaten nicht vollständig erreichbar"}</h3>
          <p>{dailyState === "online" ? `${dueTasks} heute fällig oder überfällig · ${completedHabits} von ${habits.length} Habits im jeweiligen Rhythmus markiert.` : "Es werden keine Nullstände aus einer fehlenden Quelle abgeleitet."}</p>
          <p>Kein verlorener Streak und keine erfundete Serie. Morgen ist ein neuer Tag.</p>
          {projectState==="error"&&<RetryNotice message="Projektzuordnungen sind gerade nicht verifizierbar." onRetry={reloadProjects} label="Projekte neu laden"/>}
          {error && <p role="alert">{error}</p>}
        </Card>
      </div>
    </>
  );
}
function Journal({ text, setText, mood, setMood, legacyDraftAvailable, legacyDraftLoaded, importLegacyDraft, discardLegacyDraft, onSharedJournalSaved, note, embedded = false }: any) {
  const { records: entries, state: journalState, create, archive, reload: reloadJournal } = useSharedRecords("journal_metadata");
  const { records: tasks, state: taskState, reload: reloadTasks } = useSharedRecords("tasks");
  const { records: habits, state: habitState, reload: reloadHabits } = useSharedRecords("habits");
  const [energy, setEnergy] = useState(3);
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const [journalArchiveArmed, setJournalArchiveArmed] = useState(false);
  const [legacyDiscardArmed, setLegacyDiscardArmed] = useState(false);
  const [calendarSummary, setCalendarSummary] = useState<any>({ state: "loading" });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
  const selectedEntry = entries.find((entry: any) => entry.id === selectedEntryId);
  const openTasks = tasks.filter((task: any) => !task.done).length;
  const completedHabits = habits.filter((habit: any) => Array.isArray(habit.completedOn) && habit.completedOn.includes(today)).length;
  const loadCalendarSummary = useCallback(async () => {
    setCalendarSummary({ state: "loading" });
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      const response = await privateApiFetch("/api/calendar/today-summary", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Kalenderübersicht nicht erreichbar");
      setCalendarSummary({ state: result.connected ? "online" : "unconfigured", ...result });
    } catch {
      setCalendarSummary({ state: "error" });
    }
  }, []);
  useEffect(() => {
    void loadCalendarSummary();
    const recover = () => void loadCalendarSummary();
    window.addEventListener("agentic-os:runtime-online", recover);
    return () => window.removeEventListener("agentic-os:runtime-online", recover);
  }, [loadCalendarSummary]);
  const insertPrompt = (prompt: string) => {
    const separator = text.trim() ? "\n\n" : "";
    setText(`${text}${separator}${prompt}\n`);
  };
  const archiveSelectedEntry = async () => {
    if (!selectedEntry || !journalArchiveArmed) return;
    try {
      await archive(selectedEntry.id);
      setSelectedEntryId("");
      setJournalArchiveArmed(false);
      note("Journaleintrag reversibel archiviert");
    } catch (error) {
      setJournalArchiveArmed(false);
      note(error instanceof Error ? error.message : "Journaleintrag konnte nicht archiviert werden");
    }
  };
  const completeJournal = async () => {
    try {
      await create({ title: `Journal ${today}`, entryDate: today, mood, energy, text, status: "active" });
      setText("");
      onSharedJournalSaved?.();
      note("Journal gemeinsam gespeichert · Textfeld nur verschlüsselt");
    } catch (error) {
      note(error instanceof Error ? error.message : "Journal konnte nicht gespeichert werden");
    }
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
            <span>Entwurf nur in dieser Sitzung · Abschluss verschlüsselt im gemeinsamen Store</span>
          </div>
          {legacyDraftAvailable && <div className="legacyDraftReview"><I.ShieldAlert/><span><b>Alte lokale Entwurfskopie gefunden</b><small>Sie bleibt unangetastet, bis du sie bewusst übernimmst oder zweistufig verwirfst. Ihr Inhalt wird nicht protokolliert.</small></span><div><button onClick={()=>{importLegacyDraft();setLegacyDiscardArmed(false)}} type="button">Alten Entwurf übernehmen</button>{!legacyDiscardArmed?<button onClick={()=>setLegacyDiscardArmed(true)} type="button">Lokale Kopie verwerfen …</button>:<button className="dangerQuiet" onClick={()=>{discardLegacyDraft();setLegacyDiscardArmed(false)}} type="button">Lokale Kopie endgültig verwerfen</button>}</div></div>}
          {legacyDraftLoaded && <p className="sourceLine"><I.ShieldCheck/>Alter Entwurf wurde nur in diese geöffnete Sitzung übernommen. Die lokale Alt-Kopie wird erst nach dem erfolgreichen gemeinsamen Abschluss entfernt.</p>}
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
          <Btn onClick={journalState === "online" ? completeJournal : undefined}>
            Eintrag abschließen
          </Btn>
          <small className="connectionNote">Nicht abgeschlossene Änderungen werden nicht automatisch in Browser- oder Gerätespeicher geschrieben.</small>
          {journalState === "loading" && <p role="status">Journalquelle wird geladen …</p>}
          {journalState === "error" && <RetryNotice message="Der Entwurf bleibt auf diesem Gerät; der gemeinsame Abschluss ist bis zur Wiederverbindung gesperrt." onRetry={reloadJournal} label="Journal neu laden"/>}
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
            <Tag>HEUTE · ECHTE QUELLEN</Tag>
            <span>
              <I.Calendar />{calendarSummary.state === "online" ? `${calendarSummary.eventCount} Termine` : calendarSummary.state === "loading" ? "Kalender lädt" : calendarSummary.state === "unconfigured" ? "Kalender nicht verbunden" : "Kalender nicht erreichbar"}
            </span>
            <span>
              <I.ListChecks />{habitState === "online" ? `${completedHabits}/${habits.length} Habits` : habitState === "loading" ? "Habits laden" : "Habits nicht erreichbar"}
            </span>
            <span>
              <I.CheckSquare />{taskState === "online" ? `${openTasks} Aufgaben offen` : taskState === "loading" ? "Aufgaben laden" : "Aufgaben nicht erreichbar"}
            </span>
          </div>
          <small className="connectionNote">Kalender: nur heutige Anzahl aus maximal 12 ausgewählten Kalendern, keine Titel und 0 Writes.</small>
          {calendarSummary.state === "error" && <RetryNotice message="Die inhaltsarme Kalender-Tageszahl ist gerade nicht erreichbar." onRetry={loadCalendarSummary} label="Tageszahl neu laden" />}
          {habitState === "error" && <RetryNotice message="Die Habit-Anzahl ist gerade nicht verifiziert." onRetry={reloadHabits} label="Habits neu laden"/>}
          {taskState === "error" && <RetryNotice message="Die Aufgabenanzahl ist gerade nicht verifiziert." onRetry={reloadTasks} label="Aufgaben neu laden"/>}
        </Card>
        <Card>
          <Tag>VERLAUF</Tag>
          {journalState === "loading" && <p role="status">Journalverlauf wird geladen …</p>}
          {journalState === "error" && <p role="alert">Gemeinsamer Journalverlauf nicht erreichbar; über „Journal neu laden“ wird die private Quelle erneut geprüft.</p>}
          {journalState === "online" && entries.length===0&&<p>Noch keine gemeinsamen Journaleinträge.</p>}
          <div className="journalHistory">
            {entries.map((x:any)=><button aria-pressed={selectedEntryId===x.id} className={selectedEntryId===x.id?"active":""} key={x.id} onClick={()=>{setSelectedEntryId(current=>current===x.id?"":x.id);setJournalArchiveArmed(false)}}><span>{x.entryDate} · {x.mood||'ohne Stimmung'}</span><small>Energie {x.energy||"—"}/5 · verschlüsselt gespeichert</small></button>)}
          </div>
          {selectedEntry&&<div className="journalDetail"><b>{selectedEntry.title}</b><p>{selectedEntry.text||"Dieser Eintrag enthält nur Stimmung und Energie."}</p><small>Private Detailansicht aus dem gemeinsamen Store</small><div className="editorActions">{!journalArchiveArmed?<button className="dangerQuiet" onClick={()=>setJournalArchiveArmed(true)}>Archivieren …</button>:<button className="dangerQuiet" onClick={archiveSelectedEntry}>Archivierung bestätigen</button>}</div></div>}
        </Card>
      </div>
    </>
  );
}
function Agents({ note }: any) {
  const { records, state, create, update, archive, reload: reloadAgents } = useSharedRecords("agents");
  const { records: projects, state: projectState, reload: reloadProjects } = useSharedRecords("projects");
  const { records: referencedSkills, state: referencedSkillState, reload: reloadReferencedSkills } = useSharedRecords("skills");
  const emptyAgent = { name: "", purpose: "", areas: [], providerMode: "none", model: "none", status: "metadata_only" };
  const agentAreas = [["faith", "Glaube"], ["career", "Karriere"], ["health", "Gesundheit"], ["finance", "Finanzen"], ["relations", "Beziehungen"], ["projects", "Projekte"]];
  const [editing, setEditing] = useState<any>(null), [agentDraft, setAgentDraft] = useState<any>(emptyAgent), [workflowState, setWorkflowState] = useState<any>({ state: "loading", profiles: [], runs: [] }), [selectedWorkflow, setSelectedWorkflow] = useState("project_coach"), [workflowInput, setWorkflowInput] = useState(""), [projectId, setProjectId] = useState(""), [activeRunId, setActiveRunId] = useState(""), [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]), [busy, setBusy] = useState(false), [workflowError, setWorkflowError] = useState(""),[agentArchiveArmed,setAgentArchiveArmed]=useState(false);
  const loadWorkflows = useCallback(async () => { setWorkflowState({ state: "loading", profiles: [], runs: [] }); try { await privateApiFetch("/api/state/session", { method: "POST" }); const response = await privateApiFetch("/api/agents/workflows", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(); setWorkflowState({ state: "online", ...result }); if (!activeRunId && result.runs?.length) setActiveRunId(result.runs[0].id); } catch { setWorkflowState({ state: "error", profiles: [], runs: [] }); setActiveRunId(""); } }, [activeRunId]);
  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);
  const activeRun = workflowState.runs.find((run: any) => run.id === activeRunId);
  const activeSuggestionKey = JSON.stringify(activeRun?.decision?.selectedSuggestionIds || []);
  useEffect(() => { setSelectedSuggestions(JSON.parse(activeSuggestionKey)); }, [activeRunId, activeSuggestionKey]);
  const workflowIcon = (id: string) => id === "project_coach" ? I.FolderKanban : id === "faith_reflection" ? I.MoonStar : id === "health_planner" ? I.HeartPulse : id === "finance_overview" ? I.WalletCards : I.UsersRound;
  const saveAgent = async () => { try { if (editing?.id) await update({ ...editing, ...agentDraft, title: agentDraft.name }); else await create({ ...agentDraft, title: agentDraft.name }); setEditing(null); note("Agent-Konfiguration gespeichert · keine Ausführung aktiviert"); } catch (error) { note(error instanceof Error ? error.message : "Agent konnte nicht gespeichert werden"); } };
  const archiveAgent=async()=>{if(!editing?.id||!agentArchiveArmed)return;try{await archive(editing.id);setEditing(null);setAgentArchiveArmed(false);note("Agent-Konfiguration reversibel archiviert")}catch(error){setAgentArchiveArmed(false);note(error instanceof Error?error.message:"Agent konnte nicht archiviert werden")}};
  const toggleAgentArea = (area: string) => setAgentDraft((current: any) => ({ ...current, areas: current.areas.includes(area) ? current.areas.filter((value: string) => value !== area) : [...current.areas, area] }));
  const workflowRequest=async(method:"POST"|"PATCH",body:any)=>{if(workflowState.state!=="online")throw new Error("Private Workflow-Quelle ist nicht schreibbereit");let response:Response;try{response=await privateApiFetch("/api/agents/workflows",{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)})}catch{setWorkflowState({state:"error",profiles:[],runs:[]});setActiveRunId("");throw new Error("Private Workflow-Quelle nicht erreichbar")}let result:any;try{result=await response.json()}catch{setWorkflowState({state:"error",profiles:[],runs:[]});setActiveRunId("");throw new Error("Ungültige Antwort der Workflow-Quelle")}if(!response.ok){if(response.status===409)await loadWorkflows();else if(privateSourceFailure(response.status)){setWorkflowState({state:"error",profiles:[],runs:[]});setActiveRunId("")}throw new Error(result.error||"Workflow-Anfrage abgelehnt")}return result};
  const generate = async () => { if (workflowInput.trim().length < 2) return note("Bitte einen klaren Arbeitsauftrag eingeben"); setBusy(true); setWorkflowError(""); try { const result = await workflowRequest("POST", { workflowId: selectedWorkflow, input: workflowInput, projectId: selectedWorkflow === "project_coach" ? projectId || undefined : undefined }); await loadWorkflows(); setActiveRunId(result.run.id); setWorkflowInput(""); note("Lokaler Vorschlagslauf gespeichert · 0 externe Aktionen"); } catch (error) { setWorkflowError(error instanceof Error ? error.message : "Workflow fehlgeschlagen"); } finally { setBusy(false); } };
  const transition = async (action: "review" | "pause" | "resume") => { if (!activeRun) return; setBusy(true); setWorkflowError(""); try { const result = await workflowRequest("PATCH", { runId: activeRun.id, version: activeRun.version, action, selectedSuggestionIds: action === "review" ? selectedSuggestions : undefined }); await loadWorkflows(); setActiveRunId(result.run.id); note(action === "review" ? "Review gespeichert · keine Aktion ausgeführt" : action === "pause" ? "Workflow pausiert" : "Workflow zur Review fortgesetzt"); } catch (error) { setWorkflowError(error instanceof Error ? error.message : "Statuswechsel fehlgeschlagen"); } finally { setBusy(false); } };
  const toggleSuggestion = (id: string) => setSelectedSuggestions((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  return (
    <>
      <Intro
        eyebrow="LOKALE WORKFLOWS · TRANSPARENT & FREIGABEGESTEUERT"
        title="Assistenten, die Vorschläge machen – nicht heimlich handeln."
        action={<Btn soft onClick={state === "online" ? () => { setEditing({}); setAgentDraft(emptyAgent); setAgentArchiveArmed(false); } : undefined}><I.Plus /> Eigener Agent</Btn>}
      ><p>Alle fünf Kern-Workflows lesen nur den privaten Shared Store. Kein Modell, keine API-Kosten, keine Hintergrundaktion.</p></Intro>
      <div className="workflowTruth"><span><I.Cpu/><b>Lokale Regeln</b><small>Modell: keines</small></span><span><I.Database/><b>Shared Store</b><small>Input/Output verschlüsselt</small></span><span><I.ShieldCheck/><b>Freigabegrenze</b><small>Vorschlag ≠ Aktion</small></span><span><I.BadgeEuro/><b>Kosten</b><small>0 € pro Lauf</small></span></div>
      {workflowState.state === "loading" && <p role="status">Private Workflow-Quelle wird geladen …</p>}
      {workflowState.state === "error" && <RetryNotice message="Die privaten Workflow-Daten sind gerade nicht erreichbar. Es werden keine Ersatzläufe angezeigt." onRetry={loadWorkflows}/>}
      {projectState === "error" && <RetryNotice message="Projektbezüge für den Projekt-Coach sind gerade nicht verifizierbar." onRetry={reloadProjects} label="Projekte neu laden"/>}
      {referencedSkillState === "error" && <RetryNotice message="Transparente Skill-Referenzen sind gerade nicht verifizierbar." onRetry={reloadReferencedSkills} label="Skill-Referenzen neu laden"/>}
      <div className="workflowProfiles">{workflowState.profiles.map((profile: any) => { const Icon = workflowIcon(profile.id), latest = workflowState.runs.find((run: any) => run.workflowId === profile.id), linkedSkills = referencedSkills.filter((skill:any)=>skill.executable&&(skill.assignedAgentWorkflowIds||[]).includes(profile.id)); return <button aria-pressed={selectedWorkflow === profile.id} className={selectedWorkflow === profile.id ? "active" : ""} key={profile.id} onClick={() => { setSelectedWorkflow(profile.id); setActiveRunId(latest?.id || ""); setWorkflowError(""); }}><span><Icon/></span><div><b>{profile.name}</b><small>{profile.purpose}</small><small>{referencedSkillState === "online" ? `${linkedSkills.length} transparente Skill-Referenz${linkedSkills.length===1?"":"en"} · keine stille Kette` : "Skill-Referenzen nicht verifiziert"}</small></div><em>{latest ? latest.status === "paused" ? "Pausiert" : latest.status === "reviewed" ? "Geprüft" : "Review offen" : "Noch kein Lauf"}</em></button>; })}</div>
      <div className="workflowLayout">
        <Card className="workflowStart"><Tag>NEUER VORSCHLAGSLAUF</Tag><h3>{workflowState.profiles.find((profile: any)=>profile.id===selectedWorkflow)?.name || "Workflow nicht geladen"}</h3><p>{workflowState.profiles.find((profile: any)=>profile.id===selectedWorkflow)?.boundary}</p>{selectedWorkflow === "project_coach" && <label>Projektbezug (optional)<select disabled={projectState !== "online"} value={projectId} onChange={event=>setProjectId(event.target.value)}><option value="">{projectState === "online" ? "Alle echten Projekte" : projectState === "loading" ? "Projektquelle wird geladen" : "Projektquelle nicht erreichbar"}</option>{projects.map((project:any)=><option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}<label>Was soll der Assistent organisatorisch klären?<textarea value={workflowInput} onChange={event=>setWorkflowInput(event.target.value)} placeholder="Klarer Arbeitsauftrag – keine Zugangsdaten oder unnötigen sensiblen Details …" maxLength={1000}/></label><div className="workflowGate"><I.Shield/><span><b>Nur Vorschlag erzeugen</b>Keine Aufgabe, Nachricht, Transaktion, Kalenderänderung oder externe Aktion.</span></div><Btn onClick={workflowState.state==="online"&&!busy&&workflowInput.trim().length>=2&&(selectedWorkflow!=="project_coach"||!projectId||projectState==="online")?generate:undefined}>{busy ? "Wird lokal ausgewertet …" : "Vorschlag lokal erzeugen"}<I.WandSparkles/></Btn></Card>
        <Card className="workflowResult"><div className="row"><div><Tag>OUTPUT & STATUS</Tag><h3>{activeRun ? workflowState.profiles.find((profile:any)=>profile.id===activeRun.workflowId)?.name : "Noch kein Lauf gewählt"}</h3></div>{activeRun&&<em className={`runStatus ${activeRun.status}`}>{activeRun.status}</em>}</div>{workflowError&&<p className="plannerError" role="alert"><I.TriangleAlert/>{workflowError}</p>}{!activeRun&&<div className="honestEmpty"><I.Bot/><span><b>Noch kein echter Vorschlagslauf</b>Wähle einen Workflow und formuliere einen Arbeitsauftrag. Es werden keine Ergebnisse erfunden.</span></div>}{activeRun&&<><p>{activeRun.output.summary}</p><div className="sourceCounts"><span><b>Lokale Regeln</b>Provider</span><span><b>Keines</b>Modell</span><span><b>{activeRun.output.runtime?.verifiedSourceCount??Object.keys(activeRun.sourceEvidence||{}).length}</b>Quellen verifiziert</span><span><b>{activeRun.steps?.length??0}</b>Run Steps</span><span><b>0</b>Externe Aktionen</span></div>{activeRun.steps?.length>0&&<ol className="skillSteps">{activeRun.steps.map((step:any)=><li key={step.id}>{step.index}. {step.type} · {step.status}</li>)}</ol>}<div className="workflowSuggestions">{activeRun.output.suggestions.map((item:any)=><label className={selectedSuggestions.includes(item.id)?"selected":""} key={item.id}><input checked={selectedSuggestions.includes(item.id)} disabled={activeRun.status==="reviewed"} onChange={()=>toggleSuggestion(item.id)} type="checkbox"/><span><b>{item.title}</b><small>{item.rationale}</small></span><em>Vorschlag</em></label>)}</div><div className="workflowActions">{activeRun.status === "proposal" && <><Btn onClick={!busy ? ()=>transition("review") : undefined}>Review speichern</Btn><button onClick={()=>transition("pause")} disabled={busy}>Pausieren</button></>}{activeRun.status === "paused" && <Btn onClick={!busy ? ()=>transition("resume") : undefined}>Workflow fortsetzen</Btn>}{activeRun.status === "reviewed" && <span><I.CheckCircle2/>Review abgeschlossen · keine Folgeaktion ausgeführt</span>}</div><small className="workflowBoundary"><I.Lock/>Externe oder folgenreiche Aktionen sind in diesem Workflow nicht implementiert und brauchen später eine eigene exakte Vorschau und Freigabe.</small></>}</Card>
      </div>
      {workflowState.runs.length > 0 && <Card className="workflowHistory"><Tag>RESUME & AUDIT</Tag><div>{workflowState.runs.slice(0,10).map((run:any)=><button className={activeRunId===run.id?"active":""} key={run.id} onClick={()=>setActiveRunId(run.id)}><I.History/><span><b>{workflowState.profiles.find((profile:any)=>profile.id===run.workflowId)?.name}</b><small>{new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}).format(new Date(run.updatedAt))} · Schritt {run.currentStep}</small></span><em>{run.status}</em></button>)}</div></Card>}
      <div className="sectionhead"><h3>Eigene Agent-Metadaten</h3><span>{state === "online" ? `${records.length} persistent · nicht ausführbar` : state === "loading" ? "Konfigurationen werden geladen" : "Konfigurationen offline"}</span></div>
      {state === "error" && <RetryNotice message="Eigene Agent-Konfigurationen sind gerade nicht erreichbar." onRetry={reloadAgents} label="Konfigurationen neu laden"/>}
      {state === "online" && editing && <Card className="agentConfigurator"><div className="row"><Tag>AGENT-KONFIGURATOR · SICHERE VORSCHAU</Tag><button aria-label="Konfigurator schließen" onClick={()=>setEditing(null)}><I.X/></button></div><label>Name<input value={agentDraft.name} onChange={event=>setAgentDraft({...agentDraft,name:event.target.value})} placeholder="Agentname"/></label><label>Zweck<textarea value={agentDraft.purpose} onChange={event=>setAgentDraft({...agentDraft,purpose:event.target.value})} placeholder="Wofür soll diese Konfiguration später dienen?"/></label><div className="agentAreaChoices"><b>Zugeordnete Lebensbereiche</b><div>{agentAreas.map(([id,name])=><label key={id}><input checked={agentDraft.areas.includes(id)} onChange={()=>toggleAgentArea(id)} type="checkbox"/>{name}</label>)}</div></div><div className="agentProviderGrid"><label>Arbeitsmodus<select value={agentDraft.providerMode} onChange={event=>setAgentDraft({...agentDraft,providerMode:event.target.value,model:event.target.value==="subscription"?"chatgpt-companion-manual":"none"})}><option value="none">Kein Provider</option><option value="subscription">ChatGPT Companion · manuell</option><option disabled>OpenAI API · Kostenfreigabe nötig</option></select></label><label>Modellzugriff<input readOnly value={agentDraft.model==="chatgpt-companion-manual"?"Kein API-Modell · manuelle Übergabe":"Kein Modell"}/></label><label>Status<select value={agentDraft.status} onChange={event=>setAgentDraft({...agentDraft,status:event.target.value})}><option value="metadata_only">Nicht ausführbar</option><option value="paused">Pausiert</option></select></label></div><div className="workflowGate"><I.Lock/><span><b>Transparente Grenze</b>Speichern aktiviert weder einen Modellzugriff noch einen Workflow. Companion bedeutet nur manuelles Öffnen/Übernehmen.</span></div><div className="editorActions"><Btn onClick={agentDraft.name.trim().length>=2&&agentDraft.purpose.trim().length>=2?saveAgent:undefined}>Konfiguration speichern</Btn><button onClick={()=>setEditing(null)}>Abbrechen</button>{editing.id&&!agentArchiveArmed&&<button className="dangerQuiet" onClick={()=>setAgentArchiveArmed(true)}>Archivieren …</button>}{editing.id&&agentArchiveArmed&&<button className="dangerQuiet" onClick={archiveAgent}>Archivierung bestätigen</button>}</div></Card>}
      {state === "online" && records.length === 0 && <Card className="honestEmpty"><I.Bot/><span><b>Keine eigenen Agent-Metadaten</b>Die fünf geprüften System-Workflows oben funktionieren unabhängig davon lokal.</span></Card>}
      <div className="agentMetadata">{records.map((agent:any)=><Card key={agent.id}><div className="row"><span className="agentIcon"><I.Bot/></span><i className="badge unconfigured">{agent.status==="paused"?"Pausiert":"Nicht ausführbar"}</i></div><h3>{agent.name||agent.title}</h3><p>{agent.purpose||"Zweck noch nicht beschrieben"}</p><div className="agentFacts"><span><b>Bereiche</b>{(agent.areas||[]).map((id:string)=>agentAreas.find(([area])=>area===id)?.[1]).filter(Boolean).join(" · ")||"Nicht zugeordnet"}</span><span><b>Modell</b>{agent.model==="chatgpt-companion-manual"?"Companion · manuell":"Keines"}</span><span><b>Aktivität</b>Keine Ausführung</span></div><button onClick={()=>{setEditing(agent);setAgentArchiveArmed(false);setAgentDraft({name:agent.name||agent.title,purpose:agent.purpose||"",areas:agent.areas||[],providerMode:agent.providerMode||"none",model:agent.model||"none",status:agent.status==="paused"?"paused":"metadata_only"})}}>Konfigurieren<I.Settings2/></button></Card>)}</div>
    </>
  );
}
function Skills({ note }: any) {
  const agentNames: Record<string,string> = {project_coach:"Projekt-Coach",faith_reflection:"Glaubensassistent",health_planner:"Gesundheitsplaner",finance_overview:"Finanzassistent",relationship_care:"Beziehungsassistent"};
  const { records: projects, state: projectState, reload: reloadProjects } = useSharedRecords("projects");
  const [q,setQ]=useState(""),[category,setCategory]=useState("Alle"),[skillState,setSkillState]=useState<any>({state:"loading",definitions:[],runs:[],catalog:[]}),[selectedSkillId,setSelectedSkillId]=useState(""),[selectedRunId,setSelectedRunId]=useState(""),[editing,setEditing]=useState<any>(null),[draft,setDraft]=useState<any>({}),[runInput,setRunInput]=useState<any>({limit:3}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[archiveArmed,setArchiveArmed]=useState(false);
  const loadSkills=useCallback(async()=>{setSkillState({state:"loading",definitions:[],runs:[],catalog:[]});try{await privateApiFetch("/api/state/session",{method:"POST"});const response=await privateApiFetch("/api/skills",{cache:"no-store"}),result=await response.json();if(!response.ok)throw new Error(result.error);setSkillState({state:"online",...result});setSelectedSkillId(current=>current||result.definitions?.[0]?.id||"");setSelectedRunId(current=>current||result.runs?.[0]?.id||"");setError("")}catch(cause){setSkillState({state:"error",definitions:[],runs:[],catalog:[]});setSelectedSkillId("");setSelectedRunId("");setError(cause instanceof Error?cause.message:"Skills sind nicht erreichbar")}},[setError,setSelectedRunId,setSelectedSkillId,setSkillState]);
  useEffect(()=>{loadSkills()},[loadSkills]);
  const selectedSkill=skillState.definitions.find((skill:any)=>skill.id===selectedSkillId),selectedRun=skillState.runs.find((run:any)=>run.id===selectedRunId);
  useEffect(()=>{if(!selectedSkill)return;const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());setRunInput(selectedSkill.procedureId==="daily_check"?{date:today,limit:5}:selectedSkill.procedureId==="area_overview"?{area:"faith",limit:5}:selectedSkill.procedureId==="project_snapshot"?{projectId:projects[0]?.id||"",limit:5}:{focus:"",limit:3});const latest=skillState.runs.find((run:any)=>run.skillId===selectedSkill.id);setSelectedRunId(latest?.id||"")},[projects,selectedSkill,skillState.runs]);
  const categories=["Alle",...new Set(skillState.catalog.map((item:any)=>item.category))] as string[];
  const list=skillState.definitions.filter((skill:any)=>JSON.stringify(skill).toLowerCase().includes(q.toLowerCase())&&(category==="Alle"||skill.category===category));
  const beginCreate=()=>{const procedure=skillState.catalog[0];setDraft({name:"",purpose:"",procedureId:procedure?.id||"priority_review",status:"active",allowedSources:procedure?.defaultSources||[],assignedAgentWorkflowIds:[]});setEditing({});setArchiveArmed(false);setError("")};
  const beginEdit=(skill:any)=>{setDraft({...skill});setEditing(skill);setArchiveArmed(false);setError("")};
  const selectProcedure=(procedureId:string)=>{const procedure=skillState.catalog.find((item:any)=>item.id===procedureId);setDraft((current:any)=>({...current,procedureId,allowedSources:procedure?.defaultSources||[]}))};
  const toggleDraftValue=(key:string,value:string)=>setDraft((current:any)=>{const values=Array.isArray(current[key])?current[key]:[];return{...current,[key]:values.includes(value)?values.filter((item:string)=>item!==value):[...values,value]}});
  const skillRequest=async(method:"POST"|"PATCH",body:any)=>{if(skillState.state!=="online")throw new Error("Private Skill-Quelle ist nicht schreibbereit");let response:Response;try{response=await privateApiFetch("/api/skills",{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)})}catch{setSkillState({state:"error",definitions:[],runs:[],catalog:[]});setSelectedSkillId("");setSelectedRunId("");throw new Error("Private Skill-Quelle nicht erreichbar")}let result:any;try{result=await response.json()}catch{setSkillState({state:"error",definitions:[],runs:[],catalog:[]});setSelectedSkillId("");setSelectedRunId("");throw new Error("Ungültige Antwort der Skill-Quelle")}if(!response.ok){if(response.status===409)await loadSkills();else if(privateSourceFailure(response.status)){setSkillState({state:"error",definitions:[],runs:[],catalog:[]});setSelectedSkillId("");setSelectedRunId("")}throw new Error(result.error||"Skill-Anfrage abgelehnt")}return result};
  const saveDefinition=async()=>{setBusy(true);setError("");try{const action=editing?.id?"update_definition":"create_definition",method=editing?.id?"PATCH":"POST",result=await skillRequest(method,{action,skillId:editing?.id,definition:draft});await loadSkills();setSelectedSkillId(result.definition.id);setEditing(null);note(editing?.id?"Skill-Version aktualisiert":"Sichere lokale Skill-Definition gespeichert")}catch(cause){setError(cause instanceof Error?cause.message:"Skill konnte nicht gespeichert werden")}finally{setBusy(false)}};
  const archiveDefinition=async()=>{if(!editing?.id)return;setBusy(true);setError("");try{await skillRequest("PATCH",{action:"archive_definition",skillId:editing.id,version:editing.version});setEditing(null);setSelectedSkillId("");await loadSkills();note("Skill reversibel archiviert")}catch(cause){setError(cause instanceof Error?cause.message:"Archivieren fehlgeschlagen")}finally{setBusy(false)}};
  const runPreview=async()=>{if(!selectedSkill)return;setBusy(true);setError("");try{const result=await skillRequest("POST",{action:"run_preview",skillId:selectedSkill.id,input:runInput});await loadSkills();setSelectedRunId(result.run.id);note("Lokale Skill-Vorschau gespeichert · 0 externe Aktionen")}catch(cause){setError(cause instanceof Error?cause.message:"Skill-Vorschau fehlgeschlagen")}finally{setBusy(false)}};
  const reviewRun=async()=>{if(!selectedRun)return;setBusy(true);setError("");try{const result=await skillRequest("PATCH",{action:"review_run",runId:selectedRun.id,version:selectedRun.version});await loadSkills();setSelectedRunId(result.run.id);note("Skill-Vorschau geprüft · keine Folgeaktion")}catch(cause){setError(cause instanceof Error?cause.message:"Review fehlgeschlagen")}finally{setBusy(false)}};
  const validRunInput=selectedSkill?.procedureId==="priority_review"?String(runInput.focus||"").trim().length>=2:selectedSkill?.procedureId==="project_snapshot"?projectState==="online"&&Boolean(runInput.projectId):selectedSkill?.procedureId==="daily_check"?Boolean(runInput.date):Boolean(runInput.area);
  return <>
    <Intro eyebrow="LOKALE PROZEDUREN · VERSIONIERT & SICHER" title="Wiederverwendbare Skills mit sichtbarer Wirkung." action={<Btn onClick={skillState.state==="online"?beginCreate:undefined}><I.Plus/>Skill definieren</Btn>}><p>Nur feste lokale Lese-, Transformations- und Vorschlagsabläufe. Kein Code, Netzwerk, Modell oder externer Schreibzugriff.</p></Intro>
    <div className="skillTruth"><span><I.ShieldCheck/><b>Freigabeklasse</b><small>local_read_proposal</small></span><span><I.Workflow/><b>Ausführung</b><small>deterministisch · lokal</small></span><span><I.Ban/><b>Gesperrt</b><small>Shell · Netzwerk · Modelle · Dateien</small></span><span><I.History/><b>Nachweis</b><small>Version · Status · Audit</small></span></div>
    {skillState.state==="loading"&&<p role="status">Private Skill-Quelle wird geladen …</p>}
    {skillState.state==="error"&&<RetryNotice message={error||"Private Skill-Daten nicht erreichbar. Es werden keine Ersatzdefinitionen gezeigt."} onRetry={loadSkills}/>}
    {projectState==="error"&&<RetryNotice message="Projektquelle für Projekt-Skills ist gerade nicht verifizierbar." onRetry={reloadProjects} label="Projekte neu laden"/>}
    {skillState.state==="online"&&editing&&<Card className="skillEditor"><div className="row"><div><Tag>{editing.id?`DEFINITION · VERSION ${editing.version}`:"NEUE DEFINITION"}</Tag><h3>{editing.id?"Skill bearbeiten":"Sicheren Skill anlegen"}</h3></div><button aria-label="Skill-Editor schließen" onClick={()=>setEditing(null)}><I.X/></button></div><div className="skillEditorGrid"><label>Name<input maxLength={80} value={draft.name||""} onChange={event=>setDraft({...draft,name:event.target.value})} placeholder="z. B. Wochenprioritäten prüfen"/></label><label>Status<select value={draft.status||"active"} onChange={event=>setDraft({...draft,status:event.target.value})}><option value="active">Aktiv</option><option value="paused">Pausiert</option></select></label><label className="wide">Zweck<textarea maxLength={500} value={draft.purpose||""} onChange={event=>setDraft({...draft,purpose:event.target.value})} placeholder="Welche klare lokale Übersicht soll entstehen?"/></label><label className="wide">Geprüfte Prozedur<select value={draft.procedureId||""} onChange={event=>selectProcedure(event.target.value)}>{skillState.catalog.map((procedure:any)=><option key={procedure.id} value={procedure.id}>{procedure.name} · {procedure.category}</option>)}</select></label></div>{(()=>{const procedure=skillState.catalog.find((item:any)=>item.id===draft.procedureId);return procedure&&<><div className="skillDefinitionBlock"><b>Erlaubte echte Quellen</b><div>{procedure.allowedSources.map((source:string)=><label key={source}><input type="checkbox" checked={(draft.allowedSources||[]).includes(source)} onChange={()=>toggleDraftValue("allowedSources",source)}/>{source}</label>)}</div></div><div className="skillDefinitionBlock"><b>Transparente Agentenreferenzen</b><div>{Object.entries(agentNames).map(([id,name])=><label key={id}><input type="checkbox" checked={(draft.assignedAgentWorkflowIds||[]).includes(id)} onChange={()=>toggleDraftValue("assignedAgentWorkflowIds",id)}/>{name}</label>)}</div></div><ol className="skillSteps">{procedure.deterministicSteps.map((step:string)=><li key={step}>{step}</li>)}</ol></>})()}<div className="workflowGate"><I.Lock/><span><b>Technische Sperre</b>Beliebiger Code, Shell, dynamische Imports, Netzwerk, Modelle, externe Writes, Dateiänderungen und stille Ketten sind nicht konfigurierbar.</span></div>{error&&<p className="plannerError" role="alert">{error}</p>}<div className="editorActions"><Btn onClick={!busy&&String(draft.name||"").trim().length>=2&&String(draft.purpose||"").trim().length>=2&&(draft.allowedSources||[]).length?saveDefinition:undefined}>{busy?"Speichert …":"Definition speichern"}</Btn><button onClick={()=>setEditing(null)}>Abbrechen</button>{editing.id&&!archiveArmed&&<button className="dangerQuiet" onClick={()=>setArchiveArmed(true)}>Archivieren …</button>}{editing.id&&archiveArmed&&<button className="dangerQuiet" onClick={archiveDefinition} disabled={busy}>Archivierung bestätigen</button>}</div></Card>}
    <div className="skillbar"><label><I.Search/><input value={q} onChange={event=>setQ(event.target.value)} placeholder="Skills durchsuchen …"/></label>{categories.map(value=><button aria-pressed={category===value} className={category===value?"active":""} key={value} onClick={()=>setCategory(value)}>{value}</button>)}</div>
    {skillState.state==="online"&&skillState.definitions.length===0&&<Card className="honestEmpty"><I.Sparkles/><span><b>Noch keine lokale Skill-Definition</b>Lege eine Definition aus einer der vier geprüften Prozeduren an. Es werden keine Beispieldaten erzeugt.</span></Card>}
    {skillState.legacyMetadataCount>0&&<p className="statusNote"><I.Info/>{skillState.legacyMetadataCount} ältere Metadaten-Skills bleiben nicht ausführbar, bis sie bewusst mit einer geprüften Prozedur gespeichert werden.</p>}
    <div className="skillWorkspace">
      <div className="skillDefinitions">{list.map((skill:any)=><button aria-pressed={selectedSkillId===skill.id} className={selectedSkillId===skill.id?"active":""} key={skill.id} onClick={()=>{setSelectedSkillId(skill.id);setError("")}}><span><I.Sparkles/><b>{skill.name}</b><small>{skill.purpose||"Noch keine sichere Prozedur zugeordnet"}</small></span><em className={skill.executable?"ok":""}>{skill.executable?"Lokal bereit":skill.status==="paused"?"Pausiert":"Nicht ausführbar"}</em><small>{skill.category||"Metadaten"} · v{skill.version} · {(skill.assignedAgentWorkflowIds||[]).map((id:string)=>agentNames[id]).join(", ")||"Kein Agentenbezug"}</small></button>)}</div>
      {selectedSkill&&<Card className="skillRunner"><div className="row"><div><Tag>SKILL-AUSFÜHRUNG · VORSCHAU</Tag><h3>{selectedSkill.name}</h3></div><button onClick={()=>beginEdit(selectedSkill)}><I.Settings2/>Bearbeiten</button></div><p>{selectedSkill.purpose}</p><div className="skillContract"><span><b>Input</b>{Object.values(selectedSkill.inputSchema||{}).map((field:any)=>field.label).join(" · ")}</span><span><b>Quellen</b>{(selectedSkill.allowedSources||[]).join(" · ")}</span><span><b>Output</b>Lokale Vorschau · 0 Writes</span></div>{selectedSkill.procedureId==="priority_review"&&<label>Fokus<textarea maxLength={500} value={runInput.focus||""} onChange={event=>setRunInput({...runInput,focus:event.target.value})} placeholder="Was soll heute priorisiert werden?"/></label>}{selectedSkill.procedureId==="daily_check"&&<label>Datum<input type="date" value={runInput.date||""} onChange={event=>setRunInput({...runInput,date:event.target.value})}/></label>}{selectedSkill.procedureId==="area_overview"&&<label>Lebensbereich<select value={runInput.area||"faith"} onChange={event=>setRunInput({...runInput,area:event.target.value})}><option value="faith">Glaube</option><option value="health">Gesundheit</option><option value="finance">Finanzen</option><option value="relations">Beziehungen</option><option value="career">Karriere</option></select></label>}{selectedSkill.procedureId==="project_snapshot"&&<label>Projekt<select disabled={projectState!=="online"} value={runInput.projectId||""} onChange={event=>setRunInput({...runInput,projectId:event.target.value})}><option value="">{projectState==="online"?"Projekt wählen":projectState==="loading"?"Projektquelle wird geladen":"Projektquelle nicht erreichbar"}</option>{projects.map((project:any)=><option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}<label>Maximale Hinweise<select value={runInput.limit||5} onChange={event=>setRunInput({...runInput,limit:Number(event.target.value)})}>{[1,2,3,4,5].map(value=><option key={value} value={value}>{value}</option>)}</select></label><Btn onClick={!busy&&selectedSkill.executable&&validRunInput?runPreview:undefined}>{busy?"Läuft lokal …":"Vorschau lokal ausführen"}<I.Play/></Btn>{!selectedSkill.executable&&<p className="statusNote"><I.PauseCircle/>Dieser Skill ist pausiert oder noch nicht sicher definiert.</p>}</Card>}
    </div>
    {selectedRun&&<Card className="skillOutput"><div className="row"><div><Tag>ECHTER PREVIEW-OUTPUT</Tag><h3>{skillState.definitions.find((skill:any)=>skill.id===selectedRun.skillId)?.name||"Archivierter Skill"}</h3></div><em className={`runStatus ${selectedRun.status}`}>{selectedRun.status}</em></div><p>{selectedRun.output.summary}</p><div className="sourceCounts">{Object.entries(selectedRun.sourceEvidence||{}).map(([source,count])=><span key={source}><b>{String(count)}</b>{source}</span>)}</div>{selectedRun.output.items.length===0?<div className="honestEmpty"><I.CheckCircle2/><span><b>Keine passenden echten Einträge</b>Die Vorschau bleibt leer, statt Aufgaben oder Ergebnisse zu erfinden.</span></div>:<div className="skillPreviewItems">{selectedRun.output.items.map((entry:any)=><div key={entry.id}><span><b>{entry.title}</b><small>{entry.rationale}</small></span><em>{entry.source}</em></div>)}</div>}<ol className="skillSteps">{selectedRun.output.deterministicSteps.map((step:string)=><li key={step}>{step}</li>)}</ol><div className="workflowGate"><I.ShieldCheck/><span><b>Nur gelesen und transformiert</b>Kein Modell, Netzwerk, Datei- oder externer Schreibzugriff. Der Output löst keine Folgeaktion aus.</span></div>{selectedRun.status==="preview"&&<Btn onClick={!busy?reviewRun:undefined}>Vorschau als geprüft markieren</Btn>}{selectedRun.status==="reviewed"&&<p className="statusNote"><I.CheckCircle2/>Geprüft · keine Folgeaktion ausgeführt</p>}</Card>}
    {skillState.runs.length>0&&<Card className="skillRunHistory"><Tag>LAUFHISTORIE · RESUME/AUDIT</Tag><div>{skillState.runs.map((run:any)=><button className={selectedRunId===run.id?"active":""} key={run.id} onClick={()=>setSelectedRunId(run.id)}><I.History/><span><b>{skillState.definitions.find((skill:any)=>skill.id===run.skillId)?.name||"Archivierter Skill"}</b><small>Definitionsversion {run.definitionVersion} · {new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}).format(new Date(run.updatedAt))}</small></span><em>{run.status}</em></button>)}</div></Card>}
  </>;
}
function Chats({ note }: any) {
  const [summary, setSummary] = useState(""), [captureTitle, setCaptureTitle] = useState(""), [area, setArea] = useState("Inbox"), [projectId, setProjectId] = useState(""), [query, setQuery] = useState(""), [selectedId, setSelectedId] = useState(""), [organizeDraft, setOrganizeDraft] = useState<any>(null);
  const { records: inboxRecords, state, create, update, reload: reloadCaptures } = useSharedRecords("inbox_items");
  const { records: projects, state: projectState, reload: reloadProjects } = useSharedRecords("projects");
  const captures = inboxRecords.filter((item: any) => item.itemType === "ChatGPT-Zusammenfassung");
  const visibleCaptures = captures.filter((item: any) => !query.trim() || String(item.title || "").toLocaleLowerCase("de-DE").includes(query.trim().toLocaleLowerCase("de-DE")));
  const selectedCapture = captures.find((item: any) => item.id === selectedId);
  const saveSummary = async () => {
    const value = summary.trim(), title = captureTitle.trim();
    if (title.length < 2 || value.length < 2) return note("Titel und ausgewählte Zusammenfassung werden benötigt");
    try { const created = await create({ title, content: value, itemType: "ChatGPT-Zusammenfassung", status: "active", area, projectId: projectId || "", source: "manual-companion-import", providerMode: "chatgpt-subscription-companion", modelAccess: "none" }); setSummary(""); setCaptureTitle(""); setArea("Inbox"); setProjectId(""); setSelectedId(created.id); note("Ausgewählte Zusammenfassung im gemeinsamen Eingang gespeichert"); } catch (error) { note(error instanceof Error ? error.message : "Zusammenfassung konnte nicht gespeichert werden"); }
  };
  const openCapture = (capture: any) => { setSelectedId(capture.id); setOrganizeDraft({ title: capture.title, area: capture.area || "Inbox", projectId: capture.projectId || "", status: capture.status || "active" }); };
  const saveOrganization = async () => { if (!selectedCapture || !organizeDraft) return; try { await update({ ...selectedCapture, ...organizeDraft }); note("Companion-Zusammenfassung gemeinsam organisiert"); setOrganizeDraft(null); } catch (error) { note(error instanceof Error ? error.message : "Organisation konnte nicht gespeichert werden"); } };
  const areaOptions = [["Inbox","Noch offen"],["faith","Glaube"],["career","Karriere"],["health","Gesundheit"],["finance","Finanzen"],["relations","Beziehungen"],["projects","Projekte"]];
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
      <div className="companionWorkspace">
        <Card className="chatbox companionCapture">
          <Tag>BEWUSSTE ÜBERNAHME · KEIN SCRAPING</Tag>
          <h3>Eine ausgewählte ChatGPT-Zusammenfassung erfassen</h3>
          <p>Füge nur den Inhalt ein, den Agentic OS dauerhaft strukturieren darf. Es gibt keinen automatischen Zugriff auf deinen Chatverlauf.</p>
          <div className="companionCaptureFields"><label>Titel<input maxLength={120} value={captureTitle} onChange={(event) => setCaptureTitle(event.target.value)} placeholder="Worum ging es in diesem Gespräch?" /></label><label>Lebensbereich<select value={area} onChange={(event) => setArea(event.target.value)}>{areaOptions.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Projekt (optional)<select disabled={projectState !== "online"} value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">{projectState === "online" ? "Kein Projekt" : projectState === "loading" ? "Projektquelle wird geladen" : "Projektquelle nicht erreichbar"}</option>{projects.map((project: any) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><label className="wide">Ausgewählte Zusammenfassung<textarea maxLength={8000} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Zusammenfassung oder nächste Schritte aus ChatGPT …" /></label></div>
          <Btn onClick={state === "online" && (!projectId || projectState === "online") && captureTitle.trim().length >= 2 && summary.trim().length >= 2 ? saveSummary : undefined}>In gemeinsamen Eingang übernehmen</Btn>
          <small className="companionTruth"><I.Shield />Manueller Import · lokal gespeichert · {state === "online" ? `${captures.filter((item: any) => item.itemType === "ChatGPT-Zusammenfassung").length} erfasst` : "Store nicht erreichbar"}</small>
        </Card>
        <Card className="providerTruth"><Tag>PROVIDER-MODI · EHRLICHER STATUS</Tag><div><span className="provider online"><i/><b>ChatGPT Companion</b><small>Aktiver manueller Modus · im vorhandenen Abo · kein direkter Modellzugriff</small></span><span className="provider unconfigured"><i/><b>OpenAI API</b><small>Deaktiviert · nutzungsbasiert · Kill Switch aktiv · separate Kostenfreigabe</small></span><span className="provider unconfigured"><i/><b>Lokales Modell</b><small>Nicht verifiziert · kein Runtime-/Modell-Installationsstand behauptet</small></span></div><p>Eine Zusammenfassung speichert nur den von dir ausgewählten Text. Agentic OS liest weder Verlauf noch Modellnamen oder Subscription-Limits automatisch.</p></Card>
      </div>
      <Card className="companionLibrary"><div className="row"><div><Tag>LOKALE COMPANION-BIBLIOTHEK</Tag><h3>{state === "online" ? `${captures.length} bewusst übernommene Zusammenfassungen` : state === "loading" ? "Zusammenfassungen werden geladen" : "Zusammenfassungen offline"}</h3></div><label><span className="srOnly">Companion-Zusammenfassungen durchsuchen</span><input disabled={state !== "online"} onChange={(event) => setQuery(event.target.value)} placeholder="Titel filtern …" type="search" value={query}/></label></div>{state === "error" && <RetryNotice message="Gemeinsame Zusammenfassungen sind gerade nicht erreichbar; es werden keine Ersatzgespräche angezeigt." onRetry={reloadCaptures} label="Bibliothek neu laden"/>}{projectState === "error" && <RetryNotice message="Projektzuordnungen für Companion-Einträge sind gerade nicht verifizierbar." onRetry={reloadProjects} label="Projekte neu laden"/>}{state === "online" && captures.length === 0 && <div className="honestEmpty"><I.MessagesSquare/><span><b>Noch keine ausgewählte Zusammenfassung</b>Es werden keine Chatverläufe oder Beispielgespräche importiert.</span></div>}{state === "online" && captures.length > 0 && visibleCaptures.length === 0 && <p>Kein Titel passt zur lokalen Suche.</p>}<div className="companionCaptureList">{state === "online" && visibleCaptures.map((capture: any) => <button aria-pressed={selectedId === capture.id} className={selectedId === capture.id ? "active" : ""} key={capture.id} onClick={() => openCapture(capture)} type="button"><I.MessageSquareText/><span><b>{capture.title}</b><small>{areaOptions.find(([id]) => id === (capture.area || "Inbox"))?.[1]} · {capture.projectId ? projects.find((project: any) => project.id === capture.projectId)?.title || "Projekt nicht verfügbar" : "Kein Projekt"} · {capture.status === "completed" ? "Abgeschlossen" : "Offen"}</small></span><I.ChevronRight/></button>)}</div></Card>
      {state === "online" && selectedCapture && <Card className="companionDetail"><div className="row"><div><Tag>MANUELLER IMPORT · PRIVAT</Tag><h3>{selectedCapture.title}</h3></div><button aria-label="Companion-Detail schließen" onClick={() => { setSelectedId(""); setOrganizeDraft(null); }}><I.X/></button></div><p>{selectedCapture.content}</p><small>Quelle: manuelle Auswahl · Providerzugriff: keiner · Modell: nicht verifiziert</small>{organizeDraft ? <div className="companionOrganize"><label>Titel<input maxLength={120} value={organizeDraft.title} onChange={(event) => setOrganizeDraft({ ...organizeDraft, title: event.target.value })}/></label><label>Lebensbereich<select value={organizeDraft.area} onChange={(event) => setOrganizeDraft({ ...organizeDraft, area: event.target.value })}>{areaOptions.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Projekt<select disabled={projectState !== "online"} value={organizeDraft.projectId} onChange={(event) => setOrganizeDraft({ ...organizeDraft, projectId: event.target.value })}><option value="">{projectState === "online" ? "Kein Projekt" : projectState === "loading" ? "Projektquelle wird geladen" : "Projektquelle nicht erreichbar"}</option>{projects.map((project: any) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><label>Status<select value={organizeDraft.status} onChange={(event) => setOrganizeDraft({ ...organizeDraft, status: event.target.value })}><option value="active">Offen</option><option value="planned">Eingeplant</option><option value="completed">Abgeschlossen</option></select></label><div className="editorActions"><Btn onClick={organizeDraft.title.trim().length >= 2 && (!organizeDraft.projectId || projectState === "online") ? saveOrganization : undefined}>Organisation speichern</Btn><button onClick={() => setOrganizeDraft(null)}>Abbrechen</button></div></div> : <Btn soft onClick={() => openCapture(selectedCapture)}>Zuordnung bearbeiten</Btn>}</Card>}
    </>
  );
}
function Inbox({ note }: any) {
  const [type, setType] = useState("Idee"),
    [txt, setTxt] = useState(""),
    [triageId, setTriageId] = useState(""),
    [triageDraft, setTriageDraft] = useState<any>(null),
    [filter, setFilter] = useState<"open" | "assigned" | "completed" | "all">("open"),
    [query, setQuery] = useState(""),
    [archiveArmed, setArchiveArmed] = useState(false);
  const { records: entries, state, create, update, archive, reload: reloadEntries } = useSharedRecords("inbox_items");
  const { records: projects, state: projectState, reload: reloadProjects } = useSharedRecords("projects");
  const { records: agents, state: agentState, reload: reloadAgents } = useSharedRecords("agents");
  const types = ["Idee", "Aufgabe", "Notiz", "ChatGPT-Notiz", "Link", "Dateiverweis"];
  const areaOptions = [["Inbox", "Noch offen"], ["faith", "Glaube"], ["career", "Karriere"], ["health", "Gesundheit"], ["finance", "Finanzen"], ["relations", "Beziehungen"], ["projects", "Projekte"]];
  const selectedEntry = entries.find((entry: any) => entry.id === triageId);
  const categorized = {
    open: entries.filter((entry: any) => entry.status !== "completed" && (!entry.area || entry.area === "Inbox") && !entry.projectId && !entry.agentId),
    assigned: entries.filter((entry: any) => entry.status !== "completed" && ((entry.area && entry.area !== "Inbox") || entry.projectId || entry.agentId)),
    completed: entries.filter((entry: any) => entry.status === "completed"),
    all: entries,
  };
  const filteredEntries = categorized[filter].filter((entry: any) => !query.trim() || String(entry.title || "").toLocaleLowerCase("de-DE").includes(query.trim().toLocaleLowerCase("de-DE")));
  const capture = async () => {
    const value = txt.trim();
    if (!value) return;
    try {
      await create({ title: value.slice(0, 120), content: value, itemType: type.toLowerCase(), status: "active", area: "Inbox", projectId: "", agentId: "" });
      setTxt("");
      note(`${type} privat im gemeinsamen Eingang gespeichert`);
    } catch (error) { note(error instanceof Error ? error.message : "Erfassen fehlgeschlagen"); }
  };
  const openTriage = (entry: any) => {
    setTriageId(entry.id);
    setTriageDraft({ area: entry.area || "Inbox", projectId: entry.projectId || "", agentId: entry.agentId || "", status: entry.status || "active", content: entry.content || entry.title });
    setArchiveArmed(false);
  };
  const completeEntry = async (entry: any) => { try { await update({ ...entry, status: entry.status === "completed" ? "active" : "completed" }); note(entry.status === "completed" ? "Inbox-Eintrag wieder geöffnet" : "Inbox-Eintrag abgeschlossen"); } catch (error) { note(error instanceof Error ? error.message : "Status konnte nicht gespeichert werden"); } };
  const archiveSelected = async () => { if (!selectedEntry || !archiveArmed) return; try { await archive(selectedEntry.id); setTriageId(""); setTriageDraft(null); setArchiveArmed(false); note("Inbox-Eintrag reversibel archiviert"); } catch (error) { note(error instanceof Error ? error.message : "Archivieren fehlgeschlagen"); } };
  const saveTriage = async () => {
    if (!selectedEntry || !triageDraft) return;
    if ((triageDraft.projectId && projectState !== "online") || (triageDraft.agentId && agentState !== "online")) return note("Zuordnungsquellen sind gerade nicht vollständig verifizierbar");
    try {
      await update({ ...selectedEntry, ...triageDraft });
      setTriageId(""); setTriageDraft(null);
      note("Inbox-Zuordnung gemeinsam gespeichert");
    } catch (error) { note(error instanceof Error ? error.message : "Triage fehlgeschlagen"); }
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
          {types.map((x) => (
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
          placeholder={type === "Dateiverweis" ? "Lokalen Dateipfad oder Beschreibung erfassen · keine Datei wird hochgeladen …" : `${type} schnell erfassen …`}
        />
        <div className="row">
          <span>{type === "Dateiverweis" ? "Nur ein privater Verweis; kein Datei-Upload oder Kopieren." : "Danach real in Bereich, Projekt oder Agent triagieren."}</span>
          <Btn onClick={state === "online" && txt.trim().length >= 2 ? capture : undefined}>
            Erfassen <I.ArrowRight />
          </Btn>
        </div>
      </Card>
      {state === "online" && entries.length === 0 && (
        <Card><Tag>ECHTE DATENQUELLE · LEER</Tag><h3>Dein Eingang ist leer</h3><p>Neue Einträge erscheinen in Desktop und iPhone.</p></Card>
      )}
      {state === "error" && <RetryNotice message="Gemeinsamer Eingang nicht erreichbar. Es werden keine lokalen Ersatz- oder Beispieldaten angezeigt." onRetry={reloadEntries} label="Inbox neu laden"/>}
      {projectState === "error" && <RetryNotice message="Projektzuordnungen sind gerade nicht verifizierbar." onRetry={reloadProjects} label="Projekte neu laden"/>}
      {agentState === "error" && <RetryNotice message="Agentenreferenzen sind gerade nicht verifizierbar." onRetry={reloadAgents} label="Agenten neu laden"/>}
      {state === "online" && <Card className="inboxReviewBar"><div><Tag>GEMEINSAME REVIEW-ANSICHT</Tag><b>{categorized.open.length} offen · {categorized.assigned.length} zugeordnet · {categorized.completed.length} abgeschlossen</b></div><div className="inboxFilters" role="group" aria-label="Inbox filtern">{[["open","Offen"],["assigned","Zugeordnet"],["completed","Abgeschlossen"],["all","Alle"]].map(([id,label]) => <button aria-pressed={filter === id} className={filter === id ? "active" : ""} key={id} onClick={() => setFilter(id as any)} type="button">{label}</button>)}</div><label><span className="srOnly">Inbox-Titel durchsuchen</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Titel filtern …" type="search" value={query}/></label></Card>}
      <div className="inboxlist">
        {state === "online" && entries.length > 0 && filteredEntries.length === 0 && <Card className="honestEmpty"><I.Search/><span><b>Keine Einträge in dieser Ansicht</b>Filter oder Titelsuche ändern; es werden keine Ersatzdaten gezeigt.</span></Card>}
        {state === "online" && filteredEntries.map((x: any) => (
          <Card key={x.id}>
            <i />
            <span>
              <b>{x.title}</b>
              <small>
                {x.itemType || "Notiz"} · {areaOptions.find(([id]) => id === (x.area || "Inbox"))?.[1] || x.area}
                {x.projectId ? ` · Projekt: ${projects.find((project: any) => project.id === x.projectId)?.title || "nicht mehr verfügbar"}` : ""}
                {x.agentId ? ` · Agent: ${agents.find((agent: any) => agent.id === x.agentId)?.name || "nicht mehr verfügbar"}` : ""}
              </small>
            </span>
            <div className="inboxCardActions"><button aria-pressed={x.status === "completed"} onClick={() => completeEntry(x)} type="button">{x.status === "completed" ? "Wieder öffnen" : "Abschließen"}<I.CheckCircle2/></button><button aria-expanded={triageId === x.id} onClick={() => triageId === x.id ? (setTriageId(""), setTriageDraft(null), setArchiveArmed(false)) : openTriage(x)} type="button">{triageId === x.id ? "Triage schließen" : "Triage öffnen"}<I.SlidersHorizontal /></button></div>
          </Card>
        ))}
      </div>
      {state === "online" && selectedEntry && triageDraft && <Card className="inboxTriage">
        <div className="row"><div><Tag>TRIAGE · GEMEINSAM</Tag><h3>{selectedEntry.title}</h3></div><button aria-label="Triage schließen" onClick={() => { setTriageId(""); setTriageDraft(null); }}><I.X /></button></div>
        <p>Ordne nur zu; Agentic OS startet dadurch weder einen Agenten noch eine externe Aktion.</p>
        <div className="triageGrid">
          <label>Lebensbereich<select value={triageDraft.area} onChange={(event) => setTriageDraft({ ...triageDraft, area: event.target.value })}>{areaOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label>Projekt<select disabled={projectState !== "online"} value={triageDraft.projectId} onChange={(event) => setTriageDraft({ ...triageDraft, projectId: event.target.value })}><option value="">{projectState === "online" ? "Kein Projekt" : projectState === "loading" ? "Projektquelle wird geladen" : "Projektquelle nicht erreichbar"}</option>{projects.map((project: any) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
          <label>Agentenreferenz<select disabled={agentState !== "online"} value={triageDraft.agentId} onChange={(event) => setTriageDraft({ ...triageDraft, agentId: event.target.value })}><option value="">{agentState === "online" ? "Kein Agent" : agentState === "loading" ? "Agentenquelle wird geladen" : "Agentenquelle nicht erreichbar"}</option>{agents.map((agent: any) => <option key={agent.id} value={agent.id}>{agent.name || agent.title}</option>)}</select></label>
          <label>Stand<select value={triageDraft.status} onChange={(event) => setTriageDraft({ ...triageDraft, status: event.target.value })}><option value="active">Zu prüfen</option><option value="planned">Eingeplant</option><option value="completed">Abgeschlossen</option></select></label>
          <label className="wide">Privater Inhalt<textarea maxLength={8000} value={triageDraft.content} onChange={(event) => setTriageDraft({ ...triageDraft, content: event.target.value })} /></label>
        </div>
        <div className="editorActions"><Btn onClick={triageDraft.content.trim().length >= 2 && (!triageDraft.projectId || projectState === "online") && (!triageDraft.agentId || agentState === "online") ? saveTriage : undefined}>Triage speichern</Btn><button onClick={() => { setTriageId(""); setTriageDraft(null); setArchiveArmed(false); }}>Abbrechen</button>{!archiveArmed ? <button className="dangerQuiet" onClick={() => setArchiveArmed(true)}>Archivieren …</button> : <button className="dangerQuiet" onClick={archiveSelected}>Archivierung bestätigen</button>}</div>
      </Card>}
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
    setStatus({ state: "loading", connected: false });
    setCalendars([]); setPlan(null); setSelectedOutcomes([]); setSelectedBlocks([]); setHistory([]); setApproval(null); setConfirmation("");
    setError("");
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      const [calendarResponse, catalogResponse, planResponse] = await Promise.all([
        privateApiFetch("/api/calendar/status", { cache: "no-store" }),
        privateApiFetch("/api/calendar/calendars", { cache: "no-store" }),
        privateApiFetch("/api/planner", { cache: "no-store" }),
      ]);
      const [calendarStatus, catalog, latest] = await Promise.all([calendarResponse.json(), catalogResponse.json(), planResponse.json()]);
      if (!calendarResponse.ok || !catalogResponse.ok || !planResponse.ok) throw new Error();
      setStatus({ state: "ready", ...calendarStatus });
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
      setCalendars([]); setPlan(null); setSelectedOutcomes([]); setSelectedBlocks([]); setHistory([]); setApproval(null); setConfirmation("");
      setError("Private Planner-Quelle ist gerade nicht erreichbar.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const invalidatePlannerSource=()=>{setStatus({state:"error",connected:false});setCalendars([]);setPlan(null);setSelectedOutcomes([]);setSelectedBlocks([]);setHistory([]);setApproval(null);setConfirmation("")};
  const plannerRequest=async(url:string,init:RequestInit,externalWrite=false)=>{if(status.state!=="ready")throw new Error("Private Planner-Quelle ist nicht schreibbereit");let response:Response;try{response=await privateApiFetch(url,init)}catch{invalidatePlannerSource();throw new Error(externalWrite?"Write-Ergebnis ist nicht bestätigt. Kalender vor einem neuen Versuch prüfen.":"Private Planner-Quelle nicht erreichbar")}let result:any;try{result=await response.json()}catch{invalidatePlannerSource();throw new Error(externalWrite?"Write-Ergebnis ist nicht bestätigt. Kalender vor einem neuen Versuch prüfen.":"Ungültige Antwort der Planner-Quelle")}if(!response.ok){if(externalWrite&&result.outcome==="unknown")throw new Error("Write-Ergebnis ist nicht bestätigt. Kalender prüfen und eine neue exakte Vorschau erzeugen.");if(externalWrite&&result.written===true)throw new Error(result.error||"Write wurde bestätigt, aber Rückleseprüfung oder Audit fehlen. Nicht erneut senden.");if(externalWrite&&result.approvalConsumed)throw new Error(result.error||"Freigabe wurde verbraucht. Status prüfen und eine neue exakte Vorschau erzeugen.");if(response.status===409&&url==="/api/planner")await load();else if(privateSourceFailure(response.status))invalidatePlannerSource();throw new Error(result.error||"Planner-Anfrage abgelehnt")}return result};

  const toggleLimited = (id: string, setter: (value: string[]) => void, current: string[]) => {
    if (current.includes(id)) return setter(current.filter((item) => item !== id));
    if (current.length >= 3) return note("Maximal drei Einträge auswählen");
    setter([...current, id]);
  };

  const generate = async () => {
    if (!selectedCalendars.length) return note("Bitte mindestens einen Kalender auswählen");
    setBusy("generate"); setError(""); setApproval(null);
    try {
      const result = await plannerRequest("/api/planner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ selectedCalendarIds: selectedCalendars }) });
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
      const result = await plannerRequest("/api/planner", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ planId: plan.id, version: plan.version, selectedOutcomeIds: selectedOutcomes, selectedBlockIds: selectedBlocks }) });
      setPlan(result.plan);
      setHistory(result.history || []);
      note("Review gemeinsam gespeichert · weiterhin 0 Writes");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Review fehlgeschlagen"); }
    finally { setBusy("idle"); }
  };

  const prepareApproval = async (block: any) => {
    setBusy("approval"); setError(""); setApproval(null); setConfirmation("");
    try {
      const result = await plannerRequest("/api/calendar/write-proposal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ selectedCalendarIds: selectedCalendars, change: { action: "create", calendarId: block.calendarId, title: block.title, start: block.start, end: block.end, idempotencyKey: `weekly:${plan.id}:${block.id}` } }) });
      setApproval({ ...result, block });
      note("Exakte Einzelvorschau vorbereitet · noch nicht geschrieben");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Freigabevorbereitung fehlgeschlagen"); }
    finally { setBusy("idle"); }
  };

  const executeApprovedWrite = async () => {
    if (!approval || confirmation !== "DIESEN_TERMIN_JETZT_SCHREIBEN") return;
    setBusy("approval"); setError("");
    try {
      const result = await plannerRequest("/api/calendar/write", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ approvalToken: approval.approvalToken, confirmation }) }, true);
      setApproval(null); setConfirmation("");
      note(result.duplicatePrevented ? "Duplikat verhindert · nichts geschrieben" : "Einzeltermin geschrieben und auditiert");
    } catch (reason) { setApproval(null); setConfirmation(""); setError(reason instanceof Error ? reason.message : "Kalenderwrite fehlgeschlagen; vor einem neuen Versuch Status prüfen"); }
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
        <div className="plannerStep"><span>1</span><div><Tag>QUELLENSTATUS</Tag><h3>{status.state === "loading" ? "Planner-Quellen werden geprüft" : status.state === "error" ? "Planner-Quellen nicht erreichbar" : status.connected ? "Google Calendar ist verbunden" : status.configured ? "Google-Verbindung braucht Freigabe" : "Google Calendar ist unkonfiguriert"}</h3></div></div>
        <p className="sourceLine"><I.Database /> Aufgaben, Inbox und Projekte: Laptop Shared Store · Kalender: begrenzter 8-Tage-Read · Zeitzone Europe/Berlin.</p>
        {status.state === "loading" ? <p role="status">Kalender und letzter Plan werden privat geladen …</p> : calendars.length > 0 ? <div className="plannerCalendars" role="group" aria-label="Kalender auswählen">
          {calendars.map((calendar) => <label key={calendar.id}><input checked={selectedCalendars.includes(calendar.id)} onChange={() => setSelectedCalendars((current) => current.includes(calendar.id) ? current.filter((id) => id !== calendar.id) : current.length < 12 ? [...current, calendar.id] : current)} type="checkbox"/><span><b>{calendar.summary}</b><small>{calendar.writable ? "Schreibziel möglich" : "Nur Lesen"}</small></span></label>)}
        </div> : <div className="honestEmpty"><I.CloudOff /><span><b>Keine echte Kalenderliste verfügbar</b>Ohne verbundene Quelle erzeugt Agentic OS keine Fake-Blöcke.</span></div>}
        <Btn onClick={status.connected && busy === "idle" ? generate : undefined}>{busy === "generate" ? "Wird ausgewertet …" : "Echten Vorschlag erzeugen"} <I.WandSparkles /></Btn>
      </Card>

      {error && (status.state==="error"?<RetryNotice message={error} onRetry={load} label="Quellen neu laden"/>:<div className="plannerError" role="alert"><I.TriangleAlert />{error}</div>)}
      {!plan && status.state === "ready" && <Card className="honestEmpty"><I.CalendarRange /><span><b>Noch kein Wochenplan vorhanden</b>Wähle die relevanten Kalender und erzeuge den ersten Vorschlag. Es erfolgt kein Kalenderwrite.</span></Card>}
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
    [calendarStatus, setCalendarStatus] = useState<any>({
      state: "loading",
      configured: false,
      connected: false,
      mode: "unavailable",
      catalogState: "loading",
    }),[integrationHealth,setIntegrationHealth]=useState<any>({state:"loading",connectors:[]}),[selectedConnectorId,setSelectedConnectorId]=useState("");
  const loadIntegrationHealth=useCallback(async()=>{setIntegrationHealth({state:"loading",connectors:[]});setSelectedConnectorId("");try{const session=await privateApiFetch("/api/state/session",{method:"POST"});if(!session.ok)throw new Error("Private Sitzung nicht erreichbar");const response=await privateApiFetch("/api/integrations/health",{cache:"no-store"}),result=await response.json();if(!response.ok)throw new Error(result.error);setIntegrationHealth({state:"online",...result});setSelectedConnectorId(result.connectors?.[0]?.id||"")}catch(cause){setIntegrationHealth({state:"error",connectors:[],error:cause instanceof Error?cause.message:"Health Center nicht erreichbar"})}},[]);
  const loadCalendarState=useCallback(async()=>{setCalendarStatus({state:"loading",configured:false,connected:false,mode:"unavailable",catalogState:"loading"});setLiveCalendars([]);setSelectedCalendars([]);setCalendarRead({state:"idle",events:[]});try{const session=await privateApiFetch("/api/state/session",{method:"POST"});if(!session.ok)throw new Error();const [statusResponse,calendarsResponse]=await Promise.all([privateApiFetch("/api/calendar/status",{cache:"no-store"}),privateApiFetch("/api/calendar/calendars",{cache:"no-store"})]);const [statusResult,calendarResult]=await Promise.all([statusResponse.json(),calendarsResponse.json()]);if(!statusResponse.ok)throw new Error();const catalogState=calendarsResponse.ok?"online":statusResult.connected?"error":"unavailable";const calendars=calendarsResponse.ok?(calendarResult.calendars||[]):[];setCalendarStatus({state:"online",...statusResult,catalogState,catalogError:catalogState==="error"?(calendarResult.error||"Kalenderkatalog nicht erreichbar"):""});setLiveCalendars(calendars);setSelectedCalendars(calendars.filter((calendar:any)=>calendar.selected).slice(0,6).map((calendar:any)=>calendar.id))}catch{setCalendarStatus({state:"error",configured:false,connected:false,mode:"unavailable",catalogState:"error"});setLiveCalendars([]);setSelectedCalendars([])}},[]);
  useEffect(() => {
    void loadCalendarState();
    void loadIntegrationHealth();
    const recoverIntegrations = () => {
      void loadCalendarState();
      void loadIntegrationHealth();
    };
    window.addEventListener("agentic-os:runtime-online", recoverIntegrations);
    return () => window.removeEventListener("agentic-os:runtime-online", recoverIntegrations);
  }, [loadCalendarState,loadIntegrationHealth]);
  const beginCalendarConnect = async () => {
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      window.location.assign("/api/calendar/connect");
    } catch {
      note("Private Sitzung ist nicht erreichbar; OAuth wurde nicht geöffnet");
    }
  };
  const shareCalendarSession = async () => {
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      const response = await privateApiFetch("/api/calendar/share-local-session", { method: "POST" });
      if (!response.ok) throw new Error();
      setCalendarStatus((current: any) => ({ ...current, sharedWithDesktop: true }));
    } catch {
      note("Lokale Calendar-Übernahme nicht bestätigt; Status vor erneutem Versuch prüfen");
    }
  };
  const readWeek = async () => {
    if (!selectedCalendars.length) return note("Bitte mindestens einen Kalender auswählen");
    setCalendarRead({ state: "loading", events: [] });
    const query = new URLSearchParams();
    selectedCalendars.forEach((id) => query.append("calendar", id));
    try {
      const response = await privateApiFetch(`/api/calendar/events?${query}`, { cache: "no-store" });
      const result = await response.json();
      setCalendarRead(response.ok ? { state: "online", ...result } : { state: "error", events: [], error: result.error || "Lesen fehlgeschlagen" });
    } catch {
      setCalendarRead({ state: "error", events: [], error: "Begrenzter Kalenderabruf nicht erreichbar" });
    }
  };
  const selectedConnector=integrationHealth.connectors.find((connector:any)=>connector.id===selectedConnectorId);
  const connectionIcons:Record<string,any>={"google-calendar":I.CalendarDays,obsidian:I.BookOpen,"shared-store":I.Database,openai:I.Sparkles,"google-tasks":I.CheckSquare,"health-local":I.Activity,"finance-local":I.Landmark,tailscale:I.ShieldCheck};
  const healthStatusLabel:Record<string,string>={online:"Online",degraded:"Eingeschränkt",offline:"Offline",unconfigured:"Nicht konfiguriert"};
  const costClassLabel:Record<string,string>={Free:"Kostenfrei",Included:"Enthalten","Usage-based":"Nutzungsbasiert",Unknown:"Ungeklärt"};
  const connectorClassLabel:Record<string,string>={direct_api:"Direkte API",local_adapter:"Lokaler Adapter",local_database:"Lokale Datenbank",optional_paid_api:"Optionale Bezahl-API",new_oauth_scope:"Neue OAuth-Berechtigung",manual_local:"Manuell lokal",private_network:"Privates Netzwerk"};
  const formatHealthTime=(value:string|null)=>value?new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}).format(new Date(value)):"Noch nie verifiziert";
  return (
    <>
      <Intro
        eyebrow="INTEGRATION HEALTH CENTER"
        title="Jede Verbindung. Ehrlich sichtbar."
      >
        <p>
          Online bedeutet verifiziert. Alles andere bleibt klar als eingeschränkt,
          offline oder unkonfiguriert markiert.
        </p>
      </Intro>
      <Card className="calendarSafe">
        <div className="connectionHead">
          <span>
            <I.CalendarDays />
          </span>
          <div>
            <Tag>
              GOOGLE CALENDAR · {calendarStatus.state === "loading" ? "STATUS WIRD GEPRÜFT" : calendarStatus.state === "error" ? "STATUS NICHT ERREICHBAR" : calendarStatus.connectionCheck === "error" ? "TOKENPRÜFUNG NICHT ERREICHBAR" : calendarStatus.eventWriteReady ? "EVENTS LIVE · KONTROLLIERT" : calendarStatus.connected ? "READ-ONLY · NEUE FREIGABE NÖTIG" : calendarStatus.configured ? "OAUTH BEREIT" : "NICHT KONFIGURIERT"}
            </Tag>
            <h3>Wochenplanung sicher verbinden</h3>
          </div>
          <em>{calendarStatus.state === "loading" ? "Prüft" : calendarStatus.state === "error" ? "Offline" : calendarStatus.connectionCheck === "error" ? "Eingeschränkt" : calendarStatus.connected ? "Online" : calendarStatus.configured ? "Bereit" : "Unkonfiguriert"}</em>
        </div>
        {calendarStatus.state === "error" && <RetryNotice message="Google-Status und Kalenderkatalog sind gerade nicht erreichbar." onRetry={loadCalendarState} label="Kalenderstatus neu laden"/>}
        {calendarStatus.state === "online" && calendarStatus.connectionCheck === "error" && <RetryNotice message={calendarStatus.recentError || "Google-Tokenprüfung ist gerade nicht erreichbar. Eine neue Freigabe wird aus diesem unklaren Zustand nicht gestartet."} onRetry={loadCalendarState} label="Tokenstatus erneut prüfen"/>}
        {calendarStatus.state === "online" && !calendarStatus.configured && (
          <div className="setupBoundary">
            <I.Shield />
            <span>
              <b>Ein externer Schritt fehlt</b>
              Google-Cloud-Web-OAuth-Client mit Calendar API und Callback anlegen;
              Client-ID/Secret ausschließlich lokal in `.env.local` speichern.
            </span>
          </div>
        )}
        {calendarStatus.state === "online" && calendarStatus.connectionCheck !== "error" && calendarStatus.configured && !calendarStatus.eventWriteReady && (
          <button className="btn soft" onClick={beginCalendarConnect}>
            Lesen + kontrollierte Event-Writes freigeben <I.ExternalLink />
          </button>
        )}
        {calendarStatus.state === "online" && calendarStatus.eventWriteReady && !calendarStatus.sharedWithDesktop && (
          <button className="btn soft" onClick={shareCalendarSession}>
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
            {calendarStatus.state === "loading" || calendarStatus.catalogState === "loading" ? <p role="status">Kalenderkatalog wird geladen …</p> : calendarStatus.catalogState === "error" ? <RetryNotice message={calendarStatus.catalogError || "Kalenderkatalog ist gerade nicht erreichbar."} onRetry={loadCalendarState} label="Kalenderkatalog neu laden"/> : calendarStatus.catalogState === "unavailable" ? <p className="emptyInline">Der Kalenderkatalog wird erst nach einer verifizierten Verbindung gelesen.</p> : calendarStatus.catalogState === "online" && !liveCalendars.length ? <p className="emptyInline">Die verifizierte Kalenderliste ist leer. Es werden keine Ersatzkalender eingesetzt.</p> : null}
            <Btn soft onClick={calendarStatus.state === "online" && calendarStatus.catalogState === "online" && calendarStatus.connected && calendarRead.state !== "loading" ? readWeek : undefined}>
              Nächste 8 Tage lesen
            </Btn>
          </div>
          <div>
            <b>2 · Begrenzter Abruf</b>
            <p>
              {calendarRead.state === "online"
                ? `${calendarRead.events.length} Termine · ${calendarRead.label} · ${calendarRead.boundedDays} Tage · ${calendarRead.timezone}`
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
      <div className="integrationSummary"><span><I.RefreshCw/><b>Letzte Gesamtprüfung</b><small>{formatHealthTime(integrationHealth.checkedAt||null)}</small></span><span><I.ShieldCheck/><b>Schreibstatus</b><small>0 externe Writes durch Health Center</small></span><span><I.BadgeEuro/><b>Kostenaktivierung</b><small>Keine</small></span><Btn soft onClick={integrationHealth.state!=="loading"?loadIntegrationHealth:undefined}>{integrationHealth.state==="loading"?"Prüft …":"Health erneut prüfen"}</Btn></div>
      {integrationHealth.state==="error"&&<RetryNotice message={integrationHealth.error||"Integrationsstatus ist gerade nicht erreichbar."} onRetry={loadIntegrationHealth} label="Integrationsstatus neu laden"/>}
      <div className="connections healthConnections">
        {integrationHealth.connectors.map((connector:any)=>{const Icon=connectionIcons[connector.id]||I.Plug;return <Card className={selectedConnectorId===connector.id?"selected":""} key={connector.id}>
          <div className="row"><span className="connector"><Icon/></span><div className="connectionBadges"><i className={`badge ${connector.status}`}>{healthStatusLabel[connector.status]||"Nicht verifiziert"}</i><i className={`costBadge ${String(connector.costClass).toLowerCase().replace(/[^a-z]+/g,"-")}`}>{costClassLabel[connector.costClass]||"Ungeklärt"}</i></div></div>
          <h3>{connector.name}</h3><p>{connector.area}</p>
          <dl><dt>Letzter Erfolg</dt><dd>{formatHealthTime(connector.lastSuccessfulSync)}</dd><dt>Aktuelle Prüfung</dt><dd>{connector.currentAction}</dd><dt>Berechtigungen</dt><dd>{connector.permissionScope.join(" · ")}</dd></dl>
          {connector.recentError&&<p className="connectionError"><I.TriangleAlert/>{connector.recentError}</p>}
          <button className="connectionDetailsButton" aria-expanded={selectedConnectorId===connector.id} onClick={()=>setSelectedConnectorId(current=>current===connector.id?"":connector.id)}>Details & sichere Schritte<I.ChevronDown/></button>
        </Card>})}
      </div>
      {selectedConnector&&<Card className="connectionDetails"><div className="row"><div><Tag>VERBINDUNGSART · {connectorClassLabel[selectedConnector.classification]||"Ungeklärt"}</Tag><h3>{selectedConnector.name}</h3></div><i className={`badge ${selectedConnector.status}`}>{healthStatusLabel[selectedConnector.status]||"Nicht verifiziert"}</i></div><div className="connectionDetailGrid"><span><b>Datenschutz</b>{selectedConnector.privacy}</span><span><b>Sicherer Wiederverbindungsweg</b>{selectedConnector.reconnect}</span><span><b>Letzte Prüfung</b>{formatHealthTime(selectedConnector.checkedAt)}</span><span><b>Kostenklasse</b>{costClassLabel[selectedConnector.costClass]||"Ungeklärt"} · keine Aktivierung durch diese Ansicht</span></div><details><summary>Verifizierte Evidenz anzeigen</summary><pre>{JSON.stringify(selectedConnector.evidence,null,2)}</pre></details><small><I.Lock/>Keine Zugangsdaten, technischen Fremd-IDs oder persönlichen Inhalte werden hier angezeigt.</small></Card>}
    </>
  );
}
function Brain() {
  const [vault, setVault] = useState<any>({ status: "loading" });
  const [audit, setAudit] = useState<any>({ status: "loading", entries: [] });
  const [knowledgeQuery,setKnowledgeQuery]=useState("");
  const [writeFlow,setWriteFlow]=useState<any>({state:"loading",proposals:[]}),[writeMode,setWriteMode]=useState<"new_system_note"|"normalize_existing_note">("new_system_note"),[writeDraft,setWriteDraft]=useState<any>({title:"",body:"",noteType:"inbox",privacy:"private",relativePath:"",lifeArea:""}),[activeProposalId,setActiveProposalId]=useState(""),[approvalToken,setApprovalToken]=useState(""),[confirmation,setConfirmation]=useState(""),[writeBusy,setWriteBusy]=useState(false),[writeError,setWriteError]=useState("");
  const loadVault = useCallback(async () => {
    setVault({ status: "loading" });
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      const response = await privateApiFetch("/api/obsidian/status", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setVault(await response.json());
    } catch {
      setVault({ status: "degraded", error: "Lokaler Vault-Index nicht erreichbar" });
    }
  }, []);
  const loadAudit = useCallback(async () => {
    setAudit({ status: "loading", entries: [] });
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error();
      const response = await privateApiFetch("/api/state/audit", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setAudit({ status: "online", entries: result.entries || [] });
    } catch {
      setAudit({ status: "error", entries: [] });
    }
  }, []);
  const loadWriteFlow=useCallback(async()=>{setWriteFlow({state:"loading",proposals:[]});setActiveProposalId("");setApprovalToken("");setConfirmation("");try{const session=await privateApiFetch("/api/state/session",{method:"POST"});if(!session.ok)throw new Error();const response=await privateApiFetch("/api/obsidian/write-proposals",{cache:"no-store"}),result=await response.json();if(!response.ok)throw new Error(result.error);setWriteFlow({state:"online",...result});setActiveProposalId(result.proposals?.[0]?.id||"");setWriteError("")}catch(cause){setWriteFlow({state:"error",proposals:[]});setWriteError(cause instanceof Error?cause.message:"Vault-Vorschläge sind nicht erreichbar")}},[]);
  useEffect(() => {
    void loadVault();
    void loadAudit();
    void loadWriteFlow();
    const recoverKnowledge = () => {
      void loadVault();
      void loadAudit();
      void loadWriteFlow();
    };
    window.addEventListener("agentic-os:runtime-online", recoverKnowledge);
    return () => window.removeEventListener("agentic-os:runtime-online", recoverKnowledge);
  }, [loadAudit, loadVault, loadWriteFlow]);

  const connected = vault.status === "online";
  const normalizedQuery=knowledgeQuery.trim().toLocaleLowerCase("de-DE");
  const knowledgeResults=connected?(vault.notes||[]).filter((note:any)=>!normalizedQuery||`${note.title} ${note.relativePath} ${(note.frontmatterKeys||[]).join(" ")}`.toLocaleLowerCase("de-DE").includes(normalizedQuery)).sort((a:any,b:any)=>String(b.modifiedAt).localeCompare(String(a.modifiedAt))).slice(0,15):[];
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
    "vault_write.preview": "Vault-Diff vorgeschlagen",
    "vault_write.approve_preview": "Vault-Diff zur Apply-Grenze freigegeben",
  };
  const activeProposal=writeFlow.proposals.find((proposal:any)=>proposal.id===activeProposalId);
  const invalidateWriteFlow=(message:string)=>{setWriteFlow({state:"error",proposals:[]});setActiveProposalId("");setApprovalToken("");setConfirmation("");setWriteError(message)};
  const writeProposalRequest=async(method:"POST"|"PATCH",body:any)=>{if(writeFlow.state!=="online"||!connected)throw new Error("Private Vault-Vorschauquelle ist nicht schreibbereit");let response:Response;try{response=await privateApiFetch("/api/obsidian/write-proposals",{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)})}catch{invalidateWriteFlow("Private Vault-Vorschauquelle nicht erreichbar");throw new Error("Private Vault-Vorschauquelle nicht erreichbar")}let result:any;try{result=await response.json()}catch{invalidateWriteFlow("Ungültige Antwort der Vault-Vorschauquelle");throw new Error("Ungültige Antwort der Vault-Vorschauquelle")}if(!response.ok){if(privateSourceFailure(response.status))invalidateWriteFlow("Private Vault-Vorschauquelle nicht erreichbar");throw new Error(result.error||"Vault-Vorschauanfrage abgelehnt")}return result};
  const generateVaultProposal=async()=>{setWriteBusy(true);setWriteError("");setActiveProposalId("");setApprovalToken("");setConfirmation("");try{const result=await writeProposalRequest("POST",{...writeDraft,proposalType:writeMode,expectedNoteCount:vault.noteCount});await loadWriteFlow();setActiveProposalId(result.proposal.id);setApprovalToken(result.approvalToken)}catch(cause){setWriteError(cause instanceof Error?cause.message:"Diff-Vorschau konnte nicht erzeugt werden")}finally{setWriteBusy(false)}};
  const approveVaultPreview=async()=>{if(!activeProposal||confirmation!==activeProposal.approvalPhrase)return;setWriteBusy(true);setWriteError("");try{const result=await writeProposalRequest("PATCH",{action:"approve_preview",proposalId:activeProposal.id,approvalToken,confirmation});await loadWriteFlow();setActiveProposalId(result.proposal.id)}catch(cause){setApprovalToken("");setConfirmation("");setWriteError(cause instanceof Error?cause.message:"Vorschau-Freigabe fehlgeschlagen")}finally{setWriteBusy(false)}};
  const proposalInputValid=connected&&writeFlow.state==="online"&&(writeMode==="new_system_note"?String(writeDraft.title||"").trim().length>=2&&String(writeDraft.body||"").trim().length>=2:Boolean(writeDraft.relativePath));
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
        <Card className="knowledgeSearch">
          <div className="row"><div><Tag>METADATEN-SUCHE · READ-ONLY</Tag><h3>Vault-Wissen finden</h3></div><I.Search /></div>
          <label><span className="srOnly">Vault-Metadaten durchsuchen</span><input disabled={!connected} onChange={event=>setKnowledgeQuery(event.target.value)} placeholder={connected?"Titel, Pfad oder Frontmatter-Feld …":"Vault-Index nicht verfügbar"} type="search" value={knowledgeQuery}/></label>
          <small>{connected?`${knowledgeResults.length} von ${vault.noteCount} Notizen angezeigt · keine Volltextkörper gelesen`:`Suche bleibt leer, bis der private Index erreichbar ist.`}</small>
          <div className="knowledgeResults">{knowledgeResults.map((note:any)=><div key={note.relativePath}><I.FileText/><span><b>{note.title}</b><small>{note.relativePath}</small></span><em>{(note.links||[]).length} Links</em></div>)}{connected&&knowledgeResults.length===0&&<p>Keine passende Notizmetadaten gefunden.</p>}</div>
        </Card>
        <Card className="vaultWriteFlow">
          <div className="row"><div><Tag>CONTROLLED WRITE · PREVIEW ONLY</Tag><h3>Exakten Vault-Diff vorbereiten</h3></div><i className="badge unconfigured">APPLY GESPERRT</i></div>
          <p>Hier entsteht nur eine lokal verschlüsselte Vorschau. Kein Ordner und keine der {connected?vault.noteCount:"bestehenden"} Notizen werden verändert.</p>
          <div className="proposalType" role="group" aria-label="Vault-Vorschlagstyp"><button aria-pressed={writeMode==="new_system_note"} className={writeMode==="new_system_note"?"active":""} onClick={()=>{setWriteMode("new_system_note");setWriteError("")}}>Neue Systemnotiz</button><button aria-pressed={writeMode==="normalize_existing_note"} className={writeMode==="normalize_existing_note"?"active":""} onClick={()=>{setWriteMode("normalize_existing_note");setWriteError("")}}>Bestehende Notiz normalisieren</button></div>
          {writeMode==="new_system_note"?<div className="vaultProposalForm"><label>Titel<input maxLength={100} value={writeDraft.title||""} onChange={event=>setWriteDraft({...writeDraft,title:event.target.value})} placeholder="Titel der neuen Systemnotiz"/></label><label>Zielbereich<select value={writeDraft.noteType||"inbox"} onChange={event=>setWriteDraft({...writeDraft,noteType:event.target.value})}><option value="inbox">00 Agentic OS/Inbox</option><option value="system">00 Agentic OS/System</option></select></label><label className="wide">Inhalt<textarea maxLength={10000} value={writeDraft.body||""} onChange={event=>setWriteDraft({...writeDraft,body:event.target.value})} placeholder="Bewusst gewählter Markdown-Inhalt …"/></label><label>Datenschutz<select value={writeDraft.privacy||"private"} onChange={event=>setWriteDraft({...writeDraft,privacy:event.target.value})}><option value="private">Privat</option><option value="sensitive">Sensibel</option><option value="system">System</option></select></label></div>:<div className="vaultProposalForm"><label className="wide">Notiz aus aktuellem Index<select value={writeDraft.relativePath||""} onChange={event=>setWriteDraft({...writeDraft,relativePath:event.target.value})}><option value="">Notiz wählen</option>{(vault.notes||[]).map((note:any)=><option key={note.relativePath} value={note.relativePath}>{note.title} · {note.relativePath}</option>)}</select></label><label>Typ<select value={writeDraft.noteType||"research"} onChange={event=>setWriteDraft({...writeDraft,noteType:event.target.value})}>{["system","inbox","project","journal","person","research","reflection"].map(type=><option key={type} value={type}>{type}</option>)}</select></label><label>Lebensbereich<select value={writeDraft.lifeArea||""} onChange={event=>setWriteDraft({...writeDraft,lifeArea:event.target.value})}><option value="">Keiner</option><option value="faith">Glaube</option><option value="career">Karriere</option><option value="health">Gesundheit</option><option value="finance">Finanzen</option><option value="relations">Beziehungen</option><option value="projects">Projekte</option></select></label><label>Datenschutz<select value={writeDraft.privacy||"private"} onChange={event=>setWriteDraft({...writeDraft,privacy:event.target.value})}><option value="private">Privat</option><option value="sensitive">Sensibel</option><option value="system">System</option></select></label></div>}
          <div className="workflowGate"><I.DatabaseBackup/><span><b>Vor jedem späteren Apply</b>Zielpfad, SHA-256, Konfliktfreiheit, Backupmanifest und Restore-Plan werden erneut geprüft.</span></div>
          <Btn onClick={!writeBusy&&proposalInputValid?generateVaultProposal:undefined}>{writeBusy?"Prüft lokal …":"Exakte Diff-Vorschau erzeugen"}<I.FileDiff/></Btn>
          {writeFlow.state==="loading"&&<p role="status">Private Vorschauhistorie wird geladen …</p>}
          {writeFlow.state==="error"?<RetryNotice message={writeError||"Vault-Vorschauen sind nicht erreichbar."} onRetry={loadWriteFlow} label="Vorschauen neu laden"/>:writeError&&<p className="plannerError" role="alert"><I.TriangleAlert/>{writeError}</p>}
        </Card>
        <Card className="vaultProposalReview">
          <div className="row"><div><Tag>DIFF · KONFLIKT · RESTORE</Tag><h3>{activeProposal?activeProposal.targetPath:"Noch keine Vorschau"}</h3></div>{activeProposal&&<em className={`runStatus ${activeProposal.status}`}>{activeProposal.status}</em>}</div>
          {writeFlow.state==="loading"&&<p role="status">Diff-Stand wird geprüft …</p>}
          {!activeProposal&&writeFlow.state==="online"&&<div className="honestEmpty"><I.FileSearch/><span><b>Keine schreibende Aktion vorbereitet</b>Erzeuge bei Bedarf eine Vorschau. Der Vault bleibt unverändert.</span></div>}
          {activeProposal&&<><div className="vaultProposalFacts"><span><b>{activeProposal.conflict?"Konflikt":"Konfliktfrei"}</b>Zielzustand geprüft</span><span><b>{activeProposal.indexedNoteCount}</b>Notizen beim Vorschauzeitpunkt</span><span><b>0</b>Vault-Writes</span><span><b>{activeProposal.unchangedBodyGuaranteed?"Ja":"Neue Datei"}</b>Bestehender Body unverändert</span></div>{activeProposal.conflict&&<p className="plannerError"><I.TriangleAlert/>{activeProposal.conflictReason}</p>}<pre className="vaultExactDiff" aria-label="Exakte Markdown-Diff-Vorschau">{activeProposal.exactDiff}</pre><div className="vaultPlans"><span><I.DatabaseBackup/><b>Backupplan</b><small>{activeProposal.backupPlan.strategy}</small><small>{activeProposal.backupPlan.destination}</small></span><span><I.RotateCcw/><b>Restore-Plan</b><small>{activeProposal.restorePlan.strategy}</small><small>Nie automatisch</small></span></div><div className="approvalBoundary"><I.ShieldAlert/><span><b>Vorschau-Freigabe ist nicht Apply</b>Der echte Schreibpfad existiert noch nicht. Der kurzlebige Token bleibt nur in dieser Sitzung.</span></div>{activeProposal.status==="review_required"&&approvalToken?<><label>Exakte Phrase<input autoComplete="off" value={confirmation} onChange={event=>setConfirmation(event.target.value)} placeholder={activeProposal.approvalPhrase}/></label><Btn onClick={!writeBusy&&confirmation===activeProposal.approvalPhrase?approveVaultPreview:undefined}>Nur Diff zur Apply-Grenze freigeben</Btn></>:activeProposal.status==="review_required"?<p className="statusNote"><I.Clock/>Token nicht mehr in dieser Sitzung verfügbar · identische Vorschau neu erzeugen.</p>:null}<button disabled title="Vault-Schreiben benötigt später eine neue ausdrückliche Aktionsfreigabe">Apply in Obsidian · gesperrt</button></>}
          {writeFlow.proposals.length>0&&<div className="vaultProposalHistory"><b>Vorschauverlauf</b>{writeFlow.proposals.map((proposal:any)=><button className={proposal.id===activeProposalId?"active":""} key={proposal.id} onClick={()=>{setActiveProposalId(proposal.id);setApprovalToken("");setConfirmation("")}}><span>{proposal.proposalType==="new_system_note"?"Neue Systemnotiz":"Normalisierung"}<small>v{proposal.version} · {proposal.status}</small></span><I.ChevronRight/></button>)}</div>}
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
          {audit.status === "error" && <RetryNotice message="Audit ist gerade nicht erreichbar. Es werden keine Ersatzaktivitäten angezeigt." onRetry={loadAudit}/>}
          {audit.status === "online" && audit.entries.length === 0 && <p>Noch keine gemeinsamen Aktionen protokolliert.</p>}
          {audit.status === "online" && audit.entries.map((entry: any, index: number) => (
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
function Settings({ brand, save, theme, changeTheme, note, preferenceState, reloadPreferences }: any) {
  const [d, setD] = useState(brand);
  const [backupState, setBackupState] = useState<any>({ state: "loading", backups: [], store: null });
  const [selectedBackup, setSelectedBackup] = useState("");
  const [restorePreview, setRestorePreview] = useState<any>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [diagnosis,setDiagnosis]=useState<any>({state:"idle"});
  const [archiveState,setArchiveState]=useState<any>({state:"loading",records:[]});
  const [restoreArchiveArmed,setRestoreArchiveArmed]=useState("");
  const [archiveBusy,setArchiveBusy]=useState(false);
  useEffect(() => setD(brand), [brand]);
  const loadBackups = useCallback(async () => {
    setBackupState({ state: "loading", backups: [], store: null });
    setSelectedBackup(""); setRestorePreview(null);
    try {
      const session = await privateApiFetch("/api/state/session", { method: "POST" });
      if (!session.ok) throw new Error("Private Sitzung nicht erreichbar");
      const response = await privateApiFetch("/api/state/backups", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Backup-Status nicht verfügbar");
      setBackupState({ state: "online", ...result });
      setSelectedBackup(result.backups?.[0]?.fileName || "");
    } catch (error) {
      setBackupState({ state: "error", backups: [], store: null });
      note(error instanceof Error ? error.message : "Backup-Status nicht verfügbar");
    }
  }, [note]);
  const loadArchive=useCallback(async()=>{setArchiveState({state:"loading",records:[]});setRestoreArchiveArmed("");try{const session=await privateApiFetch("/api/state/session",{method:"POST"});if(!session.ok)throw new Error("Private Sitzung nicht erreichbar");const response=await privateApiFetch("/api/state/archive",{cache:"no-store"}),result=await response.json();if(!response.ok)throw new Error(result.error);setArchiveState({state:"online",records:result.records||[]})}catch(error){setArchiveState({state:"error",records:[],error:error instanceof Error?error.message:"Archiv nicht erreichbar"})}},[]);
  useEffect(() => {
    void loadBackups();
    void loadArchive();
    const recoverSettings = () => {
      setDiagnosis({ state: "idle" });
      void loadBackups();
      void loadArchive();
    };
    window.addEventListener("agentic-os:runtime-online", recoverSettings);
    return () => window.removeEventListener("agentic-os:runtime-online", recoverSettings);
  }, [loadArchive,loadBackups]);
  const invalidateBackupSource=()=>{setBackupState({state:"error",backups:[],store:null});setSelectedBackup("");setRestorePreview(null)};
  const invalidateArchiveSource=(message:string)=>{setArchiveState({state:"error",records:[],error:message});setRestoreArchiveArmed("")};
  const backupRequest=async(method:"POST"|"PATCH",body:any)=>{if(backupState.state!=="online")throw new Error("Privates Backup-Inventar ist nicht schreibbereit");let response:Response;try{response=await privateApiFetch("/api/state/backups",{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)})}catch{invalidateBackupSource();throw new Error("Backup-Ergebnis nicht bestätigt. Inventar vor erneutem Versuch prüfen.")}let result:any;try{result=await response.json()}catch{invalidateBackupSource();throw new Error("Ungültige Antwort der Backup-Quelle")}if(!response.ok){if(privateSourceFailure(response.status))invalidateBackupSource();throw new Error(result.error||"Backup-Anfrage abgelehnt")}return result};
  const createBackup = async () => {
    setBackupBusy(true);
    try {
      await backupRequest("POST", { action: "create_backup" });
      note("Lokales Backup geprüft und erstellt");
      await loadBackups();
    } catch (error) {
      note(error instanceof Error ? error.message : "Backup fehlgeschlagen");
    } finally { setBackupBusy(false); }
  };
  const inspectRestore = async () => {
    if (!selectedBackup) return;
    setBackupBusy(true); setRestorePreview(null);
    try {
      const result = await backupRequest("PATCH", { action: "preview_restore", fileName: selectedBackup });
      setRestorePreview(result);
      note("Restore nur geprüft · keine Daten ersetzt");
    } catch (error) {
      note(error instanceof Error ? error.message : "Restore-Vorschau fehlgeschlagen");
    } finally { setBackupBusy(false); }
  };
  const runRecoveryCheck=async()=>{setDiagnosis({state:"loading"});try{const session=await privateApiFetch("/api/state/session",{method:"POST"});if(!session.ok)throw new Error("Private Sitzung nicht erreichbar");const [storeResponse,healthResponse,backupResponse]=await Promise.all([privateApiFetch("/api/state/status",{cache:"no-store"}),privateApiFetch("/api/integrations/health",{cache:"no-store"}),privateApiFetch("/api/state/backups",{cache:"no-store"})]);const [storeResult,healthResult,backupResult]=await Promise.all([storeResponse.json(),healthResponse.json(),backupResponse.json()]);if(!storeResponse.ok||!healthResponse.ok||!backupResponse.ok)throw new Error("Mindestens eine private Diagnosequelle ist nicht erreichbar");const connectors=healthResult.connectors||[],online=connectors.filter((item:any)=>item.status==="online").length,degraded=connectors.filter((item:any)=>item.status==="degraded"||item.status==="offline").length;setDiagnosis({state:"ready",checkedAt:healthResult.checkedAt,storeOnline:Boolean(storeResult.online),schemaVersion:storeResult.schemaVersion,wal:Boolean(storeResult.wal),connectorCount:connectors.length,onlineConnectors:online,degradedConnectors:degraded,backupCount:backupResult.backups?.length||0,latestBackupAt:backupResult.backups?.[0]?.createdAt||null,externalWritesPerformed:false,restorePerformed:false})}catch(error){setDiagnosis({state:"error",error:error instanceof Error?error.message:"Lokale Diagnose fehlgeschlagen",externalWritesPerformed:false,restorePerformed:false})}};
  const restoreArchiveRecord=async(record:any)=>{const key=`${record.kind}:${record.id}:${record.version}`;if(archiveState.state!=="online"||archiveBusy||restoreArchiveArmed!==key)return;setArchiveBusy(true);try{let response:Response;try{response=await privateApiFetch("/api/state/archive",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({kind:record.kind,id:record.id,version:record.version})})}catch{const message="Wiederherstellungsergebnis nicht bestätigt. Archivstatus prüfen und nicht erneut bestätigen.";invalidateArchiveSource(message);note(message);return}let result:any;try{result=await response.json()}catch{const message="Wiederherstellungsergebnis nicht bestätigt. Archivstatus prüfen und nicht erneut bestätigen.";invalidateArchiveSource(message);note(message);return}if(!response.ok){setRestoreArchiveArmed("");if(privateSourceFailure(response.status)){const message=result.error||"Archivquelle ist nicht verifiziert erreichbar";invalidateArchiveSource(message);note(message);return}await loadArchive();note(result.error||"Datensatz konnte nicht wiederhergestellt werden");return}if(result.restored!==true){const message="Wiederherstellungsergebnis ist unvollständig. Archivstatus prüfen und nicht erneut bestätigen.";invalidateArchiveSource(message);note(message);return}setRestoreArchiveArmed("");await loadArchive();note("Datensatz aus dem lokalen Archiv wiederhergestellt")}finally{setArchiveBusy(false)}};
  const brandingValid = d.name.trim().length >= 2 && /^[A-ZÄÖÜ0-9]{1,3}$/i.test(d.short.trim()) && /^#[0-9a-f]{6}$/i.test(d.accent);
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
          {preferenceState === "loading" && <p role="status">Gemeinsame Darstellung wird geprüft …</p>}
          {preferenceState === "error" && <RetryNotice message="Theme und Branding sind gerade nicht verifiziert erreichbar." onRetry={reloadPreferences} label="Darstellung neu laden" />}
          <div className="themeChoices" role="group" aria-label="Farbschema">
            <button aria-pressed={theme === "dark"} disabled={preferenceState !== "online"} onClick={() => changeTheme("dark")}><I.Moon /> Dark</button>
            <button aria-pressed={theme === "light"} disabled={preferenceState !== "online"} onClick={() => changeTheme("light")}><I.Sun /> Light</button>
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
          <Btn onClick={brandingValid && preferenceState === "online" ? () => save(d) : undefined}>Branding gemeinsam speichern</Btn>
          <small className="settingsHint">{preferenceState === "online" ? "Gilt nach dem Speichern für Desktop und iPhone." : "Speichern bleibt bis zur verifizierten gemeinsamen Quelle gesperrt."}</small>
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
        <Card className="backupCard">
          <div className="row">
            <Tag>BACKUP · LOKAL</Tag>
            <span className={`badge ${backupState.state === "online" ? "online" : "offline"}`}>
              {backupState.state === "online" ? "Bereit" : backupState.state === "loading" ? "Prüft" : "Fehler"}
            </span>
          </div>
          <h3>Shared Store sichern</h3>
          <p>
            SQLite-Daten bleiben im privaten lokalen Ordner. Das Backup enthält keinen Schlüssel und wird nicht hochgeladen.
          </p>
          <dl className="settingsFacts">
            <dt>Engine</dt><dd>{backupState.store?.engine || "Nicht geprüft"}</dd>
            <dt>Schema</dt><dd>{backupState.store?.schemaVersion ? `v${backupState.store.schemaVersion}` : "—"}</dd>
            <dt>Backups</dt><dd>{backupState.state === "online" ? backupState.backups.length : backupState.state === "loading" ? "Wird geprüft" : "Nicht erreichbar"}</dd>
          </dl>
          <Btn onClick={!backupBusy && backupState.state === "online" ? createBackup : undefined}>
            <I.Archive /> {backupBusy ? "Prüfung läuft" : "Lokales Backup jetzt erstellen"}
          </Btn>
          {backupState.state==="error"&&<RetryNotice message="Backup-Inventar ist gerade nicht erreichbar." onRetry={loadBackups} label="Backup-Status neu laden"/>}
        </Card>
        <Card className="backupCard">
          <Tag>RESTORE · VORSCHAU</Tag>
          <h3>Vorher vergleichen, nie still ersetzen</h3>
          {backupState.state === "loading" ? <p role="status">Backup-Inventar wird geladen …</p> : backupState.state === "error" ? <p role="alert">Restore-Vorschau bleibt gesperrt, bis das private Inventar erneut geprüft ist.</p> : backupState.backups?.length ? (
            <>
              <label>
                Lokales Backup
                <select value={selectedBackup} onChange={(event) => { setSelectedBackup(event.target.value); setRestorePreview(null); }}>
                  {backupState.backups.map((backup: any) => (
                    <option key={backup.fileName} value={backup.fileName}>
                      {berlinDateTime.format(new Date(backup.createdAt))} · {Math.ceil(backup.bytes / 1024)} KB
                    </option>
                  ))}
                </select>
              </label>
              <Btn soft onClick={!backupBusy ? inspectRestore : undefined}>Integrität & Konflikte prüfen</Btn>
            </>
          ) : <p className="settingsEmpty">Noch kein lokales Backup vorhanden.</p>}
          {backupState.state === "online" && restorePreview && (
            <div className="restorePreview" role="status">
              <b><I.ShieldCheck /> Integrität {restorePreview.integrity}</b>
              <span>Schema v{restorePreview.schemaVersion} · {restorePreview.changedTables.length} Tabellen mit Abweichungen</span>
              <small>{restorePreview.conflictReviewRequired ? "Konfliktprüfung erforderlich" : "Zähler stimmen überein"}</small>
            </div>
          )}
          <button className="btn" disabled type="button">Restore bleibt bis zur exakten Freigabe gesperrt</button>
        </Card>
        <Card className="recoveryCard">
          <div className="row"><div><Tag>DIAGNOSE · NUR LESEN</Tag><h3>Wiederanlauf sicher prüfen</h3></div><i className={`badge ${diagnosis.state==="ready"?"online":diagnosis.state==="error"?"offline":"unconfigured"}`}>{diagnosis.state==="ready"?"Geprüft":diagnosis.state==="loading"?"Prüft":diagnosis.state==="error"?"Fehler":"Bereit"}</i></div>
          <p>Prüft nur den privaten Datenkern, Connector-Health und vorhandene lokale Backups. Kein Restore, kein Reconnect und kein externer Write.</p>
          <Btn soft onClick={diagnosis.state!=="loading"?runRecoveryCheck:undefined}><I.Stethoscope/>{diagnosis.state==="loading"?"Diagnose läuft …":"Lokale Diagnose ausführen"}</Btn>
          {diagnosis.state==="ready"&&<div className="recoveryEvidence" role="status"><span><I.Database/><b>Shared Store</b><small>{diagnosis.storeOnline?`Online · Schema v${diagnosis.schemaVersion} · ${diagnosis.wal?"WAL aktiv":"WAL nicht belegt"}`:"Offline"}</small></span><span><I.PlugZap/><b>Verbindungen</b><small>{diagnosis.onlineConnectors}/{diagnosis.connectorCount} online · {diagnosis.degradedConnectors} eingeschränkt</small></span><span><I.Archive/><b>Backups</b><small>{diagnosis.backupCount?`${diagnosis.backupCount} lokal · zuletzt ${berlinDateTime.format(new Date(diagnosis.latestBackupAt))}`:"Noch kein lokales Backup"}</small></span></div>}
          {diagnosis.state==="error"&&<p className="plannerError" role="alert"><I.TriangleAlert/>{diagnosis.error}</p>}
          <ol className="recoverySteps"><li>Agentic OS über den Desktop-Shortcut neu starten.</li><li>Diese Diagnose erneut ausführen und Verbindungen im Health Center prüfen.</li><li>Nur bei Datenproblem ein Backup vergleichen; Restore bleibt bis zur exakten Freigabe gesperrt.</li></ol>
          <a className="btn soft" href="#integrations">Zum Health Center</a>
        </Card>
        <Card className="archiveCard">
          <div className="row"><div><Tag>DATENSATZ-ARCHIV · LOKAL</Tag><h3>Archiviert statt gelöscht</h3></div><i className={`badge ${archiveState.state==="online"?"online":"offline"}`}>{archiveState.state==="online"?`${archiveState.records.length} Einträge`:archiveState.state==="loading"?"Lädt":"Fehler"}</i></div>
          <p>Hier lassen sich lokale Datensätze einzeln in ihren vorherigen Status zurückholen. Das ist kein Datenbank-Restore und löst keine externe Aktion aus.</p>
          {archiveState.state==="online"&&archiveState.records.length===0&&<div className="honestEmpty"><I.ArchiveRestore/><span><b>Lokales Archiv ist leer</b>Es werden keine gelöschten oder Beispiel-Datensätze gezeigt.</span></div>}
          {archiveState.state==="error"&&<RetryNotice message={archiveState.error} onRetry={loadArchive} label="Archiv neu laden"/>}
          <div className="archiveRecords">{archiveState.state === "online" && archiveState.records.map((record:any)=>{const restoreKey=`${record.kind}:${record.id}:${record.version}`,armed=restoreArchiveArmed===restoreKey;return <div key={`${record.kind}:${record.id}`}><I.Archive/><span><b>{record.title}</b><small>{({projects:"Projekt",tasks:"Aufgabe",habits:"Habit",journal_metadata:"Journal",inbox_items:"Inbox",agents:"Agent",skills:"Skill",area_records:"Lebensbereich"} as Record<string,string>)[record.kind]||record.kind} · archiviert {berlinDateTime.format(new Date(record.archivedAt))}</small></span><div className="archiveRestoreActions">{!armed?<button disabled={archiveBusy} onClick={()=>setRestoreArchiveArmed(restoreKey)} type="button">Wiederherstellen …</button>:<><button className="dangerQuiet" disabled={archiveBusy} onClick={()=>restoreArchiveRecord(record)} type="button">{archiveBusy?"Status wird bestätigt …":"Wiederherstellung bestätigen"}</button><button disabled={archiveBusy} onClick={()=>setRestoreArchiveArmed("")} type="button">Abbrechen</button></>}</div></div>})}</div>
          <small className="settingsHint"><I.ShieldCheck/>Versionskonflikte werden abgewiesen; verknüpfte archivierte Projekte oder Agenten müssen zuerst selbst wiederhergestellt werden.</small>
        </Card>
        <Card>
          <Tag>DATENGRENZEN</Tag>
          <h3>Drei klare Quellen</h3>
          <div className="sourceBoundaries">
            <span><I.Database /><b>SQLite</b><small>Veränderliche operative Daten</small></span>
            <span><I.Network /><b>Obsidian</b><small>Dauerhaftes Markdown-Wissen</small></span>
            <span><I.CalendarRange /><b>Google</b><small>Externe Kalenderereignisse</small></span>
          </div>
          <p className="settingsHint">Restore, Vault-Apply und Kalenderwrites bleiben getrennte, exakte Freigaben.</p>
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
