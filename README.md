# my-speech-google-chrome

Chrome extension playground for a **speech loop**:

`STT (speech-to-text) → AI (Prompt API) → TTS (chrome.tts)`

## What’s implemented

- Side panel UI with a **Record** button
- Mic audio recording via `getUserMedia` + `MediaRecorder`
- On-device **transcription** using Chrome Extensions **Prompt API** (Gemini Nano) multimodal audio input
- Response generation using Prompt API text prompting
- Speaking the response via `chrome.tts`

## Load the extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this repo directory (`my-speech-google-chrome`)
4. Click the extension icon to open the side panel

## Notes / requirements

- This uses Chrome’s **built-in AI** Prompt API (Gemini Nano). Availability depends on the browser.
  - In **Brave**, `LanguageModel` may not be exposed at all.
- If you see `Prompt API availability: downloadable`, Chrome has not downloaded the on-device model yet.
  - Keep Chrome open and watch for any download/permission prompt in the browser UI.
  - Check Chrome Settings for “AI” / “Built-in AI” / “Gemini Nano” download (some builds expose this at `chrome://settings/ai`).
  - Optionally check `chrome://components` for an on-device model component and update it.
- The upstream samples in `chrome-extensions-samples` include `trial_tokens` (Origin Trial) and sometimes a `key` in `manifest.json` for **multimodal input** demos.
  - For **audio input** specifically, the sample `ai.gemini-on-device-audio-scribe` uses an Origin Trial token for feature `AIPromptAPIMultimodalInput`.
  - In this repo, `manifest.json` contains `"trial_tokens": []` as a placeholder.

### Enabling multimodal audio input (Origin Trial)

If `LanguageModel.availability()` is `available` and text prompts work, but `LanguageModel.create({ expectedInputs: [{ type: "audio" }] })` fails with `NotSupportedError`, you likely need an Origin Trial token.

Steps:

1. Find your extension id: `chrome://extensions` → Speech Loop → Details → **ID**
2. Register for the Origin Trial feature **AIPromptAPIMultimodalInput**
3. Use origin: `chrome-extension://<your-extension-id>`
4. Put the generated token into `manifest.json` (this repo does **not** commit a token):
   ```json
   {
     "trial_tokens": ["<your token>"]
   }
   ```
5. Reload the extension

(Origin Trial tokens expire; if it stops working later, regenerate the token.)

- For a production extension you must provide your own token and remove sample keys.

## References

- `IDEA.md` (collected notes)
- `~/dev-external/chrome-extensions-samples/functional-samples/ai.gemini-on-device-audio-scribe`
