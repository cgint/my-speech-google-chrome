# Improve side-panel focus by limiting visible sections to one at a time

## Context
The side panel currently renders all top-level feature panels open simultaneously in a compact extension surface. This makes the UI feel busy and encourages scanning long text areas instead of direct interaction. The requirement is to improve readability and task focus, not to alter speech, permissions, or language behavior.

Constraints and current state:
- Existing code is static HTML/CSS/JS without a component framework.
- All feature interactions are already wired to DOM elements in `sidepanel.js`.
- Any accessibility regressions are acceptable to catch early because this feature affects discoverability and keyboard navigation.

## Goals / Non-Goals

**Goals:**
- Make each top-level feature area behave like an accordion section.
- Ensure only one top-level section is expanded at once.
- Preserve all existing feature actions and status outputs.
- Keep implementation in existing files (`sidepanel.html`, `sidepanel.css`, `sidepanel.js`) without new dependencies.

**Non-Goals:**
- Rebuilding the entire side-panel UI architecture.
- Changing the behavior of speech processing, tab-reading, or summarization logic.
- Supporting nested accordion behavior for all inner `<section>` blocks inside features.

## Decisions

### 1) Keep implementation in vanilla DOM controls
- **Decision:** Implement accordion behavior with native `details/summary` semantics.
- **Rationale:** Minimal JavaScript, good built-in accessibility, no third-party dependency.
- **Alternatives considered:**
  - Custom button + class toggling: more custom event/state code and manual accessibility management.
  - CSS-only sibling selectors: fragile for preserving existing action-trigger flows and dynamic state updates.

### 2) Enforce single-open behavior in JavaScript
- **Decision:** Attach one change handler to section toggles that closes all other sections when one opens.
- **Rationale:** Single source of truth for mutual exclusivity and easy future extension (e.g., programmatically opening section on action click).
- **Alternatives considered:**
  - Relying on browser-only behavior (`name` attribute pattern): unavailable for `details`/`summary` in all target environments.
  - Purely CSS-only accordion effects: cannot robustly manage one-open state with dynamic content updates.

### 3) Auto-expand section on action trigger
- **Decision:** When a section action starts (e.g., Read, Summarize, Start recording), call the same “open section” helper before running the existing handler.
- **Rationale:** Maintains user alignment between intent and visible context.
- **Alternative:** Leave sections untouched on actions. This risks user confusion when they click a control inside a collapsed section.

### 4) Preserve default open state
- **Decision:** Open Speech Loop by default so the primary flow remains immediately visible.
- **Rationale:** Current interface currently surfaces all content; opening one section by default preserves discoverability of the primary feature.
- **Alternative:** Start with all collapsed. This reduces initial context and adds one extra click in the common path.

## Risks / Trade-offs

- **[Risk] Browser behavior differences for collapsible details elements** → **Mitigation:** test in the target Chrome version and style with explicit attributes (`open`) to keep deterministic state.
- **[Risk] Collapsing inner content may reduce discoverability of controls** → **Mitigation:** ensure each section header remains clear with visible action controls after expansion.
- **[Risk] Existing status messages may be hidden when section is collapsed** → **Mitigation:** auto-open sections for action-driven updates.

## Migration Plan

1. Ship as a UI-only change in the side panel bundle.
2. Build and reload `dist/` and verify no regression in feature flows.
3. If any section state confusion appears, expand default state can be adjusted quickly via HTML `open` attribute and JavaScript helper.

## Open Questions

- Should inner sections (Status/Transcript/Summary areas) also become separate collapsibles in a follow-up iteration?
- Should the extension remember the last-opened section across panel reopen for persistence, or always reset each session?
