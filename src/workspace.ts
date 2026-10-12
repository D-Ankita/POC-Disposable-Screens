/**
 * All data here is explicitly fabricated sample data for the UI experiment.
 * The model can choose a schema but it cannot supply metrics or execute JSX.
 */
export type DatasetKey = "customers" | "revenue" | "support";
export type WidgetKind = "metrics" | "chart" | "table" | "insights" | "actions";

export interface WidgetSpec {
  id: string;
  kind: WidgetKind;
}
export interface WorkspaceSpec {
  title: string;
  subtitle: string;
  dataset: DatasetKey;
  widgets: WidgetSpec[];
}
export interface Metric {
  label: string;
  value: string;
  change: string;
  direction: "up" | "down" | "neutral";
}
export interface Fixture {
  badge: string;
  metrics: Metric[];
  chart: { title: string; description: string; labels: string[]; values: number[] };
  table: { title: string; columns: string[]; rows: string[][] };
  insights: string[];
  actions: string[];
}

export const examples = [
  "Show me customers most likely to churn",
  "Compare revenue by region this quarter",
  "Which support tickets need attention?"
] as const;

export const fixtures: Record<DatasetKey, Fixture> = {
  customers: {
    badge: "Customer success",
    metrics: [
      { label: "Accounts at risk", value: "32", change: "+6 this month", direction: "up" },
      { label: "Healthy accounts", value: "186", change: "+12 this month", direction: "up" },
      { label: "Average health score", value: "72/100", change: "-3 points", direction: "down" }
    ],
    chart: { title: "Retention signal", description: "Weekly account health, sample index", labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"], values: [78, 75, 82, 69, 73, 65, 72] },
    table: { title: "Accounts to review", columns: ["Account", "Plan", "Health", "Owner"], rows: [
      ["Northstar Labs", "Enterprise", "Critical", "Maya"],
      ["Acme Studio", "Growth", "At risk", "Jordan"],
      ["Orbit Finance", "Enterprise", "At risk", "Alex"],
      ["Sparrow Health", "Business", "Watch", "Taylor"]
    ] },
    insights: ["Usage has dipped across several high-value accounts.", "Prioritize accounts with low health scores and recent engagement drops."],
    actions: ["Review high-risk accounts", "Schedule customer check-ins", "Export follow-up list"]
  },
  revenue: {
    badge: "Revenue intelligence",
    metrics: [
      { label: "Quarterly revenue", value: "$428.6k", change: "+14.8% QoQ", direction: "up" },
      { label: "Active customers", value: "1,248", change: "+8.2% QoQ", direction: "up" },
      { label: "Avg. deal size", value: "$3,420", change: "+4.1% QoQ", direction: "up" }
    ],
    chart: { title: "Revenue trajectory", description: "Weekly revenue, sample index", labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"], values: [32, 41, 38, 53, 48, 64, 73] },
    table: { title: "Regional breakdown", columns: ["Region", "Revenue", "Growth", "Share"], rows: [
      ["North America", "$182.4k", "+18.2%", "43%"],
      ["Europe", "$121.8k", "+12.5%", "28%"],
      ["Asia Pacific", "$91.2k", "+16.4%", "21%"],
      ["Other", "$33.2k", "+3.6%", "8%"]
    ] },
    insights: ["North America contributes the largest share of sample revenue.", "Asia Pacific is growing faster than the overall average in this fixture."],
    actions: ["Compare regional performance", "Review the growth segments", "Export the breakdown"]
  },
  support: {
    badge: "Support operations",
    metrics: [
      { label: "Open tickets", value: "84", change: "-12 this week", direction: "down" },
      { label: "Needs attention", value: "19", change: "+4 today", direction: "up" },
      { label: "First response", value: "1.8h", change: "-0.4h this week", direction: "down" }
    ],
    chart: { title: "Queue pressure", description: "Open tickets by day, sample index", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [42, 57, 45, 69, 62, 46, 51] },
    table: { title: "Priority queue", columns: ["Ticket", "Priority", "Status", "Assignee"], rows: [
      ["#2481 · Login issue", "Urgent", "Waiting", "Avery"],
      ["#2480 · API timeout", "High", "In progress", "Maya"],
      ["#2473 · Data export", "High", "Waiting", "Jordan"],
      ["#2469 · Billing query", "Medium", "Open", "Sam"]
    ] },
    insights: ["The urgent sample queue has an unresolved login issue.", "Review waiting tickets before assigning more work."],
    actions: ["Triage urgent tickets", "Reassign waiting cases", "Review response times"]
  }
};

const allKinds: WidgetKind[] = ["metrics", "chart", "table", "insights", "actions"];
const datasetKeys: DatasetKey[] = ["customers", "revenue", "support"];

export function datasetForIntent(intent: string): DatasetKey {
  if (/support|ticket|issue|queue|response|helpdesk/i.test(intent)) return "support";
  if (/revenue|sales|region|growth|deal|quarter|mrr/i.test(intent)) return "revenue";
  return "customers";
}

export function compileDemo(intent: string): WorkspaceSpec {
  const dataset = datasetForIntent(intent);
  const defaults: Record<DatasetKey, string> = {
    customers: "Customer risk overview",
    revenue: "Revenue performance",
    support: "Support command center"
  };
  let order = [...allKinds];
  if (/table|list|compare|breakdown/i.test(intent)) order = ["metrics", "table", "chart", "insights", "actions"];
  if (/chart|trend|graph|visual/i.test(intent)) order = ["metrics", "chart", "insights", "table", "actions"];
  if (/only (the |a )?(table|list)/i.test(intent)) order = ["table", "actions"];
  if (/only (the |a )?(chart|graph)/i.test(intent)) order = ["chart", "insights"];
  if (/just (the |a )?(metrics|kpis)/i.test(intent)) order = ["metrics", "insights"];
  return {
    title: defaults[dataset],
    subtitle: "Composed for your task from a fixed component catalog.",
    dataset,
    widgets: order.map((kind, index) => ({ id: `widget-${index + 1}`, kind }))
  };
}

/** A strict allowlist prevents the model from injecting arbitrary markup or data. */
export function sanitizeSpec(value: unknown, intent: string): WorkspaceSpec {
  const fallback = compileDemo(intent);
  if (!value || typeof value !== "object") return fallback;
  const obj = value as Record<string, unknown>;
  const dataset: DatasetKey = typeof obj.dataset === "string" && datasetKeys.includes(obj.dataset as DatasetKey)
    ? obj.dataset as DatasetKey : fallback.dataset;
  const widgets: WidgetKind[] = [];
  if (Array.isArray(obj.widgets)) {
    for (const entry of obj.widgets.slice(0, 12)) {
      if (entry && typeof entry === "object") {
        const kind = (entry as Record<string, unknown>).kind;
        if (typeof kind === "string" && allKinds.includes(kind as WidgetKind) && !widgets.includes(kind as WidgetKind)) {
          widgets.push(kind as WidgetKind);
        }
      }
    }
  }
  const cleanTitle = (s: unknown, fallbackValue: string, max: number) =>
    typeof s === "string" && s.trim() ? s.trim().slice(0, max) : fallbackValue;
  return {
    title: cleanTitle(obj.title, fallback.title, 64),
    subtitle: cleanTitle(obj.subtitle, fallback.subtitle, 140),
    dataset,
    widgets: (widgets.length ? widgets : fallback.widgets.map(w => w.kind))
      .map((kind, index) => ({ id: `widget-${index + 1}`, kind }))
  };
}
