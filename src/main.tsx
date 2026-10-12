import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Braces, Check,
  ChevronRight, CircleHelp, Clock3, Code2, Copy, Database, Layers3,
  LayoutDashboard, MousePointer2, Plus, RotateCcw, Send, ShieldCheck,
  Sparkles, Trash2, WandSparkles, X, Zap
} from "lucide-react";
import {
  compileDemo, examples, fixtures, type Fixture, type WidgetKind,
  type WorkspaceSpec
} from "./workspace";
import "./styles.css";

type Mode = "demo" | "live";
interface SavedScreen {
  id: string;
  intent: string;
  spec: WorkspaceSpec;
  mode: Mode;
  createdAt: number;
}
type WidgetProps = { fixture: Fixture; onAction: (message: string) => void };

function MetricsWidget({ fixture }: WidgetProps) {
  return <section className="metrics-grid" aria-label="Key metrics">
    {fixture.metrics.map((item, i) => <div className="metric-card" key={item.label}>
      <div className="metric-top"><span>{item.label}</span><span className="metric-index">0{i + 1}</span></div>
      <div className="metric-value">{item.value}</div>
      <div className={`metric-change ${item.direction === "down" ? "change-down" : ""}`}>
        {item.direction === "down" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14}/>}
        {item.change}<span className="metric-period">vs. previous period</span>
      </div>
    </div>)}
  </section>;
}

function ChartWidget({ fixture }: WidgetProps) {
  const { chart } = fixture;
  const w = 660, h = 230, px = 26, py = 25;
  const max = Math.max(...chart.values) + 12;
  const min = Math.min(...chart.values) - 12;
  const points = chart.values.map((v, i) => ({
    x: px + (i * (w - 2 * px)) / Math.max(chart.values.length - 1, 1),
    y: h - py - ((v - min) / (max - min)) * (h - py * 2)
  }));
  const line = points.map(p => `${p.x},${p.y}`).join(" ");
  const area = `M ${points[0].x} ${h - py} L ${points.map(p => `${p.x} ${p.y}`).join(" L ")} L ${points.at(-1)!.x} ${h - py} Z`;
  const id = fixture.badge.replace(/[^a-z]/gi, "-").toLowerCase();
  return <section className="widget-card chart-card">
    <div className="widget-card-head">
      <div><span className="eyebrow">TREND ANALYSIS</span><h3>{chart.title}</h3><p>{chart.description}</p></div>
      <span className="widget-live"><span/> Sample</span>
    </div>
    <div className="chart-shell">
      <svg viewBox={`0 0 ${w} ${h}`} className="trend-chart" role="img" aria-label={chart.title + " sample line chart"}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8574fa" stopOpacity=".32"/><stop offset="100%" stopColor="#8574fa" stopOpacity="0"/></linearGradient></defs>
        {[0, 1, 2, 3].map(i => <line key={i} x1={px} x2={w-px} y1={py + i * (h - 2*py)/3} y2={py + i * (h - 2*py)/3} stroke="#e9eaf2" strokeDasharray="5 7" />)}
        <path d={area} fill={`url(#${id})`} />
        <polyline points={line} fill="none" stroke="#7968e9" strokeWidth="3.7" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r={i === points.length-1 ? 5.5 : 3} fill="#fff" stroke="#7968e9" strokeWidth="2.8" />)}
      </svg>
      <div className="chart-labels">{chart.labels.map((label,i)=><span key={i}>{label}</span>)}</div>
    </div>
  </section>;
}

function TableWidget({ fixture }: WidgetProps) {
  return <section className="widget-card table-card">
    <div className="widget-card-head">
      <div><span className="eyebrow">STRUCTURED DATA</span><h3>{fixture.table.title}</h3><p>Curated from the sample dataset</p></div>
      <span className="row-pill">{fixture.table.rows.length} records</span>
    </div>
    <div className="table-scroll"><table className="data-table">
      <thead><tr>{fixture.table.columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
      <tbody>{fixture.table.rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>
        {j === 0 ? <span className="primary-cell"><span className="avatar">{value.charAt(0).toUpperCase()}</span>{value}</span> :
          /critical|urgent|at risk|high|waiting/i.test(value) ? <span className="status-chip status-warn">{value}</span> :
          /watch|medium|open/i.test(value) ? <span className="status-chip status-neutral">{value}</span> : value}
      </td>)}</tr>)}</tbody>
    </table></div>
  </section>;
}

function InsightsWidget({ fixture }: WidgetProps) {
  return <section className="widget-card small-card">
    <div className="widget-card-head compact"><div><span className="eyebrow">SIGNALS</span><h3>What stands out</h3></div><span className="mini-orb"><Sparkles size={17}/></span></div>
    <div className="insight-list">{fixture.insights.map((text,i)=><div className="insight" key={i}><span className="insight-dot"/><p>{text}</p></div>)}</div>
  </section>;
}

function ActionsWidget({ fixture, onAction }: WidgetProps) {
  return <section className="widget-card small-card">
    <div className="widget-card-head compact"><div><span className="eyebrow">NEXT STEPS</span><h3>Suggested actions</h3></div><span className="mini-orb lilac"><Zap size={17}/></span></div>
    <div className="actions-list">{fixture.actions.map((action, i)=><button key={action} onClick={()=>onAction(action)} className="action-row">
      <span className="action-number">0{i+1}</span><span>{action}</span><ArrowUpRight size={17}/>
    </button>)}</div>
  </section>;
}

// The component registry is intentionally closed: schema describes layout, never code.
const componentRegistry: Record<WidgetKind, React.ComponentType<WidgetProps>> = {
  metrics: MetricsWidget, chart: ChartWidget, table: TableWidget,
  insights: InsightsWidget, actions: ActionsWidget
};

function WorkspaceView({ screen, onAction }: { screen: SavedScreen; onAction: WidgetProps["onAction"] }) {
  const { spec } = screen;
  const fixture = fixtures[spec.dataset];
  return <div className="workspace-page" key={screen.id}>
    <div className="workspace-header">
      <div className="workspace-breadcrumb"><LayoutDashboard size={15}/> WORKSPACE <ChevronRight size={14}/> <span>GENERATED VIEW</span></div>
      <div className="workspace-data-badge"><Database size={13}/> SYNTHETIC SAMPLE DATA</div>
    </div>
    <div className="workspace-intro">
      <div><span className="domain-label"><span className="domain-dot"/>{fixture.badge}</span><h2>{spec.title}</h2><p>{spec.subtitle}</p></div>
      <div className="workspace-date"><Clock3 size={14}/> Just generated</div>
    </div>
    <div className="widget-grid">
      {spec.widgets.map(widget => {
        const Renderer = componentRegistry[widget.kind];
        return <div className={`widget-slot kind-${widget.kind}`} key={widget.id}><Renderer fixture={fixture} onAction={onAction}/></div>;
      })}
    </div>
    <div className="workspace-footnote"><ShieldCheck size={15}/> Layout is generated from a fixed component catalog. Values are illustrative, not live business data.</div>
  </div>;
}

function App() {
  const [intent, setIntent] = useState<string>("");
  const [screens, setScreens] = useState<SavedScreen[]>([{
    id:"welcome", intent: examples[0], spec:compileDemo(examples[0]), mode:"demo", createdAt: Date.now()
  }]);
  const [activeId, setActiveId] = useState<string | null>("welcome");
  const [serverMode, setServerMode] = useState<Mode>("demo");
  const [loading, setLoading] = useState(false);
  const [inspect, setInspect] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const active = screens.find(s => s.id === activeId);
  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(v => {
      if (v.mode === "live") setServerMode("live");
    }).catch(() => {});
  }, []);

  async function generate(nextIntent = intent) {
    const trimmed = nextIntent.trim();
    if (!trimmed || loading) return;
    setLoading(true); setError(""); setInspect(false);
    try {
      const result = await fetch("/api/generate", {
        method:"POST", headers: { "Content-Type":"application/json" },
        body:JSON.stringify({ intent: trimmed })
      });
      const data = await result.json() as { spec?: WorkspaceSpec; mode?: Mode; error?: string };
      if (!result.ok || !data.spec) throw new Error(data.error || "Could not generate a workspace.");
      const id = `screen-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      setScreens(previous => [{ id, intent:trimmed, spec:data.spec!, mode:data.mode === "live" ? "live" : "demo", createdAt:Date.now() }, ...previous]);
      setActiveId(id);
      setIntent("");
      setToast("A new temporary workspace was composed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  function discard(id: string) {
    const remaining = screens.filter(screen => screen.id !== id);
    setScreens(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id ?? null);
    setInspect(false);
    setToast("Workspace discarded. Components are still reusable.");
  }

  async function copyJson() {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(active.spec,null,2));
      setToast("Schema copied to clipboard.");
    } catch { setToast("Copy unavailable in this browser."); }
  }
  function handleAction(action: string) { setToast(`Preview only: "${action}" does not modify data.`); }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Layers3 size={22} strokeWidth={2.5}/></div>
        <div><strong>ephemeral<span className="brand-period">.</span></strong><small>AN INTERFACE EXPERIMENT</small></div>
      </div>
      <div className="nav-caption">STUDIO</div>
      <div className="nav-selected"><LayoutDashboard size={17}/> Screen composer <span>01</span></div>
      <div className="sidebar-divider"/>
      <div className="sidebar-section-title"><span>YOUR SCREENS</span><span className="count-bubble">{screens.length}</span></div>
      <div className="screen-list">
        {screens.map((screen, index) => <div className={`screen-list-item ${screen.id===activeId ? "is-active" : ""}`} key={screen.id}>
          <button className="screen-select" onClick={()=>{setActiveId(screen.id);setInspect(false)}} aria-label={`Open ${screen.spec.title}`}>
            <span className="screen-small-icon"><Layers3 size={14}/></span>
            <span className="screen-name"><strong>{screen.spec.title}</strong><small>{index===0 && screen.id==="welcome" ? "Example screen" : "Temporary workspace"}</small></span>
          </button>
          <button className="screen-delete" onClick={()=>discard(screen.id)} title={`Discard ${screen.spec.title}`} aria-label={`Discard ${screen.spec.title}`}><X size={15}/></button>
        </div>)}
        {screens.length === 0 && <div className="history-empty">No saved screens.<br/>Create one from a prompt.</div>}
      </div>
      <button className="sidebar-new" onClick={() => {document.getElementById("intent-input")?.focus(); setError("");}}>
        <Plus size={16}/> New workspace
      </button>
      <div className="sidebar-bottom">
        <div className="sidebar-detail"><div className="side-detail-icon"><Braces size={19}/></div><div><strong>Not another chatbot.</strong><p>A different way to interact with software.</p></div></div>
        <div className="sidebar-project"><span className="dot-online"/><span>PROOF OF CONCEPT</span><span>v0.1</span></div>
      </div>
    </aside>

    <main className="main-panel">
      <header className="topbar"><div className="topbar-path"><span>EXPERIMENTS</span><ChevronRight size={14}/> DISPOSABLE SCREENS</div>
        <div className="topbar-right"><span className="experimental-tag"><span/> EXPERIMENTAL</span><a href="https://github.com/D-Ankita/POC-Disposable-Screens/tree/Test" target="_blank" rel="noreferrer" className="github-link"><Code2 size={17}/> View source <ArrowUpRight size={13}/></a></div>
      </header>
      <div className="page-content">
        <div className="hero">
          <div className="hero-eyebrow"><span className="sparkle-symbol">✦</span> THE FUTURE OF INTERFACES ISN'T FIXED</div>
          <h1>Software, shaped<br/><span>around your intent.</span></h1>
          <p>What if screens were made for the task, then disappeared? Explore a tiny working prototype of intent-driven UI composition.</p>
        </div>
        <section className="composer-card" aria-label="Prompt composer">
          <div className="composer-header"><div className="composer-label"><WandSparkles size={17}/> DESCRIBE YOUR WORKSPACE</div>
            <span className={`mode-pill ${serverMode === "live" ? "live-pill" : ""}`}><span className="mode-dot"/>{serverMode === "live" ? "AI model connected" : "Local demo mode"}</span>
          </div>
          <div className="prompt-box">
            <textarea id="intent-input" aria-label="Describe your workspace" value={intent} maxLength={260}
              onChange={e=>setIntent(e.target.value)}
              onKeyDown={e=>{if ((e.metaKey || e.ctrlKey) && e.key==="Enter") {e.preventDefault(); void generate();}}}
              placeholder="e.g. Show me customers most likely to churn this month..." rows={2}/>
            <button className="generate-button" onClick={()=>void generate()} disabled={!intent.trim() || loading}>
              {loading ? <RotateCcw size={18} className="rotating"/> : <Send size={18}/>}
              <span>{loading ? "Composing..." : "Generate screen"}</span>
            </button>
          </div>
          <div className="composer-footer"><span>TRY AN EXAMPLE</span><div className="example-pills">
            {examples.map((example,i)=><button key={example} onClick={()=>setIntent(example)}><span>{String(i+1).padStart(2,"0")}</span>{example}<ArrowUpRight size={13}/></button>)}
          </div></div>
          {error && <div className="form-error" role="alert"><CircleHelp size={16}/>{error}</div>}
        </section>

        <div className="preview-heading"><div className="preview-heading-left"><div className="preview-title-icon"><MousePointer2 size={19}/></div><div><span className="eyebrow">THE RESULT</span><h2>Generated workspace <span className="live-indicator"/></h2></div></div>
          {active && <div className="preview-controls">
            <button className={inspect ? "control-button active-control" : "control-button"} onClick={()=>setInspect(!inspect)}>
              {inspect ? <LayoutDashboard size={16}/> : <Braces size={16}/>} {inspect ? "Preview" : "Inspect JSON"}
            </button>
            <button className="control-button" title="Regenerate this workspace" onClick={()=>void generate(active.intent)} disabled={loading}><RotateCcw size={16}/> Regenerate</button>
            <button className="control-button danger-control" title="Discard this workspace" onClick={()=>discard(active.id)}><Trash2 size={16}/></button>
          </div>}
        </div>
        <div className="preview-outer">
          <div className="browser-toolbar"><div className="browser-dots"><i/><i/><i/></div><div className="browser-address"><ShieldCheck size={13}/> workspace / {active?.spec.dataset ?? "empty"} / {active?.id === "welcome" ? "example" : "generated"}</div><span className="browser-caption">LIVE PREVIEW</span></div>
          {active ? inspect ? <div className="json-panel">
            <div className="json-panel-head"><div><Braces size={18}/><strong>Generated UI schema</strong><span>Allowlisted components only</span></div><button onClick={()=>void copyJson()}><Copy size={15}/> Copy JSON</button></div>
            <pre>{JSON.stringify(active.spec, null, 2)}</pre>
            <div className="schema-notice"><ShieldCheck size={17}/> The schema selects layout and approved components. It does not supply arbitrary executable code or business figures.</div>
          </div> : <WorkspaceView screen={active} onAction={handleAction}/> :
          <div className="empty-preview"><div className="empty-preview-icon"><Layers3 size={31}/></div><h2>Nothing here. By design.</h2><p>Discarded screens don't leave clutter behind. Create a new one whenever you need it.</p><button onClick={()=>{setIntent(examples[0]);document.getElementById("intent-input")?.focus()}}>Start with an example <ArrowRight size={16}/></button></div>}
        </div>
        <div className="postscript"><span><Layers3 size={17}/> Reusable components</span><ArrowRight size={17}/><span><Sparkles size={17}/> Composed on demand</span><ArrowRight size={17}/><span><Trash2 size={17}/> Disposable workspaces</span></div>
        <footer className="main-footer"><span>Built to explore an idea, not to replace thoughtful product design.</span><span><Database size={14}/> SAMPLE DATA ONLY</span></footer>
      </div>
    </main>
    {toast && <div className="toast" role="status"><div className="toast-check"><Check size={15}/></div><span>{toast}</span><button onClick={()=>setToast("")} aria-label="Close notification"><X size={17}/></button></div>}
  </div>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
