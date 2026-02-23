# my-speech-google-chrome

Chrome extension playground for a **speech loop**:

**STT (speech-to-text) → AI (Prompt API / Gemini Nano) → TTS (chrome.tts)**

This project is intentionally small: it’s a minimal vertical slice that records microphone audio in a Side Panel, transcribes it on-device (Prompt API multimodal audio), generates a short response, and speaks it back.

## Quickstart (recommended)

### Requirements

- **Google Chrome** (not Brave). In Brave, `LanguageModel` may not be exposed to extensions.
- A recent Chrome version (this repo sets `minimum_chrome_version: 138`).
- **Node.js** (for the small build script that injects your local Origin Trial token).

### 1) Build the extension bundle (`dist/`)

```bash
npm run build
```

This generates a local `dist/` folder that Chrome can load.

### 2) Load the extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `./dist`
4. Click the extension’s toolbar icon to open the Side Panel

### 3) Enable microphone permission

When you click **Start recording**, Chrome will ask for microphone permission for the extension origin (`chrome-extension://...`). Set it to **Allow**.

## Enabling multimodal audio (Origin Trial token)

Text-only Prompt API can work without extra setup, but **multimodal audio input** commonly requires an Origin Trial token.

Symptom:

- `await LanguageModel.availability()` returns `"available"`, but
- `LanguageModel.create({ expectedInputs: [{ type: "audio" }] })` fails with **`NotSupportedError`**.

### Why tokens are not committed

Origin Trial tokens are tied to **your local extension ID** (`chrome-extension://<id>`), so committing a token would not work for other people cloning this repo.

### Steps

1. Load the extension once (from `./dist`) so Chrome assigns it an **ID**.
   - Find it at: `chrome://extensions` → Speech Loop → **Details** → **ID**
2. Register for the Origin Trial in the Chrome Origin Trials dashboard:
   - https://developer.chrome.com/origintrials/
   - Choose feature **Prompt API** (UI name). The generated token will typically list the underlying feature as `AIPromptAPIMultimodalInput`.
   - Origin must be exactly:
     ```
     chrome-extension://<your-extension-id>
     ```
3. Create a local file `manifest.local.json` (it is gitignored):
   ```json
   {
     "trial_tokens": ["<your token>"]
   }
   ```
4. Rebuild + reload:
   ```bash
   npm run build
   ```
   Then reload the extension in `chrome://extensions`.

## Troubleshooting

### `LanguageModel is not available in this context`

- You’re likely not running in Google Chrome, or Prompt API isn’t exposed/enabled in your build.

### `Prompt API availability: downloadable` / `downloading`

Chrome is still downloading the on-device model.

- Keep Chrome open and wait.
- Check: `chrome://components` → **Optimization Guide On Device Model** should become **Up-to-date**.

### Audio session fails with `NotSupportedError` (but text-only works)

That’s the Origin Trial token issue (see section above). Make sure:

- the token’s origin matches your exact `chrome-extension://<id>`
- you rebuilt (`npm run build`) after updating `manifest.local.json`
- you loaded **`./dist`** (not the repo root)

### Microphone permission gets dismissed

- Click the mic permission chip/icon in Chrome’s toolbar area and set the extension origin to **Allow**.
- Also check macOS Privacy & Security → Microphone.

## Repo structure

- `manifest.json` (committed): token-free base manifest with `"trial_tokens": []`
- `manifest.local.json` (not committed): your local Origin Trial token
- `scripts/build-extension.mjs`: merges base manifest + local token and copies files into `dist/`
- `dist/` (not committed): load this folder as the unpacked extension

## References

- `IDEA.md` (planning notes)
- Chrome sample that inspired the multimodal audio flow:
  - `~/dev-external/chrome-extensions-samples/functional-samples/ai.gemini-on-device-audio-scribe`
