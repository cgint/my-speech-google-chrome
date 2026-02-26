# Provide fast in-page read-aloud of user-selected text

## Context
The extension currently supports a side-panel speech workflow (record microphone audio → transcribe → generate response → speak). There is no direct path for users to have already-selected page text read aloud from the active tab.

Constraints and current state:
- Manifest currently has `sidePanel` and `tts` permissions only.
- TTS is already implemented in side panel (`chrome.tts`).
- Active page selection must be read from tab context, not from side panel context.
- User expectation is a simple interaction with minimal setup and clear behavior when no selection exists.

## Goals / Non-Goals

**Goals:**
- Enable a user action that reads currently selected text in the active tab.
- Keep behavior deterministic and simple: selected text is read as-is.
- Provide clear feedback for empty/missing selections and unsupported pages.
- Reuse existing extension architecture with minimal new complexity.

**Non-Goals:**
- No AI rewriting/summarization/translation before speaking.
- No persistent selection history or queue management.
- No redesign of the current side-panel recording workflow.

## Decisions

### Selection retrieval via active-tab script execution
- Decision: Use `chrome.scripting.executeScript` against the active tab to read `window.getSelection()?.toString()` at trigger time.
- Rationale: Selection lives in page context; this avoids permanent content scripts and keeps scope small.
- Alternative considered: persistent content script with message passing. Rejected for now due to higher complexity and broader page footprint.

### Trigger from side panel UI
- Decision: Add a dedicated side-panel control (e.g., “Read selected text”) that triggers retrieval + speaking.
- Rationale: The side panel is the existing interaction surface and already has status/output messaging.
- Alternative considered: browser action click or keyboard command only. Rejected initially because action click is already mapped to opening panel and commands require extra discoverability work.

### Speech execution centralized in side panel
- Decision: Reuse existing `speak()` function in `sidepanel.js` to read retrieved text.
- Rationale: Keeps TTS behavior consistent and minimizes duplicated logic.
- Alternative considered: move TTS to background service worker. Rejected for this change to avoid unnecessary refactor.

### Permissions update
- Decision: Add `scripting` and `activeTab` permissions in manifest.
- Rationale: Required to execute script in active tab context on user-triggered action.
- Alternative considered: broad host permissions. Rejected to keep least-privilege posture.

### Error and edge handling
- Decision: Normalize text (trim whitespace) and block speech when result is empty; show user-facing status explaining no selection was found.
- Rationale: Avoid confusing silent failures and unnecessary TTS calls.

## Risks / Trade-offs
- **[Risk] Restricted pages (e.g., Chrome internal pages) may block script execution** → **Mitigation:** show clear status that selection cannot be accessed on this page.
- **[Risk] Selection may contain very long text and create long speech output** → **Mitigation:** allow initial version to read full selection; optionally introduce length limits in future iteration.
- **[Risk] UI state confusion between recording flow and read-selection flow** → **Mitigation:** keep status messages explicit about which action is running.
- **[Trade-off] Side-panel-only trigger limits quick access from keyboard/action** → **Mitigation:** acceptable for first version; extend with commands later if needed.
