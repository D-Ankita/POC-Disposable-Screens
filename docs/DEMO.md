# Demo and validation

This repository includes an automated browser capture of the **real** React interface.

## GitHub Actions (on the `Test` branch)

1. Open the repository's **Actions** tab.
2. Choose **Validate and record Disposable Screens**.
3. The workflow runs automatically whenever `Test` changes (or manually via **Run workflow**).
4. After a successful run, open its artifact named **disposable-screens-linkedin-demo**.
5. Download the ZIP and extract `disposable-screens-demo.mp4`, plus five screenshots.

The run installs dependencies, executes unit tests, performs a TypeScript + Vite production build, launches the app, and uses Chromium/Playwright to exercise three different intents and JSON inspection.

The video and screenshots are **not AI-generated imagery**; they capture the app as it runs. All numbers shown inside the app are intentionally fabricated demo fixtures. Video exports are suitable for a short social media prototype demonstration; trim/crop for your preferred LinkedIn format if necessary.

## Local workflow

```bash
npm install
npx playwright install chromium
npm test
npm run build
npm run dev
# Separate terminal:
npm run record:demo
# Requires ffmpeg:
ffmpeg -y -i demo/disposable-screens-demo.webm -c:v libx264 -pix_fmt yuv420p -crf 22 -movflags +faststart demo/disposable-screens-demo.mp4
```

No API key is needed for the automated recording. It intentionally uses local demo mode, so it is reproducible and free from model/API charges.

**What the demo proves:** composing approved, reusable React components into several task-specific workspaces, checking the selected structured schema, and discarding temporary screens.

**What it does not prove:** real-time data access, production model reliability, actual customer churn predictions, or validated user value.
