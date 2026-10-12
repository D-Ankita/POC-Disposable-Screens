import { createServer } from "node:http";
import { config } from "dotenv";
import { compileDemo, sanitizeSpec, type WorkspaceSpec } from "../src/workspace.ts";

config({ path: ".env.local" });
config();

const port = Number(process.env.PORT || 8787);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function reply(res: import("node:http").ServerResponse, code: number, data: object) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

async function generateLive(intent: string): Promise<WorkspaceSpec> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: [
            "You are a UI layout planner, NOT a data generator. Output a JSON object only.",
            "Choose dataset from: customers, revenue, support.",
            "Return keys: title (short), subtitle (short), dataset, widgets.",
            "widgets must be an array of objects with only the key kind.",
            "Allowed kind values: metrics, chart, table, insights, actions.",
            "Use 3 to 5 distinct widgets in an order appropriate to the user's intent.",
            "Do not invent numbers, customer details, code, HTML, URLs, or actions.",
            "The app supplies all fixture data using a fixed, allowlisted component registry."
          ].join(" ") },
          { role: "user", content: intent }
        ]
      })
    });
    if (!response.ok) throw new Error(`Model API returned HTTP ${response.status}`);
    const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Model returned no schema.");
    return sanitizeSpec(JSON.parse(content), intent);
  } finally { clearTimeout(timer); }
}

createServer(async (req, res) => {
  if (req.url === "/api/status" && req.method === "GET") {
    return reply(res, 200, { mode: apiKey ? "live" : "demo", model: apiKey ? model : null });
  }
  if (req.url !== "/api/generate" || req.method !== "POST") {
    return reply(res, 404, { error: "Not found" });
  }
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = Buffer.from(chunk);
      size += buffer.length;
      if (size > 8192) return reply(res, 413, { error: "Request too large." });
      chunks.push(buffer);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { intent?: unknown };
    if (typeof body.intent !== "string" || !body.intent.trim() || body.intent.length > 260) {
      return reply(res, 400, { error: "Enter a prompt of up to 260 characters." });
    }
    const spec = apiKey ? await generateLive(body.intent) : compileDemo(body.intent);
    return reply(res, 200, { spec, mode: apiKey ? "live" : "demo" });
  } catch (error) {
    console.error("Generate error:", error);
    return reply(res, 502, { error: "Could not generate a workspace. Try again or use local demo mode." });
  }
}).listen(port, () => {
  console.log(`Disposable Screens API on http://localhost:${port} (${apiKey ? "live" : "demo"} mode)`);
});
