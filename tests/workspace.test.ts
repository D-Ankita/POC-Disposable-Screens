import assert from "node:assert/strict";
import test from "node:test";
import { compileDemo, fixtures, sanitizeSpec } from "../src/workspace.ts";

test("intent maps to a supported fixture", () => {
  assert.equal(compileDemo("Support tickets overdue").dataset, "support");
  assert.equal(compileDemo("Quarterly sales revenue").dataset, "revenue");
  assert.equal(compileDemo("Customers at churn risk").dataset, "customers");
});

test("composition responds to requested UI shape", () => {
  assert.deepEqual(compileDemo("Show only the chart").widgets.map(x => x.kind), ["chart", "insights"]);
  assert.equal(compileDemo("Compare revenue by region").widgets[1].kind, "table");
});

test("untrusted specs cannot render arbitrary components", () => {
  const spec = sanitizeSpec({
    title: "<img src=x onerror=alert(1)>",
    dataset: "nonexistent",
    widgets: [{kind:"script"}, {kind:"table"}, {kind:"table"}, {kind:"actions"}]
  }, "customer accounts");
  assert.equal(spec.dataset, "customers");
  assert.deepEqual(spec.widgets.map(x => x.kind), ["table", "actions"]);
  assert.equal(spec.title.includes("<img"), true); // React escapes text; no innerHTML use.
});

test("all fixtures have compatible chart and table data", () => {
  for (const fixture of Object.values(fixtures)) {
    assert.equal(fixture.chart.labels.length, fixture.chart.values.length);
    assert.ok(fixture.table.rows.every(row => row.length === fixture.table.columns.length));
  }
});
