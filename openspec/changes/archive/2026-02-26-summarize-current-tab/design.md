# Deliver Fast Page Digests Users Can Listen To Immediately

## Context
The side panel currently supports two flows:
1. **Speech Loop**: record audio, transcribe with Prompt API, generate a response, and speak it.
2. **Read Selected Text**: read currently selected page text aloud.

The requested feature adds a third flow: summarize the current open tab and speak only that summary. Existing code already includes:
- Prompt API session lifecycle (`LanguageModel` availability checks and shared output language handling)
- TTS playback helpers with stop controls (`speak`, `stopSpeaking`)
- active-tab script injection via `chrome.scripting.executeScript`

This makes the change cross-cutting across side-panel UI, active-tab extraction logic, and Prompt API orchestration, but still within the extension’s existing architecture.

## Goals / Non-Goals

**Goals:**
- Add a **Summarize** button that summarizes content from the current active tab.
- Display the generated summary in the side panel textarea/output area.
- Add a **Read summary** button that speaks only the summary content.
- Reuse the existing Prompt API + language selection approach used by Speech Loop.
- Keep failure handling explicit (no active tab content, inaccessible tab, Prompt API errors).

**Non-Goals:**
- No redesign of Speech Loop or Read Selected Text.
- No background/offline caching of full page content.
- No multi-tab summarization, history, or persistence beyond current session unless already present.
- No change to extension permissions model beyond what is necessary to read page content.

## Decisions

### Decision 1: Add a dedicated “Summarize Current Tab” section in side panel UI
- **Choice**: Introduce separate controls and status/output region (`Summarize`, `Read summary`, status, summary text area/output).
- **Rationale**: Keeps feature boundaries clear and avoids overloading the Read Selected Text section.
- **Alternative considered**: Reusing the Read Selected Text output area and controls; rejected because actions and expected output semantics differ.

### Decision 2: Reuse active-tab script execution to extract page text
- **Choice**: Use `chrome.tabs.query` + `chrome.scripting.executeScript` on active tab to retrieve page text payload (e.g., `document.body?.innerText`).
- **Rationale**: Matches the established selection-reading pattern and avoids adding a new architecture path.
- **Alternative considered**: Content script with message passing; rejected for now as unnecessary complexity for this scope.

### Decision 3: Reuse Prompt API session patterns from Speech Loop with a summarization-oriented prompt
- **Choice**: Create/reuse a text model session and send extracted tab text with concise summarization instruction.
- **Rationale**: Existing Prompt API bootstrap and error handling are proven in the project.
- **Alternative considered**: New external summarization API; rejected due to dependency and privacy complexity.

### Decision 4: Restrict speech output in this flow to summary text only
- **Choice**: `Read summary` uses the summary field as single source of truth; no fallback to raw tab text.
- **Rationale**: Directly matches user requirement that only summary is spoken.
- **Alternative considered**: Speak original tab text if summary absent; rejected as it violates requirement.

## Risks / Trade-offs
- **[Risk] Large page text exceeds practical prompt size** → **Mitigation:** truncate extracted text to a safe input budget and state this behavior in implementation notes/status.
- **[Risk] Script injection blocked on restricted pages (e.g., Chrome internal pages)** → **Mitigation:** provide explicit status message and do not attempt TTS.
- **[Risk] UX confusion among multiple stop buttons/sections** → **Mitigation:** keep section-specific labels and reuse explicit status text for each feature.
- **[Trade-off] Direct `innerText` extraction is simple but noisy** → **Mitigation:** accept for first version; refine extraction later if quality feedback requires it.

## Migration Plan
1. Add new side panel HTML controls and output area for summarization.
2. Extend sidepanel logic with tab-text extraction, summarization call, and summary-only TTS action.
3. Wire status updates and disabled-state handling similar to existing flows.
4. Validate manually in regular website tabs and failure contexts (no content/inaccessible tabs).

Rollback: remove new UI section and associated handlers; existing Speech Loop and Read Selected Text remain unaffected.

## Open Questions
- Should the summary output be a `<textarea>` (editable) or `<pre>` (read-only)? User asked for textarea, so default should be editable unless product direction says otherwise.
- What exact max input length should be enforced before summarization to balance quality and model limits?
