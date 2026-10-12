/**
 * Browser-verified demo. Captures the actual running React app, not mockups.
 * Run npm run dev in another terminal before executing this script.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.DEMO_BASE_URL || "http://127.0.0.1:5173";
const folder = path.resolve("demo");
const browser = await chromium.launch({ headless: true });
await mkdir(folder, { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: path.join(folder, ".raw-video"), size: { width: 1440, height: 900 } }
});
const page = await context.newPage();
const video = page.video();
const shot = async (name) => page.screenshot({ path: path.join(folder, name), fullPage: true });

async function displayPreview() {
  await page.locator(".preview-heading").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
}

async function compose(prompt, heading, shotName) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
  await page.getByRole("textbox", { name: "Describe your workspace" }).fill(prompt);
  await page.waitForTimeout(850);
  await page.getByRole("button", { name: "Generate screen" }).click();
  await page.getByRole("heading", { name: heading, exact: true }).waitFor({ timeout: 12000 });
  await displayPreview();
  await shot(shotName);
}

try {
  await page.goto(base, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator(".workspace-page").waitFor();
  await page.waitForTimeout(1200);
  await shot("00-initial-studio.png");

  await compose("Show me customers most likely to churn this month", "Customer risk overview", "01-customer-risk.png");
  await compose("Compare revenue by region this quarter", "Revenue performance", "02-revenue-analysis.png");
  await compose("Which support tickets need attention?", "Support command center", "03-support-operations.png");

  await page.getByRole("button", { name: "Inspect JSON" }).click();
  await page.locator(".json-panel pre").waitFor();
  await page.waitForTimeout(1700);
  await shot("04-structured-schema.png");

  const schema = await page.locator(".json-panel pre").innerText();
  const parsed = JSON.parse(schema);
  if (parsed.dataset !== "support") throw new Error("Unexpected support schema");
  if (!parsed.widgets.every(item => ["metrics", "chart", "table", "insights", "actions"].includes(item.kind))) {
    throw new Error("Unapproved widget in schema");
  }
  await writeFile(path.join(folder, "verified-schema.json"), JSON.stringify(parsed, null, 2) + "\n");
  console.log("Browser smoke checks passed: all three intents and JSON inspection.");
} finally {
  await context.close();
  if (video) await video.saveAs(path.join(folder, "disposable-screens-demo.webm"));
  await browser.close();
}
