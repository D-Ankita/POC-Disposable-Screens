/**
 * Real-browser demo of reusable components assembled as temporary workspaces.
 * Run npm run dev separately; no AI key is required for reproducible demo mode.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.DEMO_BASE_URL || "http://127.0.0.1:5173";
const folder = path.resolve("demo");
await mkdir(folder, { recursive: true });
const diagnostics = [];
let browser;
let context;
let page;
let video;
let failed = false;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  diagnostics.push(line);
  console.log(line);
}
const shot = async (name) => page.screenshot({ path: path.join(folder, name), fullPage: true });

async function compose(prompt, heading, shotName) {
  log(`Composing intent: ${prompt}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("textbox", { name: "Describe your workspace" }).fill(prompt);
  await page.getByRole("button", { name: "Generate screen" }).click();
  await page.getByRole("heading", { name: heading, exact: true }).waitFor({ timeout: 20000 });
  await page.locator(".preview-heading").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1600);
  await shot(shotName);
  log(`Verified generated screen: ${heading}`);
}

try {
  log(`Opening browser: ${base}`);
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: path.join(folder, ".raw-video"), size: { width: 1440, height: 900 } }
  });
  page = await context.newPage();
  video = page.video();
  page.on("pageerror", error => log(`PAGE ERROR: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") log(`CONSOLE ERROR: ${message.text()}`);
  });
  page.on("requestfailed", request => log(`REQUEST FAILED: ${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`));
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator(".workspace-page").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1000);
  await shot("00-initial-studio.png");

  await compose("Show me customers most likely to churn this month", "Customer risk overview", "01-customer-risk.png");
  await compose("Compare revenue by region this quarter", "Revenue performance", "02-revenue-analysis.png");
  await compose("Which support tickets need attention?", "Support command center", "03-support-operations.png");

  log("Opening schema inspector");
  await page.getByRole("button", { name: "Inspect JSON" }).click();
  await page.locator(".json-panel pre").waitFor({ timeout: 15000 });
  await page.waitForTimeout(1400);
  await shot("04-structured-schema.png");
  const schema = await page.locator(".json-panel pre").innerText();
  const parsed = JSON.parse(schema);
  if (parsed.dataset !== "support") throw new Error("Schema inspection returned an unexpected dataset.");
  if (!Array.isArray(parsed.widgets) || !parsed.widgets.every(item => ["metrics", "chart", "table", "insights", "actions"].includes(item.kind))) {
    throw new Error("Schema contains unsupported widget kinds.");
  }
  await writeFile(path.join(folder, "verified-schema.json"), JSON.stringify(parsed, null, 2) + "\n");
  log("PASS: all three user intents rendered and schema was verified.");
} catch (error) {
  failed = true;
  log(`FAILED: ${error instanceof Error ? error.stack || error.message : String(error)}`);
  if (page) {
    try { await shot("error-at-failure.png"); } catch (shotError) { log(`Diagnostic screenshot failed: ${shotError}`); }
  }
} finally {
  if (context) {
    try { await context.close(); } catch (error) { log(`Context close failed: ${error}`); failed = true; }
  }
  if (video) {
    try {
      await video.saveAs(path.join(folder, "disposable-screens-demo.webm"));
      log("Raw WebM recording saved.");
    } catch (error) { log(`Video export failed: ${error}`); failed = true; }
  }
  if (browser) await browser.close();
  await writeFile(path.join(folder, "browser-errors.log"), diagnostics.join("\n") + "\n");
}
if (failed) process.exitCode = 1;
