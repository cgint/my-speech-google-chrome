# Let users quickly listen to selected page content without leaving their workflow

## Why

### Summary
The current extension supports a speech loop in the side panel, but it does not provide a direct way to read arbitrary text the user already selected on a webpage. This creates unnecessary friction for users who want fast read-aloud of specific passages (e.g., paragraphs, snippets, or highlighted instructions) in the active tab. Adding selected-text read-aloud improves accessibility and speed for focused, in-context listening.

Reference: project README describes the existing speech loop scope (STT → AI → TTS) and confirms this extension is currently centered on side-panel interactions.

### Original user request (verbatim)
i want a new feature that simply reads the user-selected part of the web page open at the active tab

## What Changes

- Add a user-facing capability to read aloud the currently selected text from the active browser tab.
- Detect the current text selection in the active tab when the user triggers the action.
- Send the selected text to extension logic and speak it via existing TTS integration (`chrome.tts`).
- Provide clear handling for empty selection (e.g., notify user that no text is selected).
- Keep behavior simple and focused: read the selected text directly, without requiring AI transformation.

## Capabilities

### New Capabilities
- `read-selected-text`: Allow the user to trigger read-aloud for text currently selected in the active tab, including graceful handling when no text is selected.

### Modified Capabilities
- None.

## Impact

- Likely affected areas:
  - Extension background/service worker logic (`background.js`) to orchestrate active-tab interaction and TTS.
  - UI trigger surface (toolbar action, side panel action, or command wiring) to initiate selected-text reading.
  - Potential addition of a content-script interaction path to retrieve window selection from web pages.
- APIs/systems involved:
  - Chrome extension tab APIs (query active tab, message passing).
  - `chrome.scripting` and/or content-script execution for selection access.
  - `chrome.tts` for speech output.
- Dependencies:
  - No new third-party runtime dependencies expected.
