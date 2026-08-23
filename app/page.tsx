"use client";
import { useEffect, useMemo, useState } from "react";
import * as I from "lucide-react";
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
const store = {
  get: (k: string, d: any) => {
    if (typeof window === "undefined") return d;
    try {
      return JSON.parse(localStorage.getItem("ns:" + k) || "null") ?? d;
    } catch {
      return d;
    }
  },
  set: (k: string, v: any) =>
    localStorage.setItem("ns:" + k, JSON.stringify(v)),
};
export default function App() {
  const [v, setV] = useState<View>("home"),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState(""),
    [tasks, setTasks] = useState<any[]>([]),
    [journal, setJournal] = useState(""),
    [mood, setMood] = useState("ruhig"),
    [brand, setBrand] = useState({
      name: "Agentic OS",
      short: "AOS",
      accent: "#6f8d78",
    });
  useEffect(() => {
    setTasks(
      store.get("tasks", [
        { id: 1, t: "Wochenplan bestätigen", area: "Projekte", done: false },
        { id: 2, t: "Qurʾān: 4 Seiten lesen", area: "Glaube", done: true },
        { id: 3, t: "Mama anrufen", area: "Beziehungen", done: false },
      ]),
    );
    setJournal(store.get("journal", ""));
    setBrand(
      store.get("brand", {
        name: "Agentic OS",
        short: "AOS",
        accent: "#6f8d78",
      }),
    );
  }, []);
  const saveTasks = (x: any[]) => {
    setTasks(x);
    store.set("tasks", x);
  };
  const note = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2400);
  };
  const title = nav.find((n) => n[0] === v)?.[1] || brand.name;
  return (
    <div className="os">
      <aside className={menu ? "open" : ""}>
        <div className="logo">
          <b style={{ background: brand.accent }}>{brand.short.slice(0, 3)}</b>
          <span>
            {brand.name}
            <small>life operating system</small>
          </span>
          <button onClick={() => setMenu(false)}>
            <I.X />
          </button>
        </div>
        <nav>
          {nav.map(([id, n, Icon]) => (
            <button
              className={v === id ? "active" : ""}
              onClick={() => {
                setV(id);
                setMenu(false);
              }}
              key={id}
            >
              <Icon />
              {n}
              {id === "inbox" && <em>4</em>}
            </button>
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
          <button className="hamb" onClick={() => setMenu(true)}>
            <I.Menu />
          </button>
          <div>
            <small>SONNTAG · 23. AUGUST</small>
            <h1>{title}</h1>
          </div>
          <button className="search">
            <I.Search />
            Suchen
          </button>
          <span className="avatar">EK</span>
        </header>
        <section className="content">
          {v === "home" && <Home go={setV} tasks={tasks} />}{" "}
          {v === "areas" && <Areas go={setV} />} {v === "faith" && <Faith />}
          {v === "career" && <Career />}
          {v === "finance" && <Finance />}
          {v === "health" && <Health />}
          {v === "relations" && <Relations />}
          {v === "projects" && <Projects />}
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
      {menu && <div className="shade" onClick={() => setMenu(false)} />}{" "}
      {toast && (
        <div className="toast">
          <I.CheckCircle2 />
          {toast}
        </div>
      )}
      <MobileNav v={v} go={setV} />
    </div>
  );
}
const Tag = ({ children }: any) => <span className="tag">{children}</span>;
const Card = ({ children, className = "" }: any) => (
  <div className={"card " + className}>{children}</div>
);
const Btn = ({ children, onClick, soft = false }: any) => (
  <button onClick={onClick} className={soft ? "btn soft" : "btn"}>
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
function Home({ go, tasks }: any) {
  return (
    <>
      <Intro eyebrow="DEIN SYSTEM AUF EINEN BLICK" title="Guten Abend, Eren.">
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
            ["Obsidian", "offline"],
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
          <button className="link">
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
              <button className={"person p" + i} key={x[1]}>
                <i>{x[0]}</i>
                <span>{x[1]}</span>
              </button>
            ))}
          </div>
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
function Projects() {
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
          <Btn>
            <I.Plus />
            Projekt
          </Btn>
        }
      />
      <div className="projectTools">
        <button>Board</button>
        <button>Liste</button>
        <button>Timeline</button>
        <span />
        <button>
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
              <button>
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
            <button>Wofür bin ich dankbar?</button>
            <button>Was darf ich loslassen?</button>
            <button>Was nehme ich mit?</button>
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
            <button className="history" key={x}>
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
  const [model, setModel] = useState("gpt-5.4");
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
                onChange={(e) => setModel(e.target.value)}
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
  const [q, setQ] = useState("");
  const list = skills.filter((x) =>
    x.join(" ").toLowerCase().includes(q.toLowerCase()),
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
          <button key={x}>{x}</button>
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
    [msg, setMsg] = useState("");
  return (
    <>
      <Intro
        eyebrow="OFFICIAL OPENAI API · MOCK"
        title="Chats, die zu deiner Arbeit gehören."
      >
        <p>
          ChatGPT Pro ist kein API-Schlüssel. Modelle bleiben unbestätigt, bis
          ein eigener Server-Key sicher konfiguriert wurde.
        </p>
      </Intro>
      <div className="chatlayout">
        <Card className="conversations">
          <div className="row">
            <Tag>PROJEKT-CHATS</Tag>
            <button>
              <I.Plus />
            </button>
          </div>
          {[
            ["Wochenplanung KW 35", "Agentic OS"],
            ["Angebot schärfen", "Selbstständigkeit"],
            ["Training & Erholung", "Health Baseline"],
            ["Tagesreflexion", "Glaube"],
          ].map((x, i) => (
            <button className={i === 0 ? "active" : ""} key={x[0]}>
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
              <b>Wochenplanung KW 35</b>
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
          <Tag>PROVIDER-STATUS</Tag>
          <div className="provider">
            <i className="unconfigured" />
            <span>
              <b>OpenAI</b>
              <small>Unkonfiguriert</small>
            </span>
          </div>
          <p>
            Serverseitige Responses-API-Grenze vorbereitet. Modellzugriff ist
            nicht verifiziert.
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
function Inbox({ note }: any) {
  const [type, setType] = useState("Idee"),
    [txt, setTxt] = useState("");
  return (
    <>
      <Intro eyebrow="ALLES DARF HIER BEGINNEN" title="Universelle Inbox." />
      <Card className="captureAll">
        <div className="capturetypes">
          {["Idee", "Aufgabe", "Notiz", "Link", "Datei"].map((x) => (
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
            onClick={() => {
              if (txt) {
                setTxt("");
                note(`${type} lokal erfasst`);
              }
            }}
          >
            Erfassen <I.ArrowRight />
          </Btn>
        </div>
      </Card>
      <div className="inboxlist">
        {[
          ["Angebotsidee konkretisieren", "Idee", "Karriere"],
          ["Meal-Prep vereinfachen", "Aufgabe", "Gesundheit"],
          ["Artikel zu Fokusarbeit", "Link", "Inbox"],
          ["Gesprächsnotiz", "Notiz", "Beziehungen"],
        ].map((x) => (
          <Card key={x[0]}>
            <i />
            <span>
              <b>{x[0]}</b>
              <small>
                {x[1]} · {x[2]}
              </small>
            </span>
            <button>
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
    [proposed, setProposed] = useState(false);
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
            <Tag>GOOGLE CALENDAR · TESTADAPTER</Tag>
            <h3>Wochenplanung sicher verbinden</h3>
          </div>
          <em>Unkonfiguriert</em>
        </div>
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
                ? "2 Vorschläge · 0 Writes"
                : "Keine Änderung vorbereitet"}
            </p>
            <Btn
              onClick={() =>
                note("Mock-Freigabe geprüft · keine externen Writes")
              }
            >
              Explizit freigeben
            </Btn>
          </div>
        </div>
        <small>
          <I.ShieldCheck />
          Mock: kann Google weder lesen noch schreiben.
        </small>
      </Card>
      <div className="connections">
        {[
          ["Google Tasks", "Aufgaben", "unconfigured", "Keine Berechtigung"],
          ["Obsidian", "Wissen", "offline", "Read-only Vorschau"],
          ["OpenAI", "Modelle & Chats", "unconfigured", "Kein API-Key"],
          ["Health", "Training", "offline", "Keine Datenquelle"],
          ["Finance", "Konten", "unconfigured", "Read-only only"],
        ].map((x, i) => (
          <Card key={x[0]}>
            <div className="row">
              <span className="connector">
                {
                  [
                    <I.CheckSquare />,
                    <I.BookOpen />,
                    <I.Sparkles />,
                    <I.Activity />,
                    <I.Landmark />,
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
              <dd>Nie</dd>
              <dt>Aktivität</dt>
              <dd>Keine externen Aktionen</dd>
            </dl>
            <button>
              Details <I.ChevronRight />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
function Brain() {
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
            <span>24 Knoten · Mock</span>
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
          <Tag>VAULT-IMPORT</Tag>
          <h3>Read-only zuerst.</h3>
          <p>
            Agentic OS inventarisiert Markdown und Links, bevor ein
            anwendungseigener Index entsteht. Dein Vault bleibt unverändert.
          </p>
          <Btn soft>Ordner-Vorschau wählen</Btn>
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
        <button
          className={v === id ? "active" : ""}
          onClick={() => go(id)}
          key={id}
        >
          <Icon />
          <span>{n}</span>
        </button>
      ))}
    </div>
  );
}
