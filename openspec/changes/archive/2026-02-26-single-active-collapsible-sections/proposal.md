# Make side-panel sections easier to scan by allowing only one expanded section at a time

## Why

### Summary
The side panel currently shows all feature sections and nested content areas expanded by default. As users work in a small extension panel, this creates visual clutter, makes it harder to focus on one area, and increases time-to-task when trying to read or act on a single feature. Collapsing non-focused sections and keeping only one section open by default improves task focus and usability without changing core feature behavior.

### Original user request (verbatim)
The separate sections should be collapsible so that only one of them is active and the others are collapsed.

## What Changes

- Convert the top-level feature containers in the side panel into a single-active accordion pattern.
- Ensure only one feature section is expanded at any time; expanding one section collapses all others.
- Preserve all existing feature actions and outputs (recording, read selection, summarization, stop controls, and status logs).
- Keep section headers clickable and accessible with minimal layout disruption.
- Keep behavior predictable by automatically opening a section when its action is triggered.

## Capabilities

### New Capabilities
- `single-active-collapsible-sections`: The side panel shall expose feature sections as an accordion where only one top-level section can be expanded at a time.

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `sidepanel.html`: add semantic structure/controls for collapsible sections.
  - `sidepanel.css`: styling for collapsed and expanded section states.
  - `sidepanel.js`: interaction logic to enforce single active section.
- APIs/dependencies/systems: no new external dependencies or API contracts changed.
- No backend or background behavior changes.