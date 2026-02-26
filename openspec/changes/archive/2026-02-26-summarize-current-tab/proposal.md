# Enable One-Click Tab Summaries That Can Be Read Aloud

## Why

### Summary
Today, the extension can read selected text, but there is no direct way to summarize an entire open tab and then listen only to that summary. Users who want a quick audio digest must manually copy content or rely on selection-based flows, which adds friction and breaks the fast “listen while browsing” experience. This change adds a dedicated summarize-and-read-summary flow so users can get concise spoken insights from the current page in one place.

### Original user request (verbatim)
"similar to \"Read Selected Text\" i want a feature that summarizes the content of the current open tab using PromptAPI like we do in the \"Speech Loop\"
1) Button \"Summarize\" 
2) Summary is created and written to textarea
3) Use can click \"Read summary\"
4) Only the the summary is spoken"

## What Changes

- Add a new UI action button: **Summarize**.
- When clicked, gather the content of the currently active tab and send it to Prompt API for summarization.
- Write the generated summary into the existing textarea (or summary text area in the same panel flow).
- Add a new UI action button: **Read summary**.
- Ensure **Read summary** speaks only the summary text currently stored in the summary textarea.
- Keep this flow aligned with existing Speech Loop conventions for Prompt API usage and extension UX.

## Capabilities

### New Capabilities
- `summarize-current-tab`: Summarize the active tab content into a textarea and provide a dedicated action to speak only that summary.

### Modified Capabilities
- None.

## Impact

- Affected areas: side panel UI (new buttons and state wiring), background/content communication for active-tab content extraction, Prompt API summarization orchestration, and TTS invocation path for summary-only speaking.
- External APIs: Chrome extension tab/content APIs, Prompt API, and `chrome.tts`.
- Dependencies: no new external package dependencies expected; implementation should reuse existing Prompt API and Speech Loop plumbing.
