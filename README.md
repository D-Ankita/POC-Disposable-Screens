# Disposable Screens

**Reusable components. Disposable screens.** A hands-on proof of concept exploring whether software can assemble the right interface for a task instead of requiring users to navigate fixed dashboards.

![Status](https://img.shields.io/badge/status-proof_of_concept-8d7cf1) ![Stack](https://img.shields.io/badge/stack-React_%2B_TypeScript-646cff)

> A small engineering experiment, not a production analytics app. All displayed business figures and records are fabricated fixtures.

## What it does

Type a request such as:

- `Show me customers most likely to churn`
- `Compare revenue by region this quarter`
- `Which support tickets need attention?`
- `Show only the chart for revenue growth`

The composer returns a **structured workspace schema**. A closed React component registry renders that schema into a task-specific screen with metrics, trends, tables, insights, and suggested actions. Create multiple workspaces, switch between them, inspect/copy the underlying JSON, regenerate one, or discard it without deleting the reusable components.

The interface initially shows an example workspace; generate a new one to observe the composition process.

## Run it locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The frontend starts on port 5173 and the API starts on port 8787. By default this runs in **local demo mode** using a transparent rule-based intent compiler. It works without accounts or API keys.

### Optional: model-driven composition

To have a real model choose the dataset and widget order:

```bash
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local, then restart npm run dev
```

The **Node server** sends only the request text to the model; credentials stay server-side. The UI displays "AI model connected" when a server key is configured. Model output is **validated against an allowlist** of five widget kinds, and all numbers/textual records still come from local fixture datasets.

An LLM is not needed to render components. It is only one possible **layout planner**. The demo compiler is a baseline that makes it possible to compare behavior without confusing template selection with model inference.

## How it works

```text
User intent
    |
    +--> Local demo planner (no API key)
    |        OR
    +--> Optional server-side model planner
              |
       JSON workspace schema
              |
       Strict schema validation
              |
       Fixed React widget registry
              |
       Temporary UI workspace
              |
         Inspect / discard
```

### Important boundaries

1. **Schemas, not generated code.** The plan uses `dataset` and `widgets[].kind`; arbitrary JSX, HTML, event handlers, or tool invocations are not allowed.
2. **Fixture-backed.** The app never invents real business data. The three datasets (customer success, revenue, support) are synthetic and clearly labelled.
3. **No permanent storage.** Workspaces live in React state for the current tab session. Refresh clears them.
4. **Actions are illustrative.** Suggested-action buttons explicitly show a preview-only message. No customer data is modified.
5. **No framework lock-in for the idea.** React is the renderer used in this POC, not a requirement of the underlying pattern.

## Architecture

- `src/workspace.ts`: dataset types, synthetic fixture data, rule-based planner, schema sanitization.
- `src/main.tsx`: UI composer, closed widget registry, dynamic renderer, workspace lifecycle, JSON inspector.
- `src/styles.css`: responsive design with a dark builder and light generated workspace.
- `server/index.ts`: tiny Node HTTP API and optional OpenAI Chat Completions planner.
- `tests/workspace.test.ts`: checks fixture integrity, prompt handling, and schema validation.

Run tests and build checks:

```bash
npm test
npm run build
```

## Questions this POC raises

- When does a temporary interface beat a familiar, fixed one?
- How much freedom should a model have to compose the UI?
- How do you preserve accessibility, data permissions, consistency, and user control?
- Should generated screens become shareable artifacts, or remain ephemeral?

**Designed as a talking point for AI-native product engineering and frontend architecture.**

## Next steps (not implemented)

Production data connectors with access controls, persisted layouts, stronger typed model responses, accessibility testing, user feedback/evaluation, and one-click deployment. These are deliberately outside the first proof of concept.
