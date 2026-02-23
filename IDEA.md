# IDEA: STT → AI → TTS loop as a Chrome Extension (on-device)

## Instruction (verbatim)

- **[Prompt API](https://developer.chrome.com/docs/extensions/ai/prompt-api)** with multimodal audio input (Gemini Nano) for on-device speech-to-text transcription

## Goal

Re-use the conceptual flow from `../my-speech-google` (standalone app) and implement the same **STT → AI → TTS** loop as a **Chrome Extension**, ideally **on-device** where possible (Gemini Nano Prompt API for STT/transcription; TTS via Chrome `chrome.tts` or Web Speech).

## Collected local references (evidence)

### 1) Prompt API multimodal audio STT (Gemini Nano) — “Audio-Scribe” sample

Source: `~/dev-external/chrome-extensions-samples/functional-samples/ai.gemini-on-device-audio-scribe`

Key takeaways:
- Captures *audio blobs* on arbitrary pages by overriding `URL.createObjectURL` in the **MAIN world** content script:
  - `override-createobject-url.js`: posts `{ type: 'audio-scribe', objectUrl }` via `window.postMessage()`.
  - `bridge.js`: forwards those `window.postMessage` events to extension via `chrome.runtime.sendMessage()`.
- Side panel transcribes by fetching the blob URL and prompting Gemini Nano with an **audio expected input**:
  - `sidepanel.js`:
    - `await LanguageModel.availability()` (must be `'available'`)
    - `await LanguageModel.create({ expectedInputs: [{ type: 'audio' }] })`
    - `session.promptStreaming([...])` with content:
      - `{ type: 'text', value: 'transcribe this audio' }`
      - `{ type: 'audio', value: content /* Blob */ }`
- Manifest patterns:
  - `manifest.json`: `side_panel`, `permissions: ["sidePanel"]`, content scripts:
    - one with `world: "MAIN"` + `run_at: "document_start"` to override `URL.createObjectURL`
  - includes `trial_tokens` + `key` (origin-trial / sample scaffolding).

### 2) Prompt API multimodal image usage pattern — “Alt Texter” sample

Source: `~/dev-external/chrome-extensions-samples/functional-samples/ai.gemini-on-device-alt-texter`

Key takeaways:
- `LanguageModel.create({ expectedInputs: [{ type: 'image' }], temperature: 0.0, topK: 1.0 })`
- For images, sample uses `createImageBitmap(blob)` before passing `{ type: 'image', value: imageBitmap }`.
- Uses `chrome.contextMenus` to trigger prompt from a service worker background.

### 3) Prompt API “text-only but structured output” pattern — “Calendar Mate” sample

Source: `~/dev-external/chrome-extensions-samples/functional-samples/ai.gemini-on-device-calendar-mate`

Key takeaways:
- Uses `LanguageModel.create({ temperature: 0, topK: 1.0 })` in background.
- Prompts for JSON and then post-processes model output to tolerate common JSON mistakes.

### 4) Reference loop behavior in standalone app

Source: `../my-speech-google`

Key takeaways:
- Repo purpose is explicitly: `STT (speech-to-text) → DSPy (LLM transform) → TTS (text-to-speech)`.
- Full loop script: `../my-speech-google/src/my_speech_google/scripts/loop.py`
  - Records mic → streams STT partial/final
  - transforms with DSPy (`respond_with_dspy`)
  - speaks back (`speak(response, prefer=...)`).

### 5) TTS from Chrome Extensions (legacy samples, still useful API shape)

Source: `~/dev-external/chrome-extensions-samples/_archive/...`

Key takeaways:
- `chrome.tts.speak(text, { voiceName, rate, pitch, volume, onEvent })` and `chrome.tts.stop()` patterns.
- Example: `_archive/mv2/extensions/speak_selection/background.js`.

## Working hypothesis for this repo

We can create a MV3 extension with:
1) **Audio input**: either
   - (A) follow Audio-Scribe: capture/fetch audio blobs from the page (good for WhatsApp Web voice notes etc.), or
   - (B) record from mic in a side panel / extension page (WebAudio / getUserMedia), then feed the recorded Blob to Prompt API as `{ type: 'audio', value: blob }`.
2) **STT**: Prompt API multimodal audio input to get transcript.
3) **AI step**: Prompt API text prompt using transcript as input (potentially same session or separate session).
4) **TTS**: `chrome.tts` (extension permission: `tts`) or browser `speechSynthesis`.

## Next investigation steps (to turn into an implementation plan)

- Decide audio source: page audio blobs vs mic recording.
- Confirm required Chrome version + origin trial needs (the samples set `minimum_chrome_version: 138` in some Prompt API demos, and include `trial_tokens` in multimodal samples).
- Define extension UI: side panel seems the most aligned with the samples.
- Define the “loop” UX: push-to-talk vs auto-detect audio messages.
